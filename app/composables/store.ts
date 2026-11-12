// app/composables/store.ts
import { computed, ref, reactive } from 'vue'
import type { WritableComputedOptions } from 'vue'
import { useState } from '#imports'
import { validFeeds } from '~~/utils/api'
import type { Item, User } from '~~/types'

export interface StoreState {
  items: Record<number, Item>
  comments: Record<number, Item[]>
  users: Record<string, User>
  feeds: Record<string, Record<number, number[]>>
}

export const useStore = () =>
  useState<StoreState>('dkp_hn_store_v26', () => ({
    items: {},
    users: {},
    comments: {},
    feeds: Object.fromEntries(validFeeds.map(i => [i, {}]))
  }))

export interface FeedQuery {
  feed: string
  page: number
}

export function getFeed(state: StoreState, { feed, page }: FeedQuery): Item[] | undefined {
  const ids = state.feeds?.[feed]?.[page]
  if (ids?.length) {
    return ids.map(i => state.items[i]).filter(Boolean) as Item[]
  }
  return undefined
}

export function fetchFeed(query: FeedQuery) {
  const state = useStore()
  const { feed, page } = query

  // Accesso difensivo per evitare TypeError su feed dinamici
  if (!state.value.feeds[feed]) {
    state.value.feeds[feed] = {}
  }

  const cachedIds = state.value.feeds[feed][page] || []
  const initialItems = cachedIds.map(id => state.value.items[id]).filter(Boolean) as Item[]

  return reactiveLoad<Item[]>(
    () => getFeed(state.value, query),
    (items) => {
      const safeItems = Array.isArray(items) ? items.filter(Boolean) : []
      if (!state.value.feeds[feed]) {
        state.value.feeds[feed] = {}
      }
      state.value.feeds[feed][page] = safeItems.map(item => item.id)

      safeItems.forEach((item) => {
        if (state.value.items[item.id]) {
          Object.assign(state.value.items[item.id], item)
        } else {
          state.value.items[item.id] = item
        }
      })
    },
    () => $fetch<Item[]>('/api/hn/feeds', { params: { feed, page } }),
    initialItems.length ? initialItems : undefined
  )
}

export function fetchItem(id: number) {
  const state = useStore()

  return reactiveLoad<Item>(
    () => state.value.items[id],
    (item) => {
      if (item) state.value.items[id] = item
    },
    () => $fetch<Item>('/api/hn/item', { params: { id } })
  )
}

export function fetchComments(id: number) {
  const state = useStore()

  return reactiveLoad<Item[]>(
    () => state.value.comments[id],
    (comments) => {
      state.value.comments[id] = comments || []
    },
    () => $fetch<Item>('/api/hn/item', { params: { id } }).then(i => i?.comments || [])
  )
}

export function fetchUser(id: string) {
  const state = useStore()

  return reactiveLoad<User>(
    () => state.value.users[id],
    (user) => {
      if (user) state.value.users[id] = user
    },
    () => $fetch<User>('/api/hn/user', { params: { id } })
  )
}

/**
 * Crea stato reattivo SWR (Stale-While-Revalidate)
 * Lato server (SSR) esegue il fetch in modo sincrono (await) per SEO e hydration.
 */
export async function reactiveLoad<T>(
  get: () => T | undefined,
  set: (data: T) => void,
  fetcher: () => Promise<T>,
  init?: T
) {
  const data = computed({
    get,
    set
  } as WritableComputedOptions<T | undefined>)

  const loading = ref(false)
  const error = ref<string | null>(null)

  if (data.value == null) {
    if (init != null) {
      data.value = init
    }

    const task = async () => {
      try {
        loading.value = true
        error.value = null
        const fetched = await fetcher()

        if (
          data.value != null &&
          typeof data.value === 'object' &&
          !Array.isArray(data.value) &&
          typeof fetched === 'object' &&
          !Array.isArray(fetched)
        ) {
          data.value = Object.assign({}, data.value, fetched)
        } else {
          data.value = fetched
        }
      } catch (e: any) {
        error.value = e?.data?.statusMessage || e?.message || 'Errore sincronizzazione feed'
        console.error('[DKP Store SWR Error]:', e)
        data.value = undefined
      } finally {
        loading.value = false
      }
    }

    if (import.meta.client) {
      task()
    } else {
      await task()
    }
  }

  return reactive({
    loading,
    error,
    data
  })
}