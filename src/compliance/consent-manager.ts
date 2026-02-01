import { supabase } from '@/integrations/supabase/client';

export interface ConsentRecord {
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  version: string;
  withdrawable: boolean;
}

export const CONSENT_PURPOSES = {
  BASIC_SERVICE: {
    id: 'basic_service',
    name: 'Service de base',
    description: 'Suivi des habitudes, tâches et objectifs',
    required: true,
    legalBasis: 'contract' as const,
  },
  AI_PERSONALIZATION: {
    id: 'ai_personalization',
    name: 'Personnalisation IA',
    description: 'Sage apprend de tes patterns pour mieux t\'aider',
    required: false,
    legalBasis: 'consent' as const,
  },
  BEHAVIORAL_ANALYSIS: {
    id: 'behavioral_analysis',
    name: 'Analyse comportementale',
    description: 'Détection de patterns et prédictions',
    required: false,
    legalBasis: 'consent' as const,
  },
  PRODUCT_IMPROVEMENT: {
    id: 'product_improvement',
    name: 'Amélioration du produit',
    description: 'Données anonymisées pour améliorer Minded',
    required: false,
    legalBasis: 'legitimate_interest' as const,
  },
} as const;

export type ConsentPurposeId = typeof CONSENT_PURPOSES[keyof typeof CONSENT_PURPOSES]['id'];

export class ConsentManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getConsents(): Promise<Record<string, boolean>> {
    const { data } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', this.userId);

    const consents: Record<string, boolean> = {};
    for (const consent of data || []) {
      consents[consent.purpose] = consent.granted;
    }

    return consents;
  }

  async getConsentRecords(): Promise<ConsentRecord[]> {
    const { data } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', this.userId);

    return (data || []).map(consent => {
      const purposeConfig = Object.values(CONSENT_PURPOSES).find(p => p.id === consent.purpose);
      return {
        userId: consent.user_id,
        purpose: consent.purpose,
        granted: consent.granted,
        timestamp: new Date(consent.granted_at || consent.created_at),
        version: consent.consent_version,
        withdrawable: !purposeConfig?.required,
      };
    });
  }

  async grantConsent(purpose: string): Promise<void> {
    await supabase.from('user_consents').upsert({
      user_id: this.userId,
      purpose,
      granted: true,
      granted_at: new Date().toISOString(),
      consent_version: '1.0',
    }, {
      onConflict: 'user_id,purpose',
    });

    // Log pour audit
    await this.logConsentChange(purpose, true);
  }

  async withdrawConsent(purpose: string): Promise<void> {
    // Vérifier si retirable
    const purposeConfig = Object.values(CONSENT_PURPOSES).find(p => p.id === purpose);
    if (purposeConfig?.required) {
      throw new Error('Ce consentement est requis pour le service');
    }

    await supabase
      .from('user_consents')
      .update({
        granted: false,
        withdrawn_at: new Date().toISOString(),
      })
      .eq('user_id', this.userId)
      .eq('purpose', purpose);

    // Supprimer les données liées à ce consentement
    await this.deleteDataForPurpose(purpose);

    // Log pour audit
    await this.logConsentChange(purpose, false);
  }

  private async deleteDataForPurpose(purpose: string): Promise<void> {
    if (purpose === 'ai_personalization') {
      await Promise.all([
        supabase.from('sage_memory_patterns').delete().eq('user_id', this.userId),
        supabase.from('sage_experiences').delete().eq('user_id', this.userId),
        supabase.from('sage_policy_weights').delete().eq('user_id', this.userId),
      ]);
    }

    if (purpose === 'behavioral_analysis') {
      await supabase.from('sage_memory_patterns').delete().eq('user_id', this.userId);
    }
  }

  private async logConsentChange(purpose: string, granted: boolean): Promise<void> {
    await supabase.from('audit_log').insert({
      user_id: this.userId,
      action: granted ? 'consent_granted' : 'consent_withdrawn',
      entity: 'consent',
      entity_id: purpose,
      new_value: { purpose, granted, timestamp: new Date().toISOString() },
    });
  }

  // Vérifier si un traitement est autorisé
  async isProcessingAllowed(purpose: string): Promise<boolean> {
    const consents = await this.getConsents();

    const purposeConfig = Object.values(CONSENT_PURPOSES).find(p => p.id === purpose);

    // Si consentement requis ou base légale différente
    if (purposeConfig?.legalBasis !== 'consent') {
      return true;
    }

    return consents[purpose] === true;
  }

  // Initialiser les consentements par défaut pour un nouvel utilisateur
  async initializeDefaultConsents(): Promise<void> {
    const defaultConsents = [
      { purpose: CONSENT_PURPOSES.BASIC_SERVICE.id, granted: true },
      { purpose: CONSENT_PURPOSES.AI_PERSONALIZATION.id, granted: false },
      { purpose: CONSENT_PURPOSES.BEHAVIORAL_ANALYSIS.id, granted: false },
      { purpose: CONSENT_PURPOSES.PRODUCT_IMPROVEMENT.id, granted: true }, // Intérêt légitime
    ];

    for (const consent of defaultConsents) {
      await supabase.from('user_consents').upsert({
        user_id: this.userId,
        purpose: consent.purpose,
        granted: consent.granted,
        granted_at: consent.granted ? new Date().toISOString() : null,
        consent_version: '1.0',
      }, {
        onConflict: 'user_id,purpose',
      });
    }
  }

  // Obtenir les consentements manquants
  async getMissingConsents(): Promise<string[]> {
    const consents = await this.getConsents();
    const allPurposes = Object.values(CONSENT_PURPOSES).map(p => p.id);
    
    return allPurposes.filter(purpose => consents[purpose] === undefined);
  }

  // Exporter les consentements pour transparence
  async exportConsents(): Promise<{
    consents: ConsentRecord[];
    purposes: typeof CONSENT_PURPOSES;
    exportDate: string;
  }> {
    const consents = await this.getConsentRecords();
    
    return {
      consents,
      purposes: CONSENT_PURPOSES,
      exportDate: new Date().toISOString(),
    };
  }
}
