import { Resend } from 'resend'

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

let resendClient: Resend | undefined

function getResendClient(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const resend = getResendClient()
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Tourai <onboarding@resend.dev>',
    to: [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
  })

  if (error) {
    throw new Error(`Failed to send email with Resend: ${error.message}`)
  }
}
