import { Platform } from '../context/AccountsContext';

export interface MetaAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export const META_CONFIG: MetaAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_META_APP_ID || '',
  clientSecret: process.env.META_APP_SECRET || '',
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`,
  scopes: [
    'ads_read',
    'ads_management',
    'business_management',
    'instagram_basic',
    'instagram_manage_insights',
    'pages_read_engagement',
    'pages_show_list',
    'read_insights'
  ]
};

export function getMetaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: META_CONFIG.clientId,
    redirect_uri: META_CONFIG.redirectUri,
    scope: META_CONFIG.scopes.join(','),
    response_type: 'code',
    state: Math.random().toString(36).substring(7)
  });

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

export async function getMetaAccessToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    client_id: META_CONFIG.clientId,
    client_secret: META_CONFIG.clientSecret,
    redirect_uri: META_CONFIG.redirectUri,
    code: code
  });

  const response = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  return response.json();
}

export async function getMetaUserAccounts(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,currency,timezone_name&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch ad accounts');
  }

  return response.json();
} 