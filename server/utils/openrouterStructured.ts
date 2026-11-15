// server/utils/openrouterStructured.ts
export interface StructuredSchemaConfig<T> {
  schemaName: string
  schema: Record<string, any>
  systemPrompt: string
  userPrompt: string
  model?: string
  temperature?: number
  fallback: T
}

export async function callOpenRouterStructured<T>(
  config: StructuredSchemaConfig<T>
): Promise<{ data: T; providerModel: string; fallbackUsed: boolean }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = config.model || process.env.OPENROUTER_SENTINEL_MODEL || 'google/gemini-2.0-flash-001'

  if (!apiKey) {
    return {
      data: config.fallback,
      providerModel: 'local-fallback',
      fallbackUsed: true
    }
  }

  try {
    const response: any = await $fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NUXT_PUBLIC_SITE_URL || 'https://devkernelpulse.org',
        'X-Title': 'DevKernelPulse v2.6-PURE-SQL'
      },
      body: {
        model,
        temperature: config.temperature ?? 0.1,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: config.userPrompt }
        ],
        // Instrada solo su provider che supportano Structured Outputs + ripara eventuali imperfezioni JSON
        provider: {
          require_parameters: true
        },
        plugins: [{ id: 'response-healing' }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: config.schemaName,
            strict: true,
            schema: {
              ...config.schema,
              additionalProperties: false
            }
          }
        }
      }
    })

    const rawContent = response?.choices?.[0]?.message?.content
    if (!rawContent) {
      throw new Error('Risposta vuota da OpenRouter Structured Outputs')
    }

    const parsed: T = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent

    return {
      data: parsed,
      providerModel: response?.model || model,
      fallbackUsed: false
    }
  } catch (err: any) {
    console.warn(`⚠️ [OpenRouter Structured Fallback - ${config.schemaName}]:`, err?.message || err)
    return {
      data: config.fallback,
      providerModel: model,
      fallbackUsed: true
    }
  }
}