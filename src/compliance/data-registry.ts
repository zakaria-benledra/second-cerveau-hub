// Registre des traitements de données (Article 30 RGPD)

export interface DataProcessing {
  name: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legitimate_interest';
  categories: string[];
  retention: string;
  recipients: string[];
  transfers: string[];
  automated: boolean;
  profiling: boolean;
}

export const DATA_PROCESSING_REGISTRY: DataProcessing[] = [
  {
    name: 'habits_tracking',
    purpose: 'Suivi des habitudes pour aide à la transformation comportementale',
    legalBasis: 'contract',
    categories: ['behavioral_data', 'timestamps'],
    retention: '3 years from last activity',
    recipients: ['internal_only'],
    transfers: ['none'],
    automated: false,
    profiling: true,
  },
  {
    name: 'sage_intelligence',
    purpose: 'Personnalisation des recommandations IA',
    legalBasis: 'consent',
    categories: ['behavioral_data', 'preferences', 'patterns'],
    retention: 'until consent withdrawal',
    recipients: ['llm_provider_anonymized'],
    transfers: ['EU_only_or_SCC'],
    automated: true,
    profiling: true,
  },
  {
    name: 'analytics',
    purpose: 'Amélioration du produit (agrégé/anonymisé)',
    legalBasis: 'legitimate_interest',
    categories: ['usage_statistics'],
    retention: '2 years',
    recipients: ['internal_only'],
    transfers: ['none'],
    automated: false,
    profiling: false,
  },
  {
    name: 'tasks_management',
    purpose: 'Gestion des tâches et projets utilisateur',
    legalBasis: 'contract',
    categories: ['productivity_data', 'timestamps'],
    retention: '3 years from last activity',
    recipients: ['internal_only'],
    transfers: ['none'],
    automated: false,
    profiling: false,
  },
  {
    name: 'finance_tracking',
    purpose: 'Suivi des transactions financières personnelles',
    legalBasis: 'contract',
    categories: ['financial_data', 'transactions'],
    retention: '5 years (obligations légales)',
    recipients: ['internal_only'],
    transfers: ['none'],
    automated: false,
    profiling: true,
  },
  {
    name: 'journal_entries',
    purpose: 'Journal de réflexion personnel',
    legalBasis: 'contract',
    categories: ['personal_reflections', 'mood_data'],
    retention: '3 years from last activity',
    recipients: ['internal_only'],
    transfers: ['none'],
    automated: false,
    profiling: false,
  },
  {
    name: 'ai_interventions',
    purpose: 'Interventions comportementales automatisées avec supervision humaine',
    legalBasis: 'consent',
    categories: ['behavioral_data', 'recommendations'],
    retention: '1 year',
    recipients: ['internal_only'],
    transfers: ['none'],
    automated: true,
    profiling: true,
  },
];

// Catégories de données sensibles
export const SENSITIVE_CATEGORIES = [
  'health_data',
  'financial_data',
  'mood_data',
  'behavioral_patterns',
];

// Vérification de conformité
export function checkProcessingCompliance(processing: DataProcessing): string[] {
  const issues: string[] = [];

  // Article 22 RGPD - Profilage
  if (processing.profiling && processing.legalBasis !== 'consent') {
    issues.push('Le profilage nécessite un consentement explicite (Art. 22 RGPD)');
  }

  // Article 46 RGPD - Transferts internationaux
  if (processing.transfers.includes('non_EU') && !processing.transfers.includes('SCC')) {
    issues.push('Transfert hors UE sans garanties appropriées (Art. 46 RGPD)');
  }

  // Article 22 RGPD - Décisions automatisées
  if (processing.automated && !processing.purpose.includes('humain')) {
    issues.push('Décision automatisée sans mention de supervision humaine (Art. 22 RGPD)');
  }

  // Vérification des catégories sensibles
  const hasSensitiveData = processing.categories.some(cat => 
    SENSITIVE_CATEGORIES.includes(cat)
  );
  if (hasSensitiveData && processing.legalBasis === 'legitimate_interest') {
    issues.push('Données sensibles traitées sur base d\'intérêt légitime - vérifier Art. 9 RGPD');
  }

  return issues;
}

// Générer le rapport de conformité complet
export function generateComplianceReport(): {
  totalProcessings: number;
  compliantCount: number;
  issuesCount: number;
  details: Array<{ name: string; issues: string[] }>;
} {
  const details = DATA_PROCESSING_REGISTRY.map(processing => ({
    name: processing.name,
    issues: checkProcessingCompliance(processing),
  }));

  const compliantCount = details.filter(d => d.issues.length === 0).length;
  const issuesCount = details.reduce((sum, d) => sum + d.issues.length, 0);

  return {
    totalProcessings: DATA_PROCESSING_REGISTRY.length,
    compliantCount,
    issuesCount,
    details: details.filter(d => d.issues.length > 0),
  };
}

// Obtenir les traitements par base légale
export function getProcessingsByLegalBasis(
  basis: DataProcessing['legalBasis']
): DataProcessing[] {
  return DATA_PROCESSING_REGISTRY.filter(p => p.legalBasis === basis);
}

// Vérifier si un traitement spécifique existe
export function hasProcessing(name: string): boolean {
  return DATA_PROCESSING_REGISTRY.some(p => p.name === name);
}

// Obtenir les informations de rétention pour export utilisateur
export function getRetentionInfo(): Array<{ name: string; retention: string }> {
  return DATA_PROCESSING_REGISTRY.map(p => ({
    name: p.name,
    retention: p.retention,
  }));
}
