import { NextRequest, NextResponse } from 'next/server';
import { getMetaAccessToken, getMetaUserAccounts } from '@/app/lib/meta';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

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

    // Store the token in a secure cookie
    const cookieStore = cookies();
    cookieStore.set('meta_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in
    });

    // Store account data in a cookie (non-sensitive data)
    cookieStore.set('meta_accounts', JSON.stringify(accountsData), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in
    });
    
    return NextResponse.redirect(new URL('/?connected=meta', request.url));
  } catch (error) {
    console.error('Meta auth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
} 