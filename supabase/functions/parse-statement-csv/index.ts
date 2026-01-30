import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { documentId } = await req.json()

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ parsed_status: 'processing' })
      .eq('id', documentId)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.storage_path)

    if (downloadError) throw downloadError

    const csvText = await fileData.text()
    const lines = csvText.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      await supabase.from('documents').update({
        parsed_status: 'failed',
        parse_errors: { message: 'CSV file is empty or has no data rows' },
        parsed_at: new Date().toISOString()
      }).eq('id', documentId)

      return new Response(JSON.stringify({ error: 'CSV file is empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse header to detect columns
    const header = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase())
    
    // Common column mappings
    const dateColumns = ['date', 'transaction date', 'date comptable', 'date opération']
    const amountColumns = ['amount', 'montant', 'debit', 'credit', 'valeur']
    const descColumns = ['description', 'libellé', 'libelle', 'label', 'memo', 'référence']

    const dateIdx = header.findIndex(h => dateColumns.some(dc => h.includes(dc)))
    const amountIdx = header.findIndex(h => amountColumns.some(ac => h.includes(ac)))
    const descIdx = header.findIndex(h => descColumns.some(dc => h.includes(dc)))

    if (dateIdx === -1 || amountIdx === -1) {
      await supabase.from('documents').update({
        parsed_status: 'failed',
        parse_errors: { 
          message: 'Could not detect date or amount columns',
          detected_headers: header
        },
        parsed_at: new Date().toISOString()
      }).eq('id', documentId)

      return new Response(JSON.stringify({ 
        error: 'Could not detect required columns',
        headers: header
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse transactions
    const transactions = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ''))
        
        const dateStr = values[dateIdx]
        const amountStr = values[amountIdx]?.replace(/[^\d.-]/g, '')
        const description = descIdx >= 0 ? values[descIdx] : `Transaction ${i}`

        // Parse date (try multiple formats)
        let parsedDate
        const dateFormats = [
          /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
          /^(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
          /^(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
        ]
        
        for (const format of dateFormats) {
          const match = dateStr.match(format)
          if (match) {
            if (format === dateFormats[0]) {
              parsedDate = `${match[1]}-${match[2]}-${match[3]}`
            } else {
              parsedDate = `${match[3]}-${match[2]}-${match[1]}`
            }
            break
          }
        }

        if (!parsedDate || isNaN(parseFloat(amountStr))) {
          errors.push({ line: i + 1, reason: 'Invalid date or amount' })
          continue
        }

        const amount = parseFloat(amountStr)
        transactions.push({
          user_id: user.id,
          workspace_id: document.workspace_id,
          date: parsedDate,
          amount: Math.abs(amount),
          type: amount < 0 ? 'expense' : 'income',
          description,
          document_id: documentId,
          external_id: `${documentId}_${i}`,
          source: 'csv_import'
        })
      } catch (e) {
        errors.push({ line: i + 1, reason: (e as Error).message })
      }
    }

    // Upsert transactions
    if (transactions.length > 0) {
      const { error: insertError } = await supabase
        .from('finance_transactions')
        .upsert(transactions, {
          onConflict: 'user_id,external_id',
          ignoreDuplicates: false
        })

      if (insertError) throw insertError
    }

    // Update document status
    await supabase.from('documents').update({
      parsed_status: errors.length > 0 && transactions.length === 0 ? 'failed' : 'completed',
      parsed_at: new Date().toISOString(),
      transactions_count: transactions.length,
      parse_errors: errors.length > 0 ? { errors, total_errors: errors.length } : null
    }).eq('id', documentId)

    // Log to audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'PARSE',
      entity: 'documents',
      entity_id: documentId,
      new_value: { transactions_imported: transactions.length, errors: errors.length }
    })

    return new Response(JSON.stringify({
      success: true,
      transactions_imported: transactions.length,
      errors: errors.length,
      error_details: errors.slice(0, 10) // First 10 errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
