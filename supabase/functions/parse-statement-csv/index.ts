import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getRequiredWorkspaceId } from '../_shared/workspace.ts'
import { generateTransactionExternalId } from '../_shared/idempotency.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============= CONSTANTS =============
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_MIME_TYPES = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];
const REQUIRED_COLUMNS = ['date', 'amount']; // description is optional but recommended

// ============= TYPES =============
interface ParsedTransaction {
  user_id: string;
  workspace_id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category_id: string | null;
  document_id: string;
  external_id: string;
  source: string;
}

interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: Array<{ line: number; reason: string }> | null;
  imported: number;
  failed: number;
  warnings: string[];
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings: string[];
}

// ============= VALIDATION =============

function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function validateMimeType(mimeType: string | null): ValidationResult {
  const warnings: string[] = [];
  
  if (!mimeType) {
    warnings.push('Type MIME non détecté, traitement comme CSV');
    return { valid: true, warnings };
  }
  
  if (!VALID_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return { 
      valid: false, 
      error: `Type de fichier invalide: ${mimeType}. Types acceptés: CSV, TXT`,
      warnings 
    };
  }
  
  return { valid: true, warnings };
}

function validateFileSize(size: number): ValidationResult {
  if (size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Fichier trop volumineux: ${(size / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB`,
      warnings: [] 
    };
  }
  return { valid: true, warnings: [] };
}

function validateCsvStructure(lines: string[]): ValidationResult {
  const warnings: string[] = [];
  
  // Check minimum lines (header + at least 1 data row)
  if (lines.length < 2) {
    return { 
      valid: false, 
      error: 'Le fichier CSV est vide ou ne contient que l\'en-tête',
      warnings 
    };
  }
  
  // Parse header
  const header = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
  
  // Check for required columns
  const dateColumns = ['date', 'transaction date', 'date comptable', 'date opération', 'date_operation'];
  const amountColumns = ['amount', 'montant', 'debit', 'credit', 'valeur', 'somme'];
  const descColumns = ['description', 'libellé', 'libelle', 'label', 'memo', 'référence', 'reference'];
  
  const hasDate = header.some(h => dateColumns.some(dc => h.includes(dc)));
  const hasAmount = header.some(h => amountColumns.some(ac => h.includes(ac)));
  const hasDesc = header.some(h => descColumns.some(dc => h.includes(dc)));
  
  if (!hasDate) {
    return { 
      valid: false, 
      error: `Colonne "date" requise non trouvée. Colonnes détectées: ${header.join(', ')}`,
      warnings 
    };
  }
  
  if (!hasAmount) {
    return { 
      valid: false, 
      error: `Colonne "montant/amount" requise non trouvée. Colonnes détectées: ${header.join(', ')}`,
      warnings 
    };
  }
  
  if (!hasDesc) {
    warnings.push('Colonne "description" non trouvée, les transactions auront une description générique');
  }
  
  // Check for very large files
  if (lines.length > 10000) {
    warnings.push(`Fichier volumineux (${lines.length} lignes), le traitement peut prendre du temps`);
  }
  
  return { valid: true, warnings };
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const cleaned = dateStr.trim();
  
  // Common date formats
  const dateFormats = [
    { regex: /^(\d{4})-(\d{2})-(\d{2})/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` },
    { regex: /^(\d{2})\/(\d{2})\/(\d{4})/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
    { regex: /^(\d{2})-(\d{2})-(\d{4})/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
    { regex: /^(\d{2})\.(\d{2})\.(\d{4})/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
    { regex: /^(\d{4})\/(\d{2})\/(\d{2})/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` },
  ];
  
  for (const { regex, format } of dateFormats) {
    const match = cleaned.match(regex);
    if (match) {
      const formatted = format(match);
      // Validate the date is actually valid
      const date = new Date(formatted);
      if (!isNaN(date.getTime())) {
        return formatted;
      }
    }
  }
  
  return null;
}

function parseAmount(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === '') return null;
  
  // Clean the amount string
  let cleaned = amountStr.trim();
  
  // Handle European format (comma as decimal separator)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  }
  
  // Remove currency symbols and spaces
  cleaned = cleaned.replace(/[€$£\s]/g, '');
  
  // Remove thousands separators
  cleaned = cleaned.replace(/(\d)\.(?=\d{3})/g, '$1');
  cleaned = cleaned.replace(/(\d),(?=\d{3})/g, '$1');
  
  // Keep only digits, minus, and decimal point
  cleaned = cleaned.replace(/[^\d.-]/g, '');
  
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) return null;
  
  return parsed;
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
      return new Response(JSON.stringify({ 
        success: false, 
        transactions: [], 
        errors: [{ line: 0, reason: 'Unauthorized' }],
        imported: 0,
        failed: 0,
        warnings: []
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        transactions: [], 
        errors: [{ line: 0, reason: 'Unauthorized' }],
        imported: 0,
        failed: 0,
        warnings: []
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ========== MULTI-TENANT: Get required workspace_id (never null) ==========
    const workspaceId = await getRequiredWorkspaceId(supabase, user.id)

    const body = await req.json()
    const { documentId } = body

    // ========== VALIDATION 1: UUID ==========
    if (!isUUID(documentId)) {
      return new Response(JSON.stringify({ 
        success: false,
        transactions: [],
        errors: [{ line: 0, reason: 'documentId must be a valid UUID' }],
        imported: 0,
        failed: 0,
        warnings: []
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ========== VALIDATION 2: Document exists ==========
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return new Response(JSON.stringify({ 
        success: false,
        transactions: [],
        errors: [{ line: 0, reason: 'Document non trouvé ou accès non autorisé' }],
        imported: 0,
        failed: 0,
        warnings: []
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ========== VALIDATION 3: MIME Type ==========
    const mimeValidation = validateMimeType(document.mime_type);
    if (!mimeValidation.valid) {
      await supabase.from('documents').update({
        parsed_status: 'failed',
        parse_errors: { message: mimeValidation.error },
        parsed_at: new Date().toISOString()
      }).eq('id', documentId)

      return new Response(JSON.stringify({ 
        success: false,
        transactions: [],
        errors: [{ line: 0, reason: mimeValidation.error! }],
        imported: 0,
        failed: 0,
        warnings: mimeValidation.warnings
      }), {
        status: 400,
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

    if (downloadError) {
      await supabase.from('documents').update({
        parsed_status: 'failed',
        parse_errors: { message: 'Impossible de télécharger le fichier' },
        parsed_at: new Date().toISOString()
      }).eq('id', documentId)

      return new Response(JSON.stringify({ 
        success: false,
        transactions: [],
        errors: [{ line: 0, reason: 'Impossible de télécharger le fichier' }],
        imported: 0,
        failed: 0,
        warnings: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const csvText = await fileData.text()
    
    // ========== VALIDATION 4: File size ==========
    const sizeValidation = validateFileSize(csvText.length);
    if (!sizeValidation.valid) {
      await supabase.from('documents').update({
        parsed_status: 'failed',
        parse_errors: { message: sizeValidation.error },
        parsed_at: new Date().toISOString()
      }).eq('id', documentId)

      return new Response(JSON.stringify({ 
        success: false,
        transactions: [],
        errors: [{ line: 0, reason: sizeValidation.error! }],
        imported: 0,
        failed: 0,
        warnings: []
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const lines = csvText.split('\n').filter(line => line.trim())

    // ========== VALIDATION 5: CSV Structure ==========
    const structureValidation = validateCsvStructure(lines);
    if (!structureValidation.valid) {
      await supabase.from('documents').update({
        parsed_status: 'failed',
        parse_errors: { message: structureValidation.error },
        parsed_at: new Date().toISOString()
      }).eq('id', documentId)

      return new Response(JSON.stringify({ 
        success: false,
        transactions: [],
        errors: [{ line: 0, reason: structureValidation.error! }],
        imported: 0,
        failed: 0,
        warnings: structureValidation.warnings
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const allWarnings = [
      ...mimeValidation.warnings,
      ...structureValidation.warnings
    ];

    // Parse header to detect columns
    const header = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase())
    
    const dateColumns = ['date', 'transaction date', 'date comptable', 'date opération', 'date_operation']
    const amountColumns = ['amount', 'montant', 'debit', 'credit', 'valeur', 'somme']
    const descColumns = ['description', 'libellé', 'libelle', 'label', 'memo', 'référence', 'reference']

    const dateIdx = header.findIndex(h => dateColumns.some(dc => h.includes(dc)))
    const amountIdx = header.findIndex(h => amountColumns.some(ac => h.includes(ac)))
    const descIdx = header.findIndex(h => descColumns.some(dc => h.includes(dc)))

    // Get existing categories for auto-categorization
    const { data: existingCategories } = await supabase
      .from('finance_categories')
      .select('id, name')
      .eq('user_id', user.id)

    const categoryMap = new Map(existingCategories?.map(c => [c.name.toLowerCase(), c.id]) || [])

    // ========== VALIDATION 6: Parse and validate each line ==========
    const transactions: ParsedTransaction[] = []
    const errors: Array<{ line: number; reason: string }> = []
    const newCategories: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const lineNumber = i + 1;
      
      try {
        const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ''))
        
        // Skip completely empty lines
        if (values.every(v => v === '')) {
          continue;
        }
        
        const dateStr = values[dateIdx]
        const amountStr = values[amountIdx]
        const description = descIdx >= 0 ? values[descIdx] : `Transaction ligne ${lineNumber}`

        // Validate date
        const parsedDate = parseDate(dateStr);
        if (!parsedDate) {
          errors.push({ 
            line: lineNumber, 
            reason: `Date invalide: "${dateStr}". Formats acceptés: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY` 
          });
          continue;
        }

        // Validate amount
        const amount = parseAmount(amountStr);
        if (amount === null) {
          errors.push({ 
            line: lineNumber, 
            reason: `Montant invalide: "${amountStr}". Doit être un nombre valide` 
          });
          continue;
        }

        // Validate amount is not zero (usually indicates parsing error)
        if (amount === 0) {
          allWarnings.push(`Ligne ${lineNumber}: montant égal à zéro, peut-être une erreur`);
        }
        
        // ========== AUTO-CATEGORIZATION ==========
        const { category: suggestedCategory, suggestedType } = categorizeTransaction(description)
        let categoryId: string | null = null
        
        if (suggestedCategory) {
          categoryId = categoryMap.get(suggestedCategory.toLowerCase()) || null
          if (!categoryId && !newCategories.includes(suggestedCategory)) {
            newCategories.push(suggestedCategory)
          }
        }

        // ========== IDEMPOTENCY: Generate robust external_id (hash-based) ==========
        const externalId = generateTransactionExternalId(
          documentId,
          i,
          parsedDate,
          amount,
          description
        )

        transactions.push({
          user_id: user.id,
          workspace_id: workspaceId,
          date: parsedDate,
          amount: Math.abs(amount),
          type: suggestedType || (amount < 0 ? 'expense' : 'income'),
          description,
          category_id: categoryId,
          document_id: documentId,
          external_id: externalId,
          source: 'integration'
        })
      } catch (e) {
        errors.push({ line: lineNumber, reason: `Erreur de parsing: ${(e as Error).message}` })
      }
    }

    // Create new categories discovered during parsing
    for (const catName of newCategories) {
      const { data: newCat } = await supabase
        .from('finance_categories')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          name: catName,
          type: 'expense',
        })
        .select()
        .single()
      
      if (newCat) {
        categoryMap.set(catName.toLowerCase(), newCat.id)
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

    // Determine final status
    const success = transactions.length > 0;
    const finalStatus = errors.length > 0 && transactions.length === 0 ? 'failed' : 'completed';

    // Update document status
    await supabase.from('documents').update({
      parsed_status: finalStatus,
      parsed_at: new Date().toISOString(),
      transactions_count: transactions.length,
      parse_errors: errors.length > 0 ? { 
        errors: errors.slice(0, 50), // Limit stored errors
        total_errors: errors.length,
        warnings: allWarnings
      } : null
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
        categories_created: newCategories.length,
        warnings: allWarnings.length
      }
    })

    // Return structured result
    const result: ParseResult = {
      success,
      transactions: [], // Don't return full transactions in response (too large)
      errors: errors.length > 0 ? errors.slice(0, 20) : null, // Return first 20 errors
      imported: transactions.length,
      failed: errors.length,
      warnings: allWarnings
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error:', error)
    
    return new Response(JSON.stringify({ 
      success: false,
      transactions: [],
      errors: [{ line: 0, reason: error.message }],
      imported: 0,
      failed: 0,
      warnings: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
