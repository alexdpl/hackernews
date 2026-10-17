import { fetchGitHubBounties } from '~~/server/utils/githubBountyFetcher'

export default defineEventHandler(async (event) => {
  try {
    const liveBounties = await fetchGitHubBounties(12)

    return {
      success: true,
      total: liveBounties.length,
      bounties: liveBounties
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Impossibile caricare la Bounty Board',
      error: err.message
    }
  }
})