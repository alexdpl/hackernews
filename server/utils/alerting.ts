// server/utils/alerting.ts
export interface AlertPayload {
  title: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  metadata?: Record<string, any>
}

export async function sendAdminAlert(payload: AlertPayload) {
  const discordWebhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  const colorMap = {
    INFO: 3447003,      // Blue
    WARNING: 16776960,  // Yellow
    CRITICAL: 15158332  // Red
  }

  // 1. Invio su Discord Webhook
  if (discordWebhookUrl) {
    fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `${payload.severity === 'CRITICAL' ? '🚨' : '⚠️'} ${payload.title}`,
          description: payload.message,
          color: colorMap[payload.severity],
          fields: Object.entries(payload.metadata || {}).map(([k, v]) => ({
            name: k,
            value: String(v),
            inline: true
          })),
          timestamp: new Date().toISOString()
        }]
      })
    }).catch(err => console.error('[ALERT DISCORD ERROR]:', err))
  }

  // 2. Invio su Telegram Bot
  if (telegramBotToken && telegramChatId) {
    const text = `*${payload.severity === 'CRITICAL' ? '🚨' : '⚠️'} ${payload.title}*\n\n${payload.message}\n\n\`\`\`json\n${JSON.stringify(payload.metadata || {}, null, 2)}\n\`\`\``
    fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        parse_mode: 'Markdown'
      })
    }).catch(err => console.error('[ALERT TELEGRAM ERROR]:', err))
  }
}