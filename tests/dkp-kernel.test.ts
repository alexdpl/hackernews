// tests/dkp-kernel.test.ts
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import {
  DKP_CANONICAL_ORIGIN,
  DKP_STATIC_ROUTES,
  escapeXml
} from '../server/utils/dkpSeoEngine'
import { resolveSafeAdUrl, DKP_HOUSE_CAMPAIGNS } from '../server/utils/dkpAdsService'
import { useDkpNodesTree, type DkpSubNode } from '../app/composables/useDkpNodesTree'

describe('DKP Kernel v2.6 Pure-SQL — Quality & Integrity Suite', () => {
  it('SEO Engine: esegue correttamente l’escaping XML per Sitemap e RSS', () => {
    const dirty = `Nuxt & Neon <v2.6> "Pure" 'SQL'`
    const clean = escapeXml(dirty)
    expect(clean).toBe('Nuxt &amp; Neon &lt;v2.6&gt; &quot;Pure&quot; &apos;SQL&apos;')
  })

  it('SEO & AI Engine: include le rotte core, blog, nodes e docs senza slash finali errati', () => {
    const paths = DKP_STATIC_ROUTES.map((r) => r.path)
    expect(DKP_CANONICAL_ORIGIN).toBe('https://devkernelpulse.org')
    expect(paths).toContain('')
    expect(paths).toContain('/blog')
    expect(paths).toContain('/nodes')
    expect(paths).toContain('/docs/api')
    expect(paths).toContain('/tools/proof-of-code')
  })

  it('Ads Engine: riscrive rotte legacy e blocca payload XSS javascript:', () => {
    expect(resolveSafeAdUrl('javascript:alert(1)')).toEqual({
      url: '/nodes',
      isInternal: true
    })
    expect(resolveSafeAdUrl('/vault')).toEqual({
      url: '/nodes/n/blockchain-vault',
      isInternal: true
    })
    expect(resolveSafeAdUrl('https://www.amazon.it/dp/B000000')).toEqual({
      url: 'https://www.amazon.it/dp/B000000',
      isInternal: false
    })
    expect(DKP_HOUSE_CAMPAIGNS.length).toBeGreaterThanOrEqual(5)
  })

  it('Nodes Tree: classifica correttamente i nodi nelle 7 macro-aree e filtra per query', () => {
    const sampleNodes = ref<DkpSubNode[]>([
      { id: 1, name: 'Pure SQL', slug: 'pure-sql', icon: '🗄️', color: 'amber', subscribersCount: 120, postsCount: 45 },
      { id: 2, name: 'AI Agents', slug: 'ai-agents', icon: '🧠', color: 'purple', subscribersCount: 300, postsCount: 90 }
    ])

    const { categoryTree } = useDkpNodesTree(sampleNodes)
    const keys = categoryTree.value.map((g) => g.key)
    expect(keys).toContain('data-databases')
    expect(keys).toContain('ai-ml')

    const query = ref('sql')
    const filtered = useDkpNodesTree(sampleNodes, query)
    expect(filtered.categoryTree.value).toHaveLength(1)
    expect(filtered.categoryTree.value[0].key).toBe('data-databases')
  })
})