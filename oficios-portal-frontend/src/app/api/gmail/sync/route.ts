import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';
import { emailParser } from '@/lib/email-parser';
import { aiParser } from '@/lib/ai-parser';
import { supabaseService } from '@/lib/supabase';

// POST: Sync emails from Gmail
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, accessToken, refreshToken } = body;

    if (!userId || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Gmail service
    const gmailService = new GmailService({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.CLIENT_SECRET || '',
      redirectUri: process.env.GMAIL_REDIRECT_URI || '',
      accessToken,
      refreshToken,
    });

    // Search for emails with ofícios
    console.log('🔍 Buscando emails com ofícios...');
    const emails = await gmailService.searchOficios(20);
    console.log(`📧 Encontrados ${emails.length} emails`);

    const results = {
      total: emails.length,
      imported: 0,
      needsReview: 0,
      failed: 0,
      oficios: [] as Array<{
        email: string;
        parsed?: unknown;
        oficio?: unknown;
        errors?: string[];
        needsReview: boolean;
      }>,
    };

    // Process each email
    for (const email of emails) {
      try {
        console.log(`\n📧 Processando: ${email.subject}`);

        // Basic parsing
        const basicParsed = emailParser.parse(email);
        console.log(`   Confiança básica: ${basicParsed.confidence}%`);

        // Enhance with AI if needed
        const enhancedParsed = await aiParser.enhance(basicParsed, email);
        console.log(`   Confiança AI: ${enhancedParsed.confidence}%`);

        // Validate
        const validation = emailParser.validate(enhancedParsed);

        if (!validation.isValid) {
          console.log(`   ⚠️ Precisa revisão: ${validation.errors.join(', ')}`);
          results.needsReview++;
          results.oficios.push({
            email: email.subject,
            parsed: enhancedParsed,
            errors: validation.errors,
            needsReview: true,
          });
          continue;
        }

        // Convert to oficio data
        const oficioData = emailParser.toOficioData(enhancedParsed, userId);

        if (!oficioData) {
          console.log('   ❌ Dados insuficientes');
          results.failed++;
          continue;
        }

        // Create oficio in Supabase
        const createdOficio = await supabaseService.createOficio(oficioData);
        console.log(`   ✅ Ofício #${createdOficio.numero} criado`);

        // Download attachments (PDFs)
        for (const attachment of email.attachments) {
          if (attachment.mimeType === 'application/pdf') {
            try {
              await gmailService.downloadAttachment(email.id, attachment.attachmentId);
              console.log(`      📎 Anexo baixado: ${attachment.filename}`);
              
              // TODO: Upload to Supabase Storage
              // await uploadToStorage(createdOficio.id, attachment.filename, data);
            } catch (error) {
              console.error(`      ❌ Erro ao baixar anexo: ${error}`);
            }
          }
        }

        // Mark email as processed
        await gmailService.addLabel(email.id, 'ness. oficios/Importado');
        await gmailService.markAsRead(email.id);

        results.imported++;
        results.oficios.push({
          email: email.subject,
          parsed: enhancedParsed,
          oficio: createdOficio,
          needsReview: false,
        });
      } catch (error) {
        console.error(`❌ Erro ao processar email ${email.subject}:`, error);
        results.failed++;
      }
    }

    console.log(`\n✅ Sincronização completa!`);
    console.log(`   Importados: ${results.imported}`);
    console.log(`   Precisam revisão: ${results.needsReview}`);
    console.log(`   Falharam: ${results.failed}`);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error syncing Gmail:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

