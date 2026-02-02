/**
 * Système d'alertes pour incidents critiques
 * Supporte webhooks (Slack, Discord, PagerDuty)
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertPayload {
  severity: AlertSeverity;
  service: string;
  title: string;
  message: string;
  userId?: string;
  traceId?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const SEVERITY_PRIORITY: Record<AlertSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

class AlertManager {
  private webhookUrl: string | undefined;
  private enabled: boolean;
  private minSeverity: AlertSeverity;

  constructor() {
    this.webhookUrl = Deno.env.get('ALERT_WEBHOOK_URL');
    this.enabled = Deno.env.get('ALERTS_ENABLED') === 'true';
    this.minSeverity = (Deno.env.get('ALERT_MIN_SEVERITY') as AlertSeverity) || 'high';
  }

  private shouldSend(severity: AlertSeverity): boolean {
    if (!this.enabled) return false;
    return SEVERITY_PRIORITY[severity] >= SEVERITY_PRIORITY[this.minSeverity];
  }

  async send(alert: Omit<AlertPayload, 'timestamp'>): Promise<void> {
    const fullAlert: AlertPayload = {
      ...alert,
      timestamp: new Date().toISOString(),
    };

    // Always log the alert
    console.error(JSON.stringify({
      level: 'ALERT',
      ...fullAlert,
    }));

    // Send to webhook if configured and severity meets threshold
    if (this.webhookUrl && this.shouldSend(alert.severity)) {
      try {
        const emoji = this.getEmoji(alert.severity);
        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Slack-compatible format
            text: `${emoji} [${alert.severity.toUpperCase()}] ${alert.title}`,
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: `${emoji} ${alert.title}` }
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Service:*\n${alert.service}` },
                  { type: 'mrkdwn', text: `*Severity:*\n${alert.severity}` },
                  { type: 'mrkdwn', text: `*Time:*\n${fullAlert.timestamp}` },
                  alert.traceId ? { type: 'mrkdwn', text: `*Trace:*\n${alert.traceId}` } : null,
                ].filter(Boolean),
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: alert.message }
              }
            ].filter(Boolean),
          }),
        });
      } catch (err) {
        console.error('Failed to send alert webhook:', err);
      }
    }
  }

  private getEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟡';
    }
  }

  // Pre-built alert types
  async aiError(service: string, error: Error, context?: { userId?: string; traceId?: string }): Promise<void> {
    await this.send({
      severity: 'high',
      service,
      title: 'AI Service Error',
      message: `Error: ${error.message}\n\nStack: ${error.stack?.slice(0, 500)}`,
      ...context,
    });
  }

  async securityIncident(service: string, incident: string, context?: { userId?: string; traceId?: string }): Promise<void> {
    await this.send({
      severity: 'critical',
      service,
      title: 'Security Incident',
      message: incident,
      ...context,
    });
  }

  async consentViolation(service: string, action: string, userId: string): Promise<void> {
    await this.send({
      severity: 'critical',
      service,
      title: 'RGPD Consent Violation Attempt',
      message: `Action "${action}" was attempted without proper user consent.`,
      userId,
    });
  }

  async rateLimitExceeded(service: string, userId: string, limit: number): Promise<void> {
    await this.send({
      severity: 'medium',
      service,
      title: 'Rate Limit Exceeded',
      message: `User ${userId} exceeded rate limit of ${limit} requests.`,
      userId,
    });
  }

  async jobFailed(service: string, jobName: string, error: Error): Promise<void> {
    await this.send({
      severity: 'high',
      service,
      title: `Job Failed: ${jobName}`,
      message: `Error: ${error.message}`,
      data: { stack: error.stack },
    });
  }
}

// Singleton instance
export const alertManager = new AlertManager();
