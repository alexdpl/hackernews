// server/api/user/avatar.post.ts
import { defineEventHandler, readMultipartFormData, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Nessun file inviato' })
    }

    const file = formData.find(item => item.name === 'avatar' || item.name === 'file')
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'File non valido' })
    }

    const mimeType = file.type || 'image/png'
    const base64Data = file.data.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64Data}`

    return {
      success: true,
      url: dataUrl
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Errore upload avatar'
    })
  }
})