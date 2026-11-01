import { roadmapMilestones } from '~/data/roadmap'

export default defineEventHandler(() => {
  const total = roadmapMilestones.reduce((acc, m) => acc + m.progress, 0)

  return {
    version: 'v2.5-GOLD',
    updatedAt: new Date().toISOString(),
    overallCompletion: Math.round(total / roadmapMilestones.length),
    summary: {
      completed: roadmapMilestones.filter(m => m.status === 'completed').length,
      inProgress: roadmapMilestones.filter(m => m.status === 'in-progress').length,
      upcoming: roadmapMilestones.filter(m => m.status === 'upcoming').length,
    },
    milestones: roadmapMilestones.map(m => ({
      id: m.id,
      quarter: m.quarter,
      phaseTitle: m.phaseTitle,
      version: m.version,
      status: m.status,
      progress: m.progress,
    })),
  }
})