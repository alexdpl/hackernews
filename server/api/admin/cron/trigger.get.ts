// server/api/admin/cron/trigger.get.ts
import { runHnTrigger } from './trigger.post'
export default defineEventHandler(runHnTrigger)