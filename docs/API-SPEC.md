# 🛰️ Specifiche API & AI Tools

Documentazione degli endpoint pubblici dell'infrastruttura DKP v2.4-GOLD.

---

## 🤖 POST `/api/tools/ai-scan`

Analizza dinamicamente un repository GitHub pubblico leggendo la struttura dei file via GitHub Git Trees API.

### 📥 Request Body
```json
{
  "url": "[https://github.com/alexdpl/hackernews](https://github.com/alexdpl/hackernews)"
}
