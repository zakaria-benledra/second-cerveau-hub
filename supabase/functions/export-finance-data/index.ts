import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getWorkspaceContext } from '../_shared/workspace.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  format: 'csv' | 'json'
  start_date?: string
  end_date?: string
  category_id?: string
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
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
    // Auth
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

    const workspaceContext = await getWorkspaceContext(supabase, user.id)
    if (!workspaceContext.workspaceId) {
      return new Response(JSON.stringify({ error: 'No workspace found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body: ExportRequest = await req.json()
    const { format = 'csv', start_date, end_date, category_id } = body

    // Build query
    let query = supabase
      .from('finance_transactions')
      .select('*, finance_categories(name, type)')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceContext.workspaceId)
      .order('date', { ascending: false })

    if (start_date) {
      query = query.gte('date', start_date)
    }
    if (end_date) {
      query = query.lte('date', end_date)
    }
    if (category_id) {
      query = query.eq('category_id', category_id)
    }

    const { data: transactions, error: fetchError } = await query

    if (fetchError) throw fetchError

    // Log export to audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'EXPORT',
      entity: 'finance_transactions',
      new_value: {
        format,
        start_date,
        end_date,
        category_id,
        record_count: transactions?.length || 0,
      }
    })

    // Track product event
    await supabase.from('user_journey_events').insert({
      user_id: user.id,
      workspace_id: workspaceContext.workspaceId,
      event_type: 'feature_used',
      entity: 'finance_export',
      payload: { format, record_count: transactions?.length || 0 }
    })

    if (format === 'json') {
      return new Response(JSON.stringify({
        success: true,
        data: transactions,
        exported_at: new Date().toISOString(),
        record_count: transactions?.length || 0,
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="finance_export_${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }

    // CSV format
    const headers = ['date', 'description', 'amount', 'type', 'category', 'source']
    const rows = transactions?.map(t => [
      escapeCSV(t.date),
      escapeCSV(t.description),
      escapeCSV(t.amount),
      escapeCSV(t.type),
      escapeCSV((t.finance_categories as any)?.name || ''),
      escapeCSV(t.source),
    ].join(',')) || []

    const csv = [headers.join(','), ...rows].join('\n')

    return new Response(csv, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="finance_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error exporting finance data:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
