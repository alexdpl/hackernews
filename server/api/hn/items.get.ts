// server/api/hn/items.get.ts
import { fetchMultiSourceFeed } from '~~/server/utils/multiSourceFetcher'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const section = (query.section as string) || 'news'
  const page = parseInt((query.page as string) || '1', 10)
  const limit = parseInt((query.limit as string) || '12', 10)

  try {
    // Recupera tutti gli elementi multi-fonte filtrati per sezione
    const rawItems = await fetchMultiSourceFeed(section)
    
    // Logica di paginazione universale
    const totalItems = rawItems.length
    const totalPages = Math.ceil(totalItems / limit) || 1
    const startIndex = (page - 1) * limit
    const paginatedItems = rawItems.slice(startIndex, startIndex + limit)

    return {
      success: true,
      section,
      page,
      limit,
      totalItems,
      totalPages,
      data: paginatedItems
    }
  } catch (error: any) {
    console.error('Errore nell\'endpoint items.get.ts:', error)
    return {
      success: false,
      message: 'Errore nel recupero dei feed multi-fonte',
      error: error.message
    }
  }
})