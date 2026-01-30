import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============= VALIDATION =============

function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

async function getUserWorkspaceId(supabase: any, userId: string): Promise<string | null> {
  const { data: membership } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return membership?.workspace_id || null;
}

// ============= CATEGORIZATION RULES =============

interface CategoryRule {
  keywords: string[];
  category: string;
  type: 'expense' | 'income';
}

const CATEGORY_RULES: CategoryRule[] = [
  { keywords: ['salaire', 'salary', 'paie', 'virement employeur'], category: 'Salaire', type: 'income' },
  { keywords: ['loyer', 'rent', 'bail'], category: 'Logement', type: 'expense' },
  { keywords: ['edf', 'engie', 'électricité', 'gaz', 'energie'], category: 'Énergie', type: 'expense' },
  { keywords: ['carrefour', 'auchan', 'leclerc', 'lidl', 'intermarche', 'supermarché', 'courses'], category: 'Alimentation', type: 'expense' },
  { keywords: ['uber', 'taxi', 'sncf', 'ratp', 'train', 'transport'], category: 'Transport', type: 'expense' },
  { keywords: ['amazon', 'fnac', 'darty', 'cdiscount'], category: 'Shopping', type: 'expense' },
  { keywords: ['restaurant', 'mcdonalds', 'deliveroo', 'ubereats'], category: 'Restauration', type: 'expense' },
  { keywords: ['netflix', 'spotify', 'disney', 'prime', 'abonnement'], category: 'Abonnements', type: 'expense' },
  { keywords: ['assurance', 'mutuelle', 'insurance'], category: 'Assurance', type: 'expense' },
  { keywords: ['médecin', 'pharmacie', 'santé', 'docteur'], category: 'Santé', type: 'expense' },
  { keywords: ['épargne', 'livret', 'placement'], category: 'Épargne', type: 'income' },
];

function categorizeTransaction(description: string): { category: string | null; suggestedType: 'income' | 'expense' | null } {
  const lowerDesc = description.toLowerCase();
  
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lowerDesc.includes(kw))) {
      return { category: rule.category, suggestedType: rule.type };
    }
  }
  
  return { category: null, suggestedType: null };
}

// ============= MAIN HANDLER =============

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

    // Get user's workspace_id for multi-tenant inserts
    const workspaceId = await getUserWorkspaceId(supabase, user.id)

    const body = await req.json()
    const { documentId } = body

    // ========== STRONG VALIDATION ==========
    if (!isUUID(documentId)) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: 'documentId must be a valid UUID' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get document (with user_id check for security)
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

    // Get existing categories for auto-categorization
    const { data: existingCategories } = await supabase
      .from('finance_categories')
      .select('id, name')
      .eq('user_id', user.id)

    const categoryMap = new Map(existingCategories?.map(c => [c.name.toLowerCase(), c.id]) || [])

    // Parse transactions
    const transactions = []
    const errors = []
    const newCategories: string[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ''))
        
        const dateStr = values[dateIdx]
        const amountStr = values[amountIdx]?.replace(/[^\d.-]/g, '')
        const description = descIdx >= 0 ? values[descIdx] : `Transaction ${i}`

        // Parse date
        let parsedDate
        const dateFormats = [
          /^(\d{4})-(\d{2})-(\d{2})/,
          /^(\d{2})\/(\d{2})\/(\d{4})/,
          /^(\d{2})-(\d{2})-(\d{4})/,
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
        
        // ========== AUTO-CATEGORIZATION ==========
        const { category: suggestedCategory, suggestedType } = categorizeTransaction(description)
        let categoryId = null
        
        if (suggestedCategory) {
          categoryId = categoryMap.get(suggestedCategory.toLowerCase()) || null
          if (!categoryId && !newCategories.includes(suggestedCategory)) {
            newCategories.push(suggestedCategory)
          }
        }

        // Generate external_id for idempotency (UNIQUE constraint)
        const externalId = `${documentId}_${i}_${parsedDate}_${amount}`

        transactions.push({
          user_id: user.id,
          workspace_id: workspaceId, // MULTI-TENANT
          date: parsedDate,
          amount: Math.abs(amount),
          type: suggestedType || (amount < 0 ? 'expense' : 'income'),
          description,
          category_id: categoryId,
          document_id: documentId,
          external_id: externalId, // IDEMPOTENCY
          source: 'csv_import'
        })
      } catch (e) {
        errors.push({ line: i + 1, reason: (e as Error).message })
      }
    }

    // Create new categories discovered during parsing
    for (const catName of newCategories) {
      const { data: newCat } = await supabase
        .from('finance_categories')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId, // MULTI-TENANT
          name: catName,
          type: 'expense',
        })
        .select()
        .single()
      
      if (newCat) {
        categoryMap.set(catName.toLowerCase(), newCat.id)
        // Update transactions with new category ID
        transactions
          .filter(t => {
            const { category } = categorizeTransaction(t.description)
            return category?.toLowerCase() === catName.toLowerCase()
          })
          .forEach(t => { t.category_id = newCat.id })
      }
    }

    // Upsert transactions (idempotent - uses external_id)
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
      new_value: { 
        transactions_imported: transactions.length, 
        errors: errors.length,
        categories_created: newCategories.length
      }
    })

    return new Response(JSON.stringify({
      success: true,
      transactions_imported: transactions.length,
      categories_created: newCategories,
      errors: errors.length,
      error_details: errors.slice(0, 10)
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
