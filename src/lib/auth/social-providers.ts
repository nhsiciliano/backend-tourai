import { SignJWT, importPKCS8 } from 'jose'

type SocialProviderConfig = {
  google?: {
    clientId: string
    clientSecret: string
  }
  microsoft?: {
    clientId: string
    clientSecret: string
    tenantId?: string
    authority?: string
    prompt?: 'select_account'
  }
  apple?: {
    clientId: string
    clientSecret: string
    appBundleIdentifier?: string
  }
}

function hasValue(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0)
}

async function generateAppleClientSecret(): Promise<string> {
  const clientId = process.env.APPLE_CLIENT_ID
  const teamId = process.env.APPLE_TEAM_ID
  const keyId = process.env.APPLE_KEY_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!hasValue(clientId) || !hasValue(teamId) || !hasValue(keyId) || !hasValue(privateKey)) {
    throw new Error('Apple Sign In requires APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY.')
  }

  const key = await importPKCS8(privateKey, 'ES256')
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key)
}

export async function buildSocialProviders(): Promise<SocialProviderConfig> {
  const socialProviders: SocialProviderConfig = {}

  if (hasValue(process.env.GOOGLE_CLIENT_ID) && hasValue(process.env.GOOGLE_CLIENT_SECRET)) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
  }

  if (hasValue(process.env.MICROSOFT_CLIENT_ID) && hasValue(process.env.MICROSOFT_CLIENT_SECRET)) {
    socialProviders.microsoft = {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      authority: 'https://login.microsoftonline.com',
      prompt: 'select_account',
    }
  }

  if (
    hasValue(process.env.APPLE_CLIENT_ID) &&
    hasValue(process.env.APPLE_TEAM_ID) &&
    hasValue(process.env.APPLE_KEY_ID) &&
    hasValue(process.env.APPLE_PRIVATE_KEY)
  ) {
    socialProviders.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: await generateAppleClientSecret(),
    }

    if (hasValue(process.env.APPLE_APP_BUNDLE_IDENTIFIER)) {
      socialProviders.apple.appBundleIdentifier = process.env.APPLE_APP_BUNDLE_IDENTIFIER
    }
  }

  return socialProviders
}

export function buildTrustedOrigins(): string[] {
  const origins = new Set<string>()
  const rawOrigins = process.env.TRUSTED_ORIGINS

  if (hasValue(rawOrigins)) {
    rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .forEach((origin) => origins.add(origin))
  }

  if (hasValue(process.env.CORS_ORIGIN)) {
    origins.add(process.env.CORS_ORIGIN)
  }

  if (hasValue(process.env.APPLE_CLIENT_ID)) {
    origins.add('https://appleid.apple.com')
  }

  return [...origins]
}
