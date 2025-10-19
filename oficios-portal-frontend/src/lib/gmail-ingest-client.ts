/**
 * Gmail Ingest Client
 * 
 * Client for W0_gmail_ingest Cloud Function
 * Integrates frontend with backend Python Gmail processing
 * 
 * @module lib/gmail-ingest-client
 * @priority P0
 */

import { logger } from './logger';

interface GmailIngestConfig {
  functionUrl: string;
  serviceAccountKey?: string;
}

interface GmailIngestRequest {
  query?: string;
  email?: string;
  label?: string;
}

interface GmailIngestResponse {
  status: string;
  scanned: number;
  bucket: string;
  query: string;
  attachments?: Array<{
    messageId: string;
    subject: string;
    filename: string;
    gcsPath: string;
  }>;
}

/**
 * Client for W0_gmail_ingest Cloud Function
 * 
 * Usage:
 * ```typescript
 * const client = new GmailIngestClient({
 *   functionUrl: process.env.W0_GMAIL_INGEST_URL!
 * });
 * 
 * const result = await client.syncEmails({
 *   email: 'resper@ness.com.br',
 *   label: 'INGEST'
 * });
 * ```
 */
export class GmailIngestClient {
  private config: GmailIngestConfig;

  constructor(config: GmailIngestConfig) {
    this.config = config;
  }

  /**
   * Sync emails from Gmail
   * Calls W0_gmail_ingest Cloud Function
   */
  async syncEmails(params: GmailIngestRequest): Promise<GmailIngestResponse> {
    const log = logger.child({ component: 'GmailIngestClient' });

    try {
      // Build Gmail query
      const query = this.buildGmailQuery(params);
      
      log.info('Calling W0_gmail_ingest', { 
        functionUrl: this.config.functionUrl,
        query 
      });

      // Call Cloud Function
      const response = await fetch(this.config.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication when available
          // 'Authorization': `Bearer ${await this.getIdToken()}`
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(60000) // 60s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `W0_gmail_ingest failed: ${response.status} ${response.statusText}\n${errorText}`
        );
      }

      const result: GmailIngestResponse = await response.json();
      
      log.info('W0_gmail_ingest completed', {
        scanned: result.scanned,
        bucket: result.bucket
      });

      return result;
    } catch (error) {
      log.error('Gmail ingest failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Build Gmail search query from parameters
   */
  private buildGmailQuery(params: GmailIngestRequest): string {
    const parts: string[] = [];

    // Label filter
    if (params.label) {
      parts.push(`label:${params.label}`);
    }

    // Has attachment (required for W0)
    parts.push('has:attachment');

    // Time range (last 7 days by default)
    parts.push('newer_than:7d');

    return parts.join(' ');
  }

  /**
   * Get Firebase ID token for authentication
   * TODO: Implement when Firebase service account is available
   */
  private async getIdToken(): Promise<string> {
    // For now, return empty
    // Will be implemented with Firebase Admin SDK
    return '';
  }
}

/**
 * Create Gmail Ingest Client from environment
 */
export function createGmailIngestClient(): GmailIngestClient {
  const functionUrl = process.env.W0_GMAIL_INGEST_URL;

  if (!functionUrl) {
    throw new Error('W0_GMAIL_INGEST_URL not configured in environment');
  }

  return new GmailIngestClient({ functionUrl });
}

