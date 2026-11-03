// sdk/src/modules/blog.ts
import type { DKPClient } from '../client.js';

export class BlogModule {
  constructor(private client: DKPClient) {}

  async getPost(slugOrId: string) {
    return this.client.request<any>(`/blog/posts/${slugOrId}`);
  }

  async getRelated(id: string, category?: string, tags?: string[]) {
    const query = new URLSearchParams({ id });
    if (category) query.append('cat', category);
    if (tags && tags.length > 0) query.append('tags', tags.join(','));
    
    return this.client.request<any>(`/blog/related?${query.toString()}`);
  }

  async incrementView(slugOrId: string) {
    return this.client.request<{ success: boolean }>(`/blog/posts/${slugOrId}/view`, { method: 'POST' });
  }
}