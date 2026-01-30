import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const accountLabel = formData.get('accountLabel') as string
    const dateFrom = formData.get('dateFrom') as string
    const dateTo = formData.get('dateTo') as string

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/pdf', 'application/vnd.ms-excel']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Only CSV and PDF allowed.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate storage path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${user.id}/${timestamp}_${sanitizedName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) throw uploadError

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        document_type: 'bank_statement',
        account_label: accountLabel || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        parsed_status: 'pending',
        source: 'upload'
      })
      .select()
      .single()

    if (docError) throw docError

    // Log to audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'UPLOAD',
      entity: 'documents',
      entity_id: document.id,
      new_value: { filename: file.name, size: file.size, type: file.type }
    })

    // Trigger parsing based on file type
    const parseEndpoint = file.type === 'application/pdf' 
      ? 'parse-statement-pdf' 
      : 'parse-statement-csv'

    // Fire and forget - async parsing
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${parseEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId: document.id })
    }).catch(console.error)

    return new Response(JSON.stringify({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        status: document.parsed_status
      },
      message: 'File uploaded. Parsing in progress...'
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
