/**
 * Shared Node-side Rayfin connection for the seed scripts.
 *
 * Connection (first match wins):
 *   RAYFIN_API_URL        / RAYFIN_PUBLISHABLE_KEY        (process env, ./.env, or scripts/.env)
 *   RAYFIN_PUBLIC_API_URL / RAYFIN_PUBLIC_PUBLISHABLE_KEY (rayfin/.env, written by `rayfin up`)
 *
 * Identity: deployed Fabric apps accept Entra sign-in only. Uses
 * RAYFIN_ENTRA_TOKEN when set; otherwise gets a delegated token from the Rayfin
 * CLI's cached sign-in (`npx rayfin login`).
 *
 * Not bundled by Vite; never reads VITE_-prefixed variables.
 */
import { config as loadDotenv } from 'dotenv';
import { RayfinClient } from '@microsoft/rayfin-client';
import { signInWithEntraToken } from '@microsoft/rayfin-auth-provider-fabric';
import type { UniversalAppSchema } from '@rayfin-app/shared';

// dotenv never overrides, so: process env, then ./.env, then scripts/.env, then rayfin/.env.
loadDotenv({ path: '.env', quiet: true });
loadDotenv({ path: 'scripts/.env', quiet: true });
loadDotenv({ path: 'rayfin/.env', quiet: true });

const DEFAULT_ENTRA_SCOPE = 'https://analysis.windows.net/powerbi/api/Item.Execute.All';

export interface SignedInClient {
  client: RayfinClient<UniversalAppSchema>;
  /** The signed-in user's subject claim (opaque). */
  userId: string;
  close: () => void;
}

async function getEntraToken(): Promise<string> {
  const ambient = process.env.RAYFIN_ENTRA_TOKEN?.trim();
  if (ambient) return ambient.replace(/^Bearer\s+/i, '');

  const scope = process.env.RAYFIN_ENTRA_SCOPE?.trim() || DEFAULT_ENTRA_SCOPE;
  const { getAuthenticatedToken } = await import('@microsoft/rayfin-cli/auth');
  const { token } = await getAuthenticatedToken([scope]);
  if (!token) throw new Error('Rayfin CLI sign-in returned no access token.');
  return token;
}

export async function connect(): Promise<SignedInClient> {
  const baseUrl = process.env.RAYFIN_API_URL || process.env.RAYFIN_PUBLIC_API_URL;
  const publishableKey = process.env.RAYFIN_PUBLISHABLE_KEY || process.env.RAYFIN_PUBLIC_PUBLISHABLE_KEY;
  if (!baseUrl || !publishableKey) {
    throw new Error(
      'Missing RAYFIN_API_URL / RAYFIN_PUBLISHABLE_KEY. Deploy first with `npx rayfin up` ' +
        '(it writes rayfin/.env), or set them in .env.',
    );
  }

  const client = new RayfinClient<UniversalAppSchema>({ baseUrl, publishableKey, authStorage: false });
  try {
    const session = await signInWithEntraToken(client.auth, { entraToken: await getEntraToken() });
    const userId = session.user?.id;
    if (!session.isAuthenticated || !userId) throw new Error('Sign-in did not produce a user session.');
    return { client, userId, close: () => client.auth.destroy() };
  } catch (err) {
    client.auth.destroy();
    throw err;
  }
}
