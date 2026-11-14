// server/api/admin/cron/purge.post.ts
import { runPurgeLogs } from './purge.delete'
export default defineEventHandler(runPurgeLogs)