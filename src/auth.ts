import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { getPrismaClient } from './lib/prisma.js'
import { sendEmail } from './lib/email.js'
import { buildSocialProviders, buildTrustedOrigins } from './lib/auth/social-providers.js'

const prisma = getPrismaClient()

function getAuthEnv(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.length > 0 ? value : fallback
}

function renderEmailLayout(title: string, body: string, ctaUrl: string, ctaLabel: string): { html: string; text: string } {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">${title}</h1>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${body}</p>
        <p style="margin-bottom: 24px;">
          <a href="${ctaUrl}" style="display: inline-block; padding: 12px 20px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;">${ctaLabel}</a>
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="font-size: 14px; line-height: 1.6; word-break: break-word; color: #2563eb;">${ctaUrl}</p>
      </div>
    `,
    text: `${title}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}`,
  }
}

const socialProviders = await buildSocialProviders()

export const auth = betterAuth({
  appName: 'Tourai',
  baseURL: getAuthEnv('BETTER_AUTH_URL', 'http://localhost:3000'),
  basePath: '/auth',
  secret: getAuthEnv('BETTER_AUTH_SECRET', 'development-only-better-auth-secret-change-me'),
  trustedOrigins: buildTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 30,
    sendResetPassword: async ({ user, url }) => {
      const email = renderEmailLayout(
        'Restablece tu contraseña',
        'Recibimos una solicitud para cambiar tu contraseña de Tourai. Si fuiste tú, usa el siguiente enlace para continuar.',
        url,
        'Restablecer contraseña',
      )

      await sendEmail({
        to: user.email,
        subject: 'Restablece tu contraseña de Tourai',
        html: email.html,
        text: email.text,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const email = renderEmailLayout(
        'Verifica tu correo',
        'Confirma tu dirección de email para activar tu cuenta de Tourai y habilitar el inicio de sesión.',
        url,
        'Verificar correo',
      )

      await sendEmail({
        to: user.email,
        subject: 'Verifica tu cuenta de Tourai',
        html: email.html,
        text: email.text,
      })
    },
  },
  socialProviders,
})
