# 🛰️ Specifiche API & AI Tools (DKP Kernel v2.6-PURE-SQL)

Documentazione degli endpoint pubblici e autenticati dell'infrastruttura **DevKernelPulse (DKP Kernel v2.6-PURE-SQL)** su **Neon PostgreSQL (Pure SQL)** e **Google Cloud Run**.

> **Nota architetturale:** Tutti gli endpoint legacy `/api/v2.5/` sono stati dismessi. Le API v2.6 utilizzano esclusivamente query SQL parametrizzate e supportano l'accesso programmatico tramite **`@devkernelpulse/sdk@1.1.0`**.

---

## 🔐 Autenticazione

Gli endpoint protetti e i tool AI/Sentinel accettano una chiave API `dkp_live_...` tramite header:

```http
Authorization: Bearer dkp_live_xxxxxxxxxxxxxxxxxxxxxxxx
# oppure
x-api-key: dkp_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

#🤖 POST /api/tools/ai-scan & /api/tools/sentinel-scan
Analizza un repository GitHub pubblico o uno snippet di codice combinando analisi statica SAST e audit AI Sentinel, generando un certificato notarile SHA-256 nel Proof-of-Code Vault.

## 📥 Request Body (Repository Scan)
```json
{
  "url": "[https://github.com/alexdpl/devkernelpulse](https://github.com/alexdpl/devkernelpulse)"
}
```

## 📥 Request Body (Sentinel Code & SAST Scan)

```json
{
  "code": "export const getUser = (id: string) => sql`SELECT * FROM users WHERE id = ${id}`",
  "language": "typescript",
  "filename": "user.repo.ts",
  "useAi": true
}
```

## 📤 Response (200 OK)

```json
{
  "success": true,
  "audit": {
    "grade": "A+",
    "score": 98,
    "findings": []
  },
  "vaultProof": {
    "vaultHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "verified": true
  }
}
```

# 🎨 POST /api/openui/generate & /api/openui/notarize
- POST /api/openui/generate: Genera interfacce Tailwind CSS in streaming SSE (dkp-coder, dkp-flash, dkp-pro).

- POST /api/openui/notarize: Registra l'artefatto generato nel Vault rilasciando un certificato ProofOfSafetyCertificate.

## 🔗 Endpoint Core Pure SQL (v2.6)

| Metodo | Endpoint | Descrizione |
|---|---|---|
| `GET` | `/api/news` | Feed tech real-time aggregato con caching edge |
| `GET/POST` | `/api/blog/posts` | Lettura e pubblicazione articoli editoriali notarizzati |
| `GET` | `/api/nodes` | Albero gerarchico Nodi (`n/`) e Sub-nodi |
| `GET` | `/api/vault/ledger` | Registro unificato delle prove crittografiche **SHA-256** |
| `GET` |`/api/vault/verify`  | Verifica pubblica di integrità tramite `vaultHash` |

---