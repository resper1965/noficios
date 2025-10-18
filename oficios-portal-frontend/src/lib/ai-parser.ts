import OpenAI from 'openai';
import { ParsedOficio } from './email-parser';
import { EmailMessage } from './gmail';

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// AI Parser Class
export class AIParser {
  // Parse email using GPT-4
  async parseWithAI(email: EmailMessage): Promise<ParsedOficio> {
    try {
      const prompt = this.buildPrompt(email);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em análise de ofícios jurídicos brasileiros.
Extraia informações estruturadas de emails contendo ofícios.
Retorne APENAS um objeto JSON válido, sem texto adicional.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        numero: parsed.numero || undefined,
        processo: parsed.processo || undefined,
        autoridade: parsed.autoridade || undefined,
        prazo: parsed.prazo || undefined,
        descricao: parsed.descricao || undefined,
        confidence: parsed.confidence || 0,
        needsReview: parsed.needsReview !== false,
      };
    } catch (error) {
      console.error('Error parsing with AI:', error);
      
      // Fallback to empty parsed data
      return {
        confidence: 0,
        needsReview: true,
      };
    }
  }

  // Build prompt for OpenAI
  private buildPrompt(email: EmailMessage): string {
    return `Analise este email e extraia as informações do ofício jurídico:

**Assunto:** ${email.subject}

**De:** ${email.from}

**Corpo:**
${email.body.substring(0, 2000)}

**Anexos:**
${email.attachments.map((a) => `- ${a.filename}`).join('\n')}

---

Extraia e retorne um JSON com:

{
  "numero": "número do ofício (apenas números, ex: 12345)",
  "processo": "número do processo no formato 1234567-89.2024.1.00.0000",
  "autoridade": "nome completo do órgão emissor",
  "prazo": "data limite no formato ISO 8601 (ex: 2024-10-19T23:59:59Z)",
  "descricao": "resumo do que está sendo solicitado (máximo 300 caracteres)",
  "confidence": número de 0-100 indicando confiança na extração,
  "needsReview": true/false se precisa de revisão manual
}

**REGRAS:**
- Se não encontrar algum dado, deixe como null
- Seja conservador com confidence (só >80 se tiver certeza)
- needsReview = true se confidence < 80 ou faltarem dados críticos
- Prazo deve ser sempre fim do dia (23:59:59)
- Se prazo for relativo ("5 dias"), calcule a data absoluta a partir de hoje
- Autoridade deve ser o nome completo do órgão (não o email)

**RETORNE APENAS O JSON, SEM TEXTO ADICIONAL.**`;
  }

  // Enhance parsed data from regex parser using AI
  async enhance(basicParsed: ParsedOficio, email: EmailMessage): Promise<ParsedOficio> {
    // Only use AI if basic parsing failed or has low confidence
    if (basicParsed.confidence >= 80 && !basicParsed.needsReview) {
      return basicParsed;
    }

    try {
      const aiParsed = await this.parseWithAI(email);

      // Merge results, preferring AI when basic parsing failed
      return {
        numero: basicParsed.numero || aiParsed.numero,
        processo: basicParsed.processo || aiParsed.processo,
        autoridade: basicParsed.autoridade || aiParsed.autoridade,
        prazo: basicParsed.prazo || aiParsed.prazo,
        descricao: aiParsed.descricao || basicParsed.descricao,
        confidence: Math.max(basicParsed.confidence, aiParsed.confidence),
        needsReview: aiParsed.needsReview,
      };
    } catch (error) {
      console.error('AI enhancement failed, using basic parsing:', error);
      return basicParsed;
    }
  }
}

// Export singleton
export const aiParser = new AIParser();

