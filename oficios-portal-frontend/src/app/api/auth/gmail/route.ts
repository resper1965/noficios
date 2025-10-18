import { NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';

// GET: Redirect to Google OAuth
export async function GET() {
  try {
    const gmailService = new GmailService({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GMAIL_REDIRECT_URI || '',
    });

    const authUrl = gmailService.getAuthUrl();

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}

