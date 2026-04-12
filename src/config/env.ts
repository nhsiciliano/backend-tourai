import envSchema from 'env-schema'
import { Type, type Static } from '@sinclair/typebox'

const envSchemaDefinition = Type.Object({
  HOST: Type.String({ default: '0.0.0.0' }),
  PORT: Type.Number({ default: 3000 }),
  LOG_LEVEL: Type.Union(
    [
      Type.Literal('trace'),
      Type.Literal('debug'),
      Type.Literal('info'),
      Type.Literal('warn'),
      Type.Literal('error'),
      Type.Literal('fatal'),
    ],
    { default: 'info' },
  ),
  ENABLE_DEV_ROUTES: Type.Boolean({ default: true }),
  CORS_ORIGIN: Type.String({ default: 'http://localhost:8081' }),
  TRUSTED_ORIGINS: Type.Optional(Type.String()),
  DATABASE_URL: Type.String(),
  DIRECT_URL: Type.String(),
  BETTER_AUTH_SECRET: Type.String({ minLength: 32 }),
  BETTER_AUTH_URL: Type.String(),
  AUTH_CALLBACK_URL: Type.String(),
  MOBILE_DEEP_LINK_URL: Type.String(),
  RESEND_API_KEY: Type.String(),
  EMAIL_FROM: Type.String(),
  GOOGLE_CLIENT_ID: Type.Optional(Type.String()),
  GOOGLE_CLIENT_SECRET: Type.Optional(Type.String()),
  MICROSOFT_CLIENT_ID: Type.Optional(Type.String()),
  MICROSOFT_CLIENT_SECRET: Type.Optional(Type.String()),
  MICROSOFT_TENANT_ID: Type.Optional(Type.String()),
  APPLE_CLIENT_ID: Type.Optional(Type.String()),
  APPLE_TEAM_ID: Type.Optional(Type.String()),
  APPLE_KEY_ID: Type.Optional(Type.String()),
  APPLE_PRIVATE_KEY: Type.Optional(Type.String()),
  APPLE_APP_BUNDLE_IDENTIFIER: Type.Optional(Type.String()),
  SUPABASE_URL: Type.String(),
  SUPABASE_ANON_KEY: Type.String(),
  SUPABASE_SERVICE_ROLE_KEY: Type.String(),
  REDIS_URL: Type.String(),
  GEMINI_API_KEY: Type.String(),
  GEMINI_MODEL: Type.String({ default: 'gemini-2.0-flash' }),
  ELEVENLABS_API_KEY: Type.String(),
  ELEVENLABS_VOICE_ID_ES: Type.Optional(Type.String()),
  ELEVENLABS_VOICE_ID_EN: Type.Optional(Type.String()),
})

export type AppConfig = Static<typeof envSchemaDefinition>

export function loadConfig(): AppConfig {
  return envSchema<AppConfig>({
    schema: envSchemaDefinition,
    dotenv: true,
  })
}
