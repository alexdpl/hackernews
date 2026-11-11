// server/api/users/[username].ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const username = event.context.params?.username || 'alexdpl'
  return await $fetch(`/api/user/profile?username=${username}`)
})