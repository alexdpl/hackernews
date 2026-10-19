# Security Policy

## Summary
Questo repository contiene una mitigazione temporanea per due vulnerabilità note nelle dipendenze:
- **braces** — vulnerabilità di denial of service (stack-exhaustion) tramite pattern profondamente annidati.
- **postcss-selector-parser** — complessità quadratica nella parsing dei selettori che può portare a esaurimento CPU.
Inoltre l'audit ha evidenziato una issue ad alta severità in **node-forge** relativa alla verifica di firme RSA PKCS#1 v1.5.

## Current status
- **Mitigazioni applicate**: è stata applicata una patch locale per `braces` (file `patches/braces@3.0.3.patch`) e il progetto è stato configurato per usare patch locali dove necessario.
- **Override temporanei**: per ridurre l'impatto in fase di build sono stati aggiunti override nel `package.json` (vedi nota sotto). Questi override sono una misura temporanea fino a quando non saranno disponibili release upstream sicure.
- **Lockfile aggiornato**: `pnpm-lock.yaml` è stato aggiornato per riflettere le mitigazioni locali. La build è stata verificata localmente e su CI.

## Affected packages and references
- **braces** — Vulnerable versions: `<=3.0.3`. Advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm  
- **postcss-selector-parser** — Vulnerable versions: `<7.1.6`. Advisory: https://github.com/advisories/GHSA-rj75-hqrm-r3gf  
- **node-forge** — Vulnerable versions: `<=1.4.0`. Advisory: https://github.com/advisories/GHSA-86w9-cpqp-85rv

## What we did
- Applicata patch locale per `braces` e committata in `patches/`.
- Aggiornato `pnpm-lock.yaml` per riflettere la risoluzione/patch.
- Test di build eseguiti localmente e su CI (Cloud Build) con successo dopo la correzione del `Dockerfile` per includere `patches/` prima di `pnpm install`.

## Limitazioni e raccomandazioni
- Le patch locali sono **mitigazioni temporanee**. La soluzione definitiva è l’aggiornamento delle dipendenze upstream che includono le correzioni ufficiali.
- Se fate fork del progetto e lo deployate in produzione, **valutate il rischio** e preferite aggiornare le dipendenze upstream non appena le versioni corrette sono rilasciate.
- Se il vostro ambiente richiede la massima sicurezza, considerate di rimuovere o sostituire i pacchetti che transitivamente dipendono da `braces` o `postcss-selector-parser` fino a quando non saranno rilasciate versioni sicure.

## How to help / Contributing
- Se trovate una versione upstream che risolve la vulnerabilità, aprite una PR che aggiorni il pacchetto interessato e rimuova la patch locale.
- Se potete contribuire a una PR upstream per i pacchetti coinvolti, segnalatelo nelle issue upstream e linkate la PR qui.

## Contact
Per segnalazioni di sicurezza o informazioni aggiuntive aprite una issue nel repository con tag `security` o contattate i maintainer via PR.