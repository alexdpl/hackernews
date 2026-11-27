// app/composables/useDkpTranslator.ts
import { useState, useCookie, computed } from '#imports'

export interface DkpLanguage {
  code: string
  htmlLang: string
  label: string
  flag: string
}

export const OFFICIAL_LANGUAGES: DkpLanguage[] = [
  { code: 'IT', htmlLang: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'EN', htmlLang: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ES', htmlLang: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'FR', htmlLang: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'DE', htmlLang: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'JA', htmlLang: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ZH', htmlLang: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'PT', htmlLang: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'PL', htmlLang: 'pl', label: 'Polski', flag: '🇵🇱' }
]

const translations: Record<string, Record<string, string>> = {
  IT: {
    news: 'Tech Feed',
    nodes: 'DKP Nodes Hub',
    showcase: 'Project Showcase',
    tools: 'DKP Tools',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Invia Post (+30 XP)',
    blog: 'DKP Blog',
    shop: 'API & Ads Shop',
    bounties: 'Bounty Board',
    docsEcosystem: 'Docs Ecosistema & BEMYAGENT',
    vaultLedger: 'Blockchain Vault Ledger',
    login: 'Accedi',
    logout: 'Disconnetti',
    dashboard: 'Dashboard Personale',
    vault: 'I Miei Certificati Vault',
    settings: 'Impostazioni Account',
    adminControl: 'Control Center Admin',
    adminNodes: 'Albero Nodi & Sub-Nodi',
    adminSentinels: 'Console Sentinel Network',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Crawler Engine v2.6',
    mailCenter: 'DKP Mail Center',
    shopManagement: 'Gestione DKP Shop',
    jobsManagement: 'Gestione Job Hub',
    cartTitle: 'Carrello Ecosistema',
    downloadPackage: 'Scarica Pacchetto v2.6',
    xpPrice: 'Prezzo XP',
    navSectionMain: 'NAVIGAZIONE',
    navSectionAdmin: 'AMMINISTRAZIONE DKP',
    navSectionTools: 'DKP TOOLS SUITE',
    navSectionLang: 'LINGUA INTERFACCIA',
    gamificationStatus: 'Stato Gamification',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: 'Nuova sfida Pure SQL',
    captchaSyncing: 'Inizializzazione sfida Sentinel Pure SQL...',
    captchaPrompt: 'Risolvi la verifica di sicurezza:',
    captchaPlaceholder: 'Risultato',
    captchaVerifyBtn: 'Verifica',
    captchaVerifiedOk: 'Verificato via Pure SQL & Sentinel Network',
    captchaWrongAnswer: 'Risposta errata. Riprova.',
    captchaLoadError: 'Errore connessione Sentinel Captcha.'
  },
  EN: {
    news: 'Tech Feed',
    nodes: 'DKP Nodes Hub',
    showcase: 'Project Showcase',
    tools: 'DKP Tools',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Submit Post (+30 XP)',
    blog: 'DKP Blog',
    shop: 'API & Ads Shop',
    bounties: 'Bounty Board',
    docsEcosystem: 'Ecosystem & BEMYAGENT Docs',
    vaultLedger: 'Blockchain Vault Ledger',
    login: 'Sign In',
    logout: 'Disconnect',
    dashboard: 'Personal Dashboard',
    vault: 'My Vault Certificates',
    settings: 'Account Settings',
    adminControl: 'Admin Control Center',
    adminNodes: 'Nodes & Sub-Nodes Tree',
    adminSentinels: 'Sentinel Network Console',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Crawler Engine v2.6',
    mailCenter: 'DKP Mail Center',
    shopManagement: 'DKP Shop Management',
    jobsManagement: 'Job Hub Management',
    cartTitle: 'Ecosystem Cart',
    downloadPackage: 'Download v2.6 Package',
    xpPrice: 'XP Price',
    navSectionMain: 'NAVIGATION',
    navSectionAdmin: 'DKP ADMINISTRATION',
    navSectionTools: 'DKP TOOLS SUITE',
    navSectionLang: 'INTERFACE LANGUAGE',
    gamificationStatus: 'Gamification Status',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: 'New Pure SQL challenge',
    captchaSyncing: 'Initializing Sentinel Pure SQL challenge...',
    captchaPrompt: 'Solve the security check:',
    captchaPlaceholder: 'Answer',
    captchaVerifyBtn: 'Verify',
    captchaVerifiedOk: 'Verified via Pure SQL & Sentinel Network',
    captchaWrongAnswer: 'Incorrect answer. Try again.',
    captchaLoadError: 'Sentinel Captcha connection error.'
  },
  ES: {
    news: 'Tech Feed',
    nodes: 'DKP Nodes Hub',
    showcase: 'Escaparate de Proyectos',
    tools: 'Herramientas DKP',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Enviar Post (+30 XP)',
    blog: 'Blog DKP',
    shop: 'Tienda API & Ads',
    bounties: 'Tablero de Bounties',
    docsEcosystem: 'Docs Ecosistema & BEMYAGENT',
    vaultLedger: 'Blockchain Vault Ledger',
    login: 'Acceder',
    logout: 'Desconectar',
    dashboard: 'Panel Personal',
    vault: 'Mis Certificados Vault',
    settings: 'Ajustes de Cuenta',
    adminControl: 'Centro de Control Admin',
    adminNodes: 'Árbol de Nodos',
    adminSentinels: 'Consola Sentinel Network',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Motor Crawler v2.6',
    mailCenter: 'Centro Mail DKP',
    shopManagement: 'Gestión Tienda DKP',
    jobsManagement: 'Gestión Empleos',
    cartTitle: 'Carrito del Ecosistema',
    downloadPackage: 'Descargar Paquete v2.6',
    xpPrice: 'Precio XP',
    navSectionMain: 'NAVEGACIÓN',
    navSectionAdmin: 'ADMINISTRACIÓN DKP',
    navSectionTools: 'SUITE HERRAMIENTAS DKP',
    navSectionLang: 'IDIOMA DE INTERFAZ',
    gamificationStatus: 'Estado Gamificación',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: 'Nuevo desafío Pure SQL',
    captchaSyncing: 'Iniciando desafío Sentinel Pure SQL...',
    captchaPrompt: 'Resuelve la verificación:',
    captchaPlaceholder: 'Resultado',
    captchaVerifyBtn: 'Verificar',
    captchaVerifiedOk: 'Verificado vía Pure SQL & Sentinel Network',
    captchaWrongAnswer: 'Respuesta incorrecta. Inténtalo de nuevo.',
    captchaLoadError: 'Error de conexión Sentinel Captcha.'
  },
  FR: {
    news: 'Flux Tech',
    nodes: 'DKP Nodes Hub',
    showcase: 'Vitrine Projets',
    tools: 'Outils DKP',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Publier (+30 XP)',
    blog: 'Blog DKP',
    shop: 'Boutique API & Ads',
    bounties: 'Tableau des Bounties',
    docsEcosystem: 'Docs Écosystème & BEMYAGENT',
    vaultLedger: 'Blockchain Vault Ledger',
    login: 'Connexion',
    logout: 'Déconnexion',
    dashboard: 'Tableau de Bord',
    vault: 'Mes Certificats Vault',
    settings: 'Paramètres du Compte',
    adminControl: 'Centre Admin',
    adminNodes: 'Arbre des Nœuds',
    adminSentinels: 'Console Sentinel Network',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Moteur Crawler v2.6',
    mailCenter: 'Centre Mail DKP',
    shopManagement: 'Gestion Boutique DKP',
    jobsManagement: 'Gestion Emplois',
    cartTitle: 'Panier Écosystème',
    downloadPackage: 'Télécharger Package v2.6',
    xpPrice: 'Prix XP',
    navSectionMain: 'NAVIGATION',
    navSectionAdmin: 'ADMINISTRATION DKP',
    navSectionTools: 'SUITE OUTILS DKP',
    navSectionLang: 'LANGUE INTERFACE',
    gamificationStatus: 'Statut Gamification',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: 'Nouveau défi Pure SQL',
    captchaSyncing: 'Initialisation du défi Sentinel Pure SQL...',
    captchaPrompt: 'Résolvez la vérification :',
    captchaPlaceholder: 'Résultat',
    captchaVerifyBtn: 'Vérifier',
    captchaVerifiedOk: 'Vérifié via Pure SQL & Sentinel Network',
    captchaWrongAnswer: 'Réponse incorrecte. Réessayez.',
    captchaLoadError: 'Erreur de connexion Sentinel Captcha.'
  },
  DE: {
    news: 'Tech Feed',
    nodes: 'DKP Nodes Hub',
    showcase: 'Projekt-Showcase',
    tools: 'DKP Tools',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Beitrag senden (+30 XP)',
    blog: 'DKP Blog',
    shop: 'API & Ads Shop',
    bounties: 'Bounty Board',
    docsEcosystem: 'Ökosystem & BEMYAGENT Docs',
    vaultLedger: 'Blockchain Vault Ledger',
    login: 'Anmelden',
    logout: 'Abmelden',
    dashboard: 'Persönliches Dashboard',
    vault: 'Meine Vault Zertifikate',
    settings: 'Konto-Einstellungen',
    adminControl: 'Admin-Kontrollzentrum',
    adminNodes: 'Knotenbaum',
    adminSentinels: 'Sentinel Network Konsole',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Crawler-Engine v2.6',
    mailCenter: 'DKP Mail Center',
    shopManagement: 'DKP Shop-Verwaltung',
    jobsManagement: 'Job-Hub Verwaltung',
    cartTitle: 'Ökosystem-Warenkorb',
    downloadPackage: 'v2.6 Paket herunterladen',
    xpPrice: 'XP-Preis',
    navSectionMain: 'NAVIGATION',
    navSectionAdmin: 'DKP VERWALTUNG',
    navSectionTools: 'DKP TOOLS SUITE',
    navSectionLang: 'SPRACHE',
    gamificationStatus: 'Gamification-Status',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: 'Neue Pure SQL Aufgabe',
    captchaSyncing: 'Sentinel Pure SQL Prüfung wird geladen...',
    captchaPrompt: 'Sicherheitsabfrage lösen:',
    captchaPlaceholder: 'Ergebnis',
    captchaVerifyBtn: 'Prüfen',
    captchaVerifiedOk: 'Verifiziert über Pure SQL & Sentinel Network',
    captchaWrongAnswer: 'Falsche Antwort. Bitte erneut versuchen.',
    captchaLoadError: 'Sentinel Captcha Verbindungsfehler.'
  },
  JA: {
    news: 'テックフィード',
    nodes: 'DKP Nodes ハブ',
    showcase: 'プロジェクト一覧',
    tools: 'DKP ツール',
    openuiStudio: 'OpenUI Studio AI',
    submit: '投稿する (+30 XP)',
    blog: 'DKP ブログ',
    shop: 'API & 広告ショップ',
    bounties: 'バウンティボード',
    docsEcosystem: 'エコシステム & BEMYAGENT ドキュメント',
    vaultLedger: 'Blockchain Vault 台帳',
    login: 'ログイン',
    logout: 'ログアウト',
    dashboard: '個人ダッシュボード',
    vault: 'マイ Vault 証明書',
    settings: 'アカウント設定',
    adminControl: '管理者コントロール',
    adminNodes: 'ノード階層ツリー',
    adminSentinels: 'Sentinel コンソール',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'クローラーエンジン v2.6',
    mailCenter: 'DKP メールセンター',
    shopManagement: 'DKP ショップ管理',
    jobsManagement: '求人ハブ管理',
    cartTitle: 'エコシステムカート',
    downloadPackage: 'v2.6 パッケージをダウンロード',
    xpPrice: 'XP 価格',
    navSectionMain: 'ナビゲーション',
    navSectionAdmin: 'DKP 管理メニュー',
    navSectionTools: 'DKP ツールスイート',
    navSectionLang: '表示言語',
    gamificationStatus: 'ゲーミフィケーション状態',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: '新しい Pure SQL チャレンジ',
    captchaSyncing: 'Sentinel Pure SQL 検証を初期化中...',
    captchaPrompt: 'セキュリティ計算を解いてください:',
    captchaPlaceholder: '回答',
    captchaVerifyBtn: '検証',
    captchaVerifiedOk: 'Pure SQL & Sentinel Network 検証完了',
    captchaWrongAnswer: '回答が正しくありません。再試行してください。',
    captchaLoadError: 'Sentinel Captcha 接続エラー。'
  },
  ZH: {
    news: '技术动态',
    nodes: 'DKP 节点社区',
    showcase: '项目展示',
    tools: 'DKP 工具集',
    openuiStudio: 'OpenUI Studio AI',
    submit: '发布帖子 (+30 XP)',
    blog: 'DKP 博客',
    shop: 'API 与广告商店',
    bounties: '赏金任务板',
    docsEcosystem: '生态系统与 BEMYAGENT 文档',
    vaultLedger: 'Blockchain Vault 账本',
    login: '登录',
    logout: '退出登录',
    dashboard: '个人控制面板',
    vault: '我的 Vault 证书',
    settings: '账户设置',
    adminControl: '管理员控制中心',
    adminNodes: '节点层级树',
    adminSentinels: 'Sentinel 控制台',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: '爬虫引擎 v2.6',
    mailCenter: 'DKP 邮件中心',
    shopManagement: 'DKP 商店管理',
    jobsManagement: '招聘中心管理',
    cartTitle: '生态系统购物车',
    downloadPackage: '下载 v2.6 软件包',
    xpPrice: 'XP 价格',
    navSectionMain: '导航菜单',
    navSectionAdmin: 'DKP 系统管理',
    navSectionTools: 'DKP 工具套件',
    navSectionLang: '界面语言',
    gamificationStatus: '游戏化积分状态',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: '刷新 Pure SQL 验证',
    captchaSyncing: '正在初始化 Sentinel Pure SQL 验证...',
    captchaPrompt: '请完成安全计算验证：',
    captchaPlaceholder: '输入结果',
    captchaVerifyBtn: '验证',
    captchaVerifiedOk: '已通过 Pure SQL & Sentinel Network 验证',
    captchaWrongAnswer: '答案错误，请重试。',
    captchaLoadError: 'Sentinel Captcha 连接失败。'
  },
  PT: {
    news: 'Tech Feed',
    nodes: 'DKP Nodes Hub',
    showcase: 'Vitrine de Projetos',
    tools: 'Ferramentas DKP',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Enviar Post (+30 XP)',
    blog: 'Blog DKP',
    shop: 'Loja API & Ads',
    bounties: 'Quadro de Bounties',
    docsEcosystem: 'Docs Ecossistema & BEMYAGENT',
    vaultLedger: 'Blockchain Vault Ledger',
    login: 'Entrar',
    logout: 'Sair',
    dashboard: 'Painel Pessoal',
    vault: 'Meus Certificados Vault',
    settings: 'Configurações da Conta',
    adminControl: 'Painel de Controlo Admin',
    adminNodes: 'Árvore de Nós',
    adminSentinels: 'Consola Sentinel Network',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Motor Crawler v2.6',
    mailCenter: 'Centro Mail DKP',
    shopManagement: 'Gestão Loja DKP',
    jobsManagement: 'Gestão de Empregos',
    cartTitle: 'Carrinho do Ecossistema',
    downloadPackage: 'Descarregar Pacote v2.6',
    xpPrice: 'Preço XP',
    navSectionMain: 'NAVEGAÇÃO',
    navSectionAdmin: 'ADMINISTRAÇÃO DKP',
    navSectionTools: 'SUITE FERRAMENTAS DKP',
    navSectionLang: 'IDIOMA DA INTERFACE',
    gamificationStatus: 'Estado Gamification',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: 'Novo desafio Pure SQL',
    captchaSyncing: 'A inicializar desafio Sentinel Pure SQL...',
    captchaPrompt: 'Resolva a verificação de segurança:',
    captchaPlaceholder: 'Resultado',
    captchaVerifyBtn: 'Verificar',
    captchaVerifiedOk: 'Verificado via Pure SQL & Sentinel Network',
    captchaWrongAnswer: 'Resposta incorreta. Tente novamente.',
    captchaLoadError: 'Erro de ligação Sentinel Captcha.'
  },
  PL: {
    news: 'Tech Feed',
    nodes: 'DKP Nodes Hub',
    showcase: 'Prezentacja Projektów',
    tools: 'Narzędzia DKP',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Wyślij Post (+30 XP)',
    blog: 'Blog DKP',
    shop: 'Sklep API & Ads',
    bounties: 'Tablica Bounty',
    docsEcosystem: 'Dokumentacja Ekosystemu & BEMYAGENT',
    vaultLedger: 'Blockchain Vault Ledger',
    login: 'Zaloguj',
    logout: 'Wyloguj',
    dashboard: 'Osobisty Pulpit',
    vault: 'Moje Certyfikaty Vault',
    settings: 'Ustawienia Konta',
    adminControl: 'Centrum Admina',
    adminNodes: 'Drzewo Węzłów',
    adminSentinels: 'Konsola Sentinel Network',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Silnik Crawler v2.6',
    mailCenter: 'Centrum Poczty DKP',
    shopManagement: 'Zarządzanie Sklepem',
    jobsManagement: 'Zarządzanie Ofertami',
    cartTitle: 'Koszyk Ekosystemu',
    downloadPackage: 'Pobierz Pakiet v2.6',
    xpPrice: 'Cena XP',
    navSectionMain: 'NAWIGACJA',
    navSectionAdmin: 'ADMINISTRACJA DKP',
    navSectionTools: 'PAKIET NARZĘDZI DKP',
    navSectionLang: 'JĘZYK INTERFEJSU',
    gamificationStatus: 'Status Gamifikacji',
    captchaTitle: 'DKP Kernel Captcha v2.6',
    captchaRefresh: 'Nowe wyzwanie Pure SQL',
    captchaSyncing: 'Inicjalizacja wyzwania Sentinel Pure SQL...',
    captchaPrompt: 'Rozwiąż zadanie bezpieczeństwa:',
    captchaPlaceholder: 'Wynik',
    captchaVerifyBtn: 'Zweryfikuj',
    captchaVerifiedOk: 'Zweryfikowano przez Pure SQL & Sentinel Network',
    captchaWrongAnswer: 'Błędna odpowiedź. Spróbuj ponownie.',
    captchaLoadError: 'Błąd połączenia Sentinel Captcha.'
  }
}

export function useDkpTranslator() {
  const langCookie = useCookie<string>('dkp_lang', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
    default: () => 'IT'
  })

  const initialCode = OFFICIAL_LANGUAGES.some((l) => l.code === langCookie.value)
    ? langCookie.value
    : 'IT'

  const currentLang = useState<string>('dkp_active_lang', () => initialCode)
  const dynamicCache = useState<Record<string, string>>('dkp_dynamic_i18n_cache', () => ({}))

  const activeLanguageObj = computed(() => {
    return OFFICIAL_LANGUAGES.find((l) => l.code === currentLang.value) || OFFICIAL_LANGUAGES[0]
  })

  function syncDocumentLang(langObj: DkpLanguage) {
    if (import.meta.client && typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', langObj.htmlLang)
    }
  }

  function setLanguage(code: string) {
    const normalized = code.toUpperCase()
    const found = OFFICIAL_LANGUAGES.find((l) => l.code === normalized)
    if (found) {
      currentLang.value = found.code
      langCookie.value = found.code
      if (import.meta.client) {
        try {
          localStorage.setItem('dkp_lang', found.code)
        } catch {}
        syncDocumentLang(found)
      }
    }
  }

  function initTranslator() {
    if (import.meta.client) {
      let resolved = currentLang.value
      try {
        const saved = localStorage.getItem('dkp_lang')
        if (saved && OFFICIAL_LANGUAGES.some((l) => l.code === saved)) {
          resolved = saved
        }
      } catch {}

      if (resolved !== currentLang.value) {
        currentLang.value = resolved
        langCookie.value = resolved
      }
      syncDocumentLang(activeLanguageObj.value)
    }
  }

  function t(key: string): string {
    const langDict = translations[currentLang.value] || translations.IT
    return langDict[key] || translations.IT[key] || key
  }

  /**
   * Traduce testi dinamici (titoli thread, descrizioni nodi, snippet)
   * usando la cache Pure SQL 2.6 + guardia Sentinel Network.
   */
  async function translateDynamic(text: string, targetOverride?: string): Promise<string> {
    const clean = String(text || '').trim()
    const target = (targetOverride || currentLang.value || 'IT').toUpperCase()
    if (!clean || target === 'IT') return clean

    const cacheKey = `${target}:${clean}`
    if (dynamicCache.value[cacheKey]) {
      return dynamicCache.value[cacheKey]
    }

    try {
      const res: any = await $fetch('/api/translator/sync', {
        method: 'POST',
        body: {
          text: clean,
          targetLang: target
        }
      })
      if (res?.success && res?.translatedText) {
        dynamicCache.value[cacheKey] = res.translatedText
        return res.translatedText
      }
    } catch {
      // Fallback silenzioso sul testo originale
    }
    return clean
  }

  return {
    currentLang,
    activeLanguageObj,
    languages: OFFICIAL_LANGUAGES,
    setLanguage,
    initTranslator,
    t,
    translateDynamic
  }
}