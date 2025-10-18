import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';

// GET: Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard?error=${error}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
    }

    // Exchange code for tokens
    const gmailService = new GmailService({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GMAIL_REDIRECT_URI || '',
    });

    await gmailService.getTokensFromCode(code);

    // TODO: Save tokens to Supabase for the user
    // For now, we'll store in a separate table or add columns to user profile

    // Redirect back to dashboard with success
    return NextResponse.redirect(new URL('/dashboard?gmail_connected=true', request.url));
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url));
  }
}

