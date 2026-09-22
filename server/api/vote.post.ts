// server/api/vote.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { postId, direction } = body // direction: 'up' | 'down'

  if (!postId) {
    return { success: false, error: 'Post ID non valido.' }
  }

  // Simulazione di calcolo voto e persistenza atomica nel Kernel Pulse DB
  await new Promise((resolve) => setTimeout(resolve, 300))
  const delta = direction === 'up' ? 1 : -1
  const updatedScore = Math.floor(Math.random() * 100) + 12 + delta

  return {
    success: true,
    postId,
    newScore: updatedScore,
    message: direction === 'up' ? 'Upvote registrato con successo! 🔥' : 'Voto registrato.'
  }
})