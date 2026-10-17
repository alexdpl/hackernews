// server/utils/githubBountyFetcher.ts
export async function fetchGitHubBounties(limit = 15) {
  try {
    // Cerchiamo issue aperte con etichetta 'good first issue' nei linguaggi principali
    const query = encodeURIComponent('label:"good first issue" is:open is:issue language:typescript language:javascript language:vue')
    const response: any = await $fetch(`https://api.github.com/search/issues?q=${query}&sort=updated&order=desc&per_page=${limit}`)
    
    return (response.items || []).map((item: any) => {
      // Estraiamo "owner/repo" dall'URL repository
      const repoUrlParts = item.repository_url.split('/')
      const repoName = `${repoUrlParts[repoUrlParts.length - 2]}/${repoUrlParts[repoUrlParts.length - 1]}`
      
      // Calcoliamo una taglia casuale tra 50 e 150 $PULSE basata sulla complessità simulata
      const reward = Math.floor(Math.random() * 100) + 50

      return {
        github_issue_id: String(item.id),
        repo_name: repoName,
        title: item.title,
        url: item.html_url,
        reward_pulse: reward,
        status: 'open'
      }
    })
  } catch (error) {
    console.error('Errore recupero GitHub Bounties:', error)
    return []
  }
}