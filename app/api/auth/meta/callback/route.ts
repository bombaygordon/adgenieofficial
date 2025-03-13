import { NextResponse } from 'next/server';
import { getMetaAccessToken, getMetaUserAccounts } from '@/app/lib/meta';
import { cookies, headers } from 'next/headers';

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

    // Store the token and account data in cookies
    const cookieStore = cookies();
    
    // Store the access token with client-side access
    cookieStore.set('meta_access_token', tokenData.access_token, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/' // Ensure cookie is available across all paths
    });

    // Store the first ad account's ID
    if (accountsData.data && accountsData.data.length > 0) {
      const firstAccount = accountsData.data[0];
      cookieStore.set('meta_account_id', firstAccount.account_id, {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in,
        path: '/' // Ensure cookie is available across all paths
      });
      cookieStore.set('meta_account_name', firstAccount.name, {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in,
        path: '/' // Ensure cookie is available across all paths
      });
    }
    
    // Get the origin from headers
    const headersList = headers();
    const host = headersList.get('host') || '';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const origin = `${protocol}://${host}`;
    
    // Create redirect URL to the root with connection status
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('platform', 'facebook');
    redirectUrl.searchParams.set('status', 'connected');

    // Create the response with cookies
    const response = NextResponse.redirect(redirectUrl.toString());

    // Set cookies directly on response as well
    response.cookies.set('meta_access_token', tokenData.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/'
    });

    if (accountsData.data && accountsData.data.length > 0) {
      const firstAccount = accountsData.data[0];
      response.cookies.set('meta_account_id', firstAccount.account_id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in,
        path: '/'
      });
      response.cookies.set('meta_account_name', firstAccount.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in,
        path: '/'
      });
    }

    return response;
  } catch (error) {
    console.error('Meta auth callback error:', error);
    // Get the origin from headers for error redirect
    const headersList = headers();
    const host = headersList.get('host') || '';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const origin = `${protocol}://${host}`;
    
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
} 