// server/utils/brevo.ts
import { useRuntimeConfig } from '#imports'

interface SendTransactionalParams {
  toEmail: string
  toName?: string
  subject?: string
  htmlContent?: string
  templateId?: number
  params?: Record<string, any>
  idempotencyKey: string
}

export class BrevoService {
  private static getApiKey(): string {
    const config = useRuntimeConfig()
    const apiKey = config.brevoApiKey || process.env.BREVO_API_KEY
    if (!apiKey) {
      throw new Error('CONFIG ERROR: BREVO_API_KEY non definita nelle variabili d\'ambiente server.')
    }
    return apiKey
  }

  // a) EMAIL TRANSAZIONALI (POST /v3/smtp/email)
  static async sendTransactionalEmail(payload: SendTransactionalParams) {
    const apiKey = this.getApiKey()

    const bodyData: any = {
      sender: { name: 'DevKernelPulse Engine', email: process.env.EMAIL_SENDER_TRANSACTIONAL || 'noreply@devkernelpulse.com' },
      to: [{ email: payload.toEmail, name: payload.toName || payload.toEmail }],
      headers: { 'X-Mailin-custom': payload.idempotencyKey }
    }

    if (payload.templateId) {
      bodyData.templateId = payload.templateId
      bodyData.params = payload.params || {}
    } else {
      bodyData.subject = payload.subject || 'Notifica DKP'
      bodyData.htmlContent = payload.htmlContent || '<p>Notifica dal Kernel</p>'
    }

    return await fetchWithRetry('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    })
  }

  // b) ISCRIZIONE NEWSLETTER DOUBLE OPT-IN (POST /v3/contacts/doubleOptinConfirmation)
  static async subscribeDoubleOptIn(email: string, source: string) {
    const apiKey = this.getApiKey()
    const templateId = Number(process.env.BREVO_DOUBLE_OPTIN_TEMPLATE_ID) || 2

    const payload = {
      email,
      includeInDoiLists: [1], // ID Lista Newsletter principale su Brevo
      templateId,
      redirectionUrl: 'https://devkernelpulse.org/newsletter/confirmed',
      attributes: {
        CONSENT_DATE: new Date().toISOString(),
        CONSENT_SOURCE: source
      }
    }

    return await fetchWithRetry('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  }
}

// Helper per Retry con Backoff Esponenziale su codici 429 e 5xx
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<any> {
  try {
    const res = await fetch(url, options)
    if (res.status === 429 || res.status >= 500) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoff))
        return fetchWithRetry(url, options, retries - 1, backoff * 2)
      }
    }
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Brevo API Error (${res.status}): ${errText}`)
    }
    return await res.json()
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoff))
      return fetchWithRetry(url, options, retries - 1, backoff * 2)
    }
    throw err
  }
}