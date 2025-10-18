import { EmailMessage } from './gmail';
import { CreateOficioData } from './supabase';

// Parsed Oficio Data
export interface ParsedOficio {
  numero?: string;
  processo?: string;
  autoridade?: string;
  prazo?: string;
  descricao?: string;
  confidence: number; // 0-100
  needsReview: boolean;
}

// Email Parser Class
export class EmailParser {
  // Parse email to extract oficio data
  parse(email: EmailMessage): ParsedOficio {
    const text = `${email.subject}\n\n${email.body}`;

    const numero = this.extractNumero(text);
    const processo = this.extractProcesso(text);
    const autoridade = this.extractAutoridade(text, email.from);
    const prazo = this.extractPrazo(text);
    const descricao = this.extractDescricao(text);

    // Calculate confidence
    let confidence = 0;
    if (numero) confidence += 30;
    if (processo) confidence += 30;
    if (prazo) confidence += 20;
    if (autoridade) confidence += 20;

    const needsReview = confidence < 80 || !numero || !processo;

    return {
      numero,
      processo,
      autoridade,
      prazo,
      descricao,
      confidence,
      needsReview,
    };
  }

  // Extract ofício number
  private extractNumero(text: string): string | undefined {
    // Patterns: "Ofício nº 12345", "Of. 12345", "Oficio 12345"
    const patterns = [
      /of[íi]cio\s*(?:n[ºo°]?\.?\s*)?(\d{4,6})/i,
      /of\.\s*(\d{4,6})/i,
      /n[ºo°]\s*(\d{4,6})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return undefined;
  }

  // Extract process number
  private extractProcesso(text: string): string | undefined {
    // Pattern: 1234567-89.2024.1.00.0000
    const pattern = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/;
    const match = text.match(pattern);
    return match ? match[1] : undefined;
  }

  // Extract authority/organization
  private extractAutoridade(text: string, from: string): string | undefined {
    // Try to extract from email domain
    const domainMatch = from.match(/@([^>]+)/);
    if (domainMatch) {
      const domain = domainMatch[1].toLowerCase();

      // Common patterns
      const authorities: { [key: string]: string } = {
        'tjsp.jus.br': 'Tribunal de Justiça de São Paulo',
        'trf1.jus.br': 'Tribunal Regional Federal - 1ª Região',
        'trf2.jus.br': 'Tribunal Regional Federal - 2ª Região',
        'stj.jus.br': 'Superior Tribunal de Justiça',
        'mpf.mp.br': 'Ministério Público Federal',
        'mp.sp.gov.br': 'Ministério Público de São Paulo',
      };

      for (const [key, value] of Object.entries(authorities)) {
        if (domain.includes(key)) {
          return value;
        }
      }
    }

    // Try to extract from signature
    const signaturePatterns = [
      /(?:tribunal|ministério|defensoria|procuradoria)\s+[^\n]{5,100}/i,
    ];

    for (const pattern of signaturePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    // Fallback: extract from sender name
    const nameMatch = from.match(/^([^<]+)</);
    if (nameMatch) {
      return nameMatch[1].trim();
    }

    return undefined;
  }

  // Extract deadline/prazo
  private extractPrazo(text: string): string | undefined {
    // Patterns: "até 19/10/2024", "prazo: 19/10/2024", "responder até 19/10/2024"
    const datePatterns = [
      /(?:até|prazo|responder\s+até|prazo\s*:)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /prazo\s*(?:para\s+resposta)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.parseDate(match[1]);
      }
    }

    return undefined;
  }

  // Parse date string to ISO format
  private parseDate(dateStr: string): string | undefined {
    // Convert DD/MM/YYYY to Date
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length !== 3) return undefined;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    let year = parseInt(parts[2], 10);

    // Handle 2-digit year
    if (year < 100) {
      year += 2000;
    }

    const date = new Date(year, month, day, 23, 59, 59);

    if (isNaN(date.getTime())) return undefined;

    return date.toISOString();
  }

  // Extract description
  private extractDescricao(text: string): string | undefined {
    // Get first 200 characters, clean up
    const cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/<[^>]*>/g, '')
      .trim();

    return cleaned.substring(0, 300);
  }

  // Validate parsed data
  validate(parsed: ParsedOficio): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parsed.numero) {
      errors.push('Número do ofício não encontrado');
    }

    if (!parsed.processo) {
      errors.push('Número do processo não encontrado');
    }

    if (!parsed.prazo) {
      errors.push('Prazo não encontrado');
    }

    if (!parsed.autoridade) {
      errors.push('Autoridade não identificada');
    }

    return {
      isValid: errors.length === 0 && parsed.confidence >= 80,
      errors,
    };
  }

  // Convert parsed data to CreateOficioData
  toOficioData(parsed: ParsedOficio, userId: string): CreateOficioData | null {
    const validation = this.validate(parsed);

    if (!validation.isValid || !parsed.numero || !parsed.processo || !parsed.prazo) {
      return null;
    }

    return {
      numero: parsed.numero,
      processo: parsed.processo,
      autoridade: parsed.autoridade || 'Não identificado',
      prazo: parsed.prazo,
      descricao: parsed.descricao || '',
      userId,
    };
  }
}

// Export singleton parser
export const emailParser = new EmailParser();

