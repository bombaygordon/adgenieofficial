import { NextResponse } from 'next/server';
import { getMetaAccessToken, getMetaUserAccounts } from '@/app/lib/meta';

export async function GET(request: Request) {
  try {
    // Get the authorization code from the URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`Authorization failed: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange the code for an access token
    const tokenData = await getMetaAccessToken(code);
    
    // Get user's ad accounts
    const accountsData = await getMetaUserAccounts(tokenData.access_token);

    // Store the token and account data (you'll need to implement this based on your storage solution)
    // For now, we'll just return success and redirect to the dashboard
    
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Meta auth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=auth_failed', request.url));
  }
} 