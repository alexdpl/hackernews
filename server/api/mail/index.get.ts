import { MailService } from '~~/server/services/mail.service'

export default defineEventHandler(async (event) => {
  try {
    const data = await MailService.getMessages(50)
    return { success: true, ...data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})