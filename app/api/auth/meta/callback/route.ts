import { NextResponse } from 'next/server';
import { getMetaAccessToken, getMetaUserAccounts, getMetaBusinessManagers, META_CONFIG, BusinessManager } from '@/app/lib/meta';
import { cookies } from 'next/headers';

interface MetaAccount {
  account_id: string;
  name: string;
  business_id?: string;
  business_name?: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://adgenieofficial-ahzm.vercel.app';
  
  const returnUrl = new URL('/', baseUrl);
  
  try {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorReason = url.searchParams.get('error_reason');
    const errorDescription = url.searchParams.get('error_description');
    
    console.log('Meta OAuth callback:', {
      hasCode: !!code,
      error,
      errorReason,
      errorDescription,
      callbackUrl: url.toString(),
      environment: process.env.NODE_ENV,
      baseUrl
    });

    if (error) {
      // Special handling for rate limit errors
      if (
        errorDescription?.includes('request limit reached') ||
        errorDescription?.includes('#17') ||
        errorDescription?.includes('#4') ||
        error === 'rate_limit_hit'
      ) {
        console.log('Rate limit detected in callback params, redirecting with retry message');
        returnUrl.searchParams.set('error', 'rate_limit');
        returnUrl.searchParams.set('error_message', 'Meta API rate limit reached. Please wait 2-3 minutes and try again. This helps ensure we can fetch all your business data safely.');
        return NextResponse.redirect(returnUrl);
      }
      throw new Error(`Facebook authorization failed: ${errorDescription || errorReason || error}`);
    }

    if (!code) {
      throw new Error('No authorization code received from Facebook');
    }

    console.log('Starting Meta authentication process...');

    // Exchange code for access token
    const tokenData = await getMetaAccessToken(code);
    console.log('Access token obtained successfully');

    // Add a small delay before fetching business data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch business managers and their ad accounts
    console.log('Fetching business managers and ad accounts...');
    const businessManagers = await getMetaBusinessManagers(tokenData.access_token);
    console.log('Business data fetched successfully:', {
      businessCount: businessManagers.length,
      totalAdAccounts: businessManagers.reduce((sum, bm) => sum + bm.ad_accounts.length, 0)
    });

    if (!businessManagers.length) {
      throw new Error(
        'No business managers found with ad accounts. Please make sure you have access to at least one business manager with ad accounts. ' +
        'If you believe this is an error, try again in a few minutes.'
      );
    }

    // Set up cookie options
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    };

    // Create success response
    returnUrl.searchParams.set('platform', 'facebook');
    returnUrl.searchParams.set('status', 'connected');
    returnUrl.searchParams.set('business_count', businessManagers.length.toString());

    const response = NextResponse.redirect(returnUrl);

    // Set cookies
    response.cookies.set('meta_access_token', tokenData.access_token, cookieOptions);

    // Store business managers and their ad accounts
    response.cookies.set('meta_business_managers', JSON.stringify(businessManagers), cookieOptions);

    // Flatten ad accounts with business info for backward compatibility
    const allAccounts: MetaAccount[] = businessManagers.flatMap(bm => 
      bm.ad_accounts.map(account => ({
        id: account.id,
        account_id: account.account_id,
        name: account.name,
        business_id: bm.id,
        business_name: bm.name
      }))
    );

    if (allAccounts.length === 0) {
      throw new Error(
        'No ad accounts found in any business manager. Please make sure you have access to at least one ad account. ' +
        'If you believe this is an error, try again in a few minutes.'
      );
    }

    // Store flattened account data for backward compatibility
    response.cookies.set('meta_accounts', JSON.stringify(allAccounts), cookieOptions);
    
    // Set default selections to first account
    response.cookies.set('meta_selected_business_id', businessManagers[0].id, cookieOptions);
    response.cookies.set('meta_selected_business_name', businessManagers[0].name, cookieOptions);
    response.cookies.set('meta_selected_account_id', allAccounts[0].account_id, cookieOptions);
    response.cookies.set('meta_selected_account_name', allAccounts[0].name, cookieOptions);

    console.log('Auth successful, redirecting to:', returnUrl.toString());
    return response;

  } catch (error) {
    console.error('Meta OAuth error:', error);

    // Enhanced rate limit detection
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    const isRateLimit = 
      errorMessage.includes('request limit reached') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('#17') ||
      errorMessage.includes('#4');

    if (isRateLimit) {
      console.log('Rate limit detected in API response');
      returnUrl.searchParams.set('error', 'rate_limit');
      returnUrl.searchParams.set('error_message', 
        'Meta API rate limit reached. Please wait 2-3 minutes before trying again. ' +
        'This helps ensure we can fetch all your business data safely.'
      );
    } else {
      returnUrl.searchParams.set('error', 'auth_failed');
      returnUrl.searchParams.set('error_message', errorMessage);
    }

    console.log('Auth failed, redirecting to:', returnUrl.toString());
    return NextResponse.redirect(returnUrl);
  }
} 