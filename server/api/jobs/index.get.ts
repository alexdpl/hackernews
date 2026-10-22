// server/api/jobs/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '~~/server/utils/db'
import { pulseStories } from '~~/server/db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.max(1, parseInt(query.limit as string) || 15) // Uniformato a 15
    const offset = (page - 1) * limit

    const db = await getDb()
    if (!db) throw new Error('Database non disponibile')

    const dbJobs = await db
      .select()
      .from(pulseStories)
      .where(eq(pulseStories.type, 'jobs'))
      .orderBy(desc(pulseStories.createdAt))
      .limit(limit + 1)
      .offset(offset)

    const hasMore = dbJobs.length > limit
    const items = hasMore ? dbJobs.slice(0, limit) : dbJobs

    const formattedJobs = items.map((j: any) => ({
      id: j.id,
      title: j.title,
      company: typeof j.author === 'object' ? j.author?.username : (j.author || j.domain || 'Remote Partner'),
      location: 'Remoto / Globale',
      salary: 'Meritocratico / $PULSE',
      tags: [j.domain || 'Tech', 'Remote'],
      url: j.url || '#',
      createdAt: j.createdAt || new Date()
    }))

    return {
      success: true,
      data: formattedJobs,
      pagination: {
        page,
        limit,
        hasMore
      }
    }
  } catch (err) {
    console.warn('⚠️ [JOBS API WARN] Errore lettura DB, uso fallback:', err)
    return {
      success: true,
      data: [
        {
          id: 1,
          title: 'Senior Nuxt 4 & Vue Architect',
          company: 'DevKernelPulse Core',
          location: 'Remoto (EU)',
          salary: '€65,000 - €85,000',
          tags: ['Nuxt 4', 'TypeScript'],
          url: '#',
          createdAt: new Date()
        }
      ],
      pagination: { page: 1, limit: 15, hasMore: false }
    }
  }
})