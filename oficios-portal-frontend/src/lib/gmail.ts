import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Gmail API Configuration
export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}

// Email Message
export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: Buffer;
}

// Gmail Service Class
export class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;

  constructor(config: GmailConfig) {
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    // Set credentials if available
    if (config.accessToken) {
      this.oauth2Client.setCredentials({
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
      });
    }

    // Initialize Gmail API
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // Get authorization URL
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      prompt: 'consent',
    });
  }

  // Exchange code for tokens
  async getTokensFromCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    return {
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token || '',
    };
  }

  // Search for emails with "ofício" or "oficio" in subject
  async searchOficios(maxResults: number = 50): Promise<EmailMessage[]> {
    try {
      // Search for emails with "ofício" in subject
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'subject:(ofício OR oficio) has:attachment',
        maxResults,
      });

      const messages = response.data.messages || [];
      const emailMessages: EmailMessage[] = [];

      // Fetch full message details
      for (const message of messages) {
        if (!message.id) continue;

        const fullMessage = await this.getMessageDetails(message.id);
        if (fullMessage) {
          emailMessages.push(fullMessage);
        }
      }

      return emailMessages;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  // Get message details
  private async getMessageDetails(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      const headers = message.payload?.headers || [];

      // Extract headers
      const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '';
      const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
      const to = headers.find((h) => h.name?.toLowerCase() === 'to')?.value || '';
      const dateStr = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';

      // Extract body
      const body = this.extractBody(message.payload);

      // Extract attachments
      const attachments = this.extractAttachments(message.payload);

      return {
        id: messageId,
        threadId: message.threadId || '',
        subject,
        from,
        to,
        date: new Date(dateStr),
        body,
        attachments,
      };
    } catch (error) {
      console.error(`Error getting message ${messageId}:`, error);
      return null;
    }
  }

  // Extract email body
  private extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    // Try body.data first
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // Try parts (multipart email)
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }

      // Try HTML if no plain text
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          // Strip HTML tags (simple version)
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }

    return '';
  }

  // Extract attachments
  private extractAttachments(payload: gmail_v1.Schema$MessagePart | undefined): EmailAttachment[] {
    const attachments: EmailAttachment[] = [];

    if (!payload?.parts) return attachments;

    for (const part of payload.parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
        });
      }

      // Recursive for nested parts
      if (part.parts) {
        attachments.push(...this.extractAttachments(part));
      }
    }

    return attachments;
  }

  // Download attachment
  async downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId,
      });

      if (!response.data.data) {
        throw new Error('No attachment data');
      }

      return Buffer.from(response.data.data, 'base64');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  }

  // Mark email as read
  async markAsRead(messageId: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }

  // Add label to email
  async addLabel(messageId: string, labelName: string): Promise<void> {
    // First, get or create label
    const labelsResponse = await this.gmail.users.labels.list({ userId: 'me' });
    let labelId = labelsResponse.data.labels?.find((l) => l.name === labelName)?.id;

    if (!labelId) {
      // Create label
      const createResponse = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      });
      labelId = createResponse.data.id;
    }

    if (!labelId) return;

    // Add label to message
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });
  }
}

