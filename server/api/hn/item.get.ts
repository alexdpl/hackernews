// server/api/hn/item.get.ts
import { $fetch } from 'ofetch'
import type { Item } from '~~/types'

const BASE_URL = 'https://hacker-news.firebaseio.com/v0'

export async function fetchItem(
  id: string,
  withComments = false,
): Promise<Item> {
  const item: any = await $fetch(`/item/${id}.json`, { baseURL: BASE_URL })
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: `Item with ID ${id} not found.`,
    })
  }

  item.kids = item.kids || []
  return {
    id: item.id,
    user: item.by,
    points: item.score,
    time: item.time,
    content: item.text,
    url: item.url,
    type: item.type,
    title: item.title,
    comments_count: Object.values(item.kids).length,
    comments: withComments
      ? await Promise.all(
          Object.values(item.kids as string[]).map(kidId =>
            fetchItem(String(kidId), withComments),
          ),
        )
      : [],
  }
}

export default defineCachedEventHandler((event) => {
  const { id } = getQuery(event) as { id?: string }

  if (!id) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Must provide an item ID.',
    })
  }
  if (Number.isNaN(+id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item ID must be a number but got ' + id,
    })
  }

  return fetchItem(id, true)
}, {
  name: 'api/hn/item',
  getKey(event) {
    const { id } = getQuery(event)
    return ['item', id].join('/')
  },
  swr: false,
  maxAge: 60,
})