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

    // PDF parsing is complex and requires external service or manual mapping
    // For now, mark as pending manual review
    await supabase.from('documents').update({
      parsed_status: 'completed',
      parsed_at: new Date().toISOString(),
      parse_errors: { 
        message: 'PDF parsing requires manual transaction entry or AI extraction',
        suggestion: 'Please export your bank statement as CSV for automatic parsing, or manually add transactions.'
      }
    }).eq('id', documentId)

    // Log to audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'PARSE_ATTEMPT',
      entity: 'documents',
      entity_id: documentId,
      new_value: { status: 'manual_review_required', type: 'pdf' }
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'PDF uploaded successfully. Please export as CSV for automatic parsing or add transactions manually.',
      requires_manual_entry: true
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
