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

// Dizionario Core DKP Kernel v2.6-PURE-SQL
const translations: Record<string, Record<string, string>> = {
  IT: {
    news: 'News',
    nodes: 'Node Talks Hub',
    tools: 'DKP Tools',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Invia',
    blog: 'Blog',
    shop: 'DKP Shop',
    bounties: 'Bounty Board',
    login: 'Accedi',
    logout: 'Disconnetti',
    dashboard: 'Dashboard Personale',
    vault: 'I Miei Certificati Vault',
    settings: 'Impostazioni Account',
    adminControl: 'Control Center Admin',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'DKP Crawler Engine',
    shopManagement: 'Gestione DKP Shop',
    jobsManagement: 'Gestione Job Hub',
    cartTitle: 'Carrello Ecosistema',
    downloadPackage: 'Scarica Pacchetto v2.6',
    xpPrice: 'Prezzo XP'
  },
  EN: {
    news: 'News',
    nodes: 'Node Talks Hub',
    tools: 'DKP Tools',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Submit',
    blog: 'Blog',
    shop: 'DKP Shop',
    bounties: 'Bounty Board',
    login: 'Sign In',
    logout: 'Disconnect',
    dashboard: 'Personal Dashboard',
    vault: 'My Vault Certificates',
    settings: 'Account Settings',
    adminControl: 'Admin Control Center',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'DKP Crawler Engine',
    shopManagement: 'DKP Shop Management',
    jobsManagement: 'Job Hub Management',
    cartTitle: 'Ecosystem Cart',
    downloadPackage: 'Download v2.6 Package',
    xpPrice: 'XP Price'
  },
  ES: {
    news: 'Noticias',
    nodes: 'Node Talks Hub',
    tools: 'Herramientas DKP',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Enviar',
    blog: 'Blog',
    shop: 'Tienda DKP',
    bounties: 'Tablero de Bounties',
    login: 'Acceder',
    logout: 'Desconectar',
    dashboard: 'Panel Personal',
    vault: 'Mis Certificados Vault',
    settings: 'Ajustes de Cuenta',
    adminControl: 'Centro de Control Admin',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Motor Crawler DKP',
    shopManagement: 'Gestión Tienda DKP',
    jobsManagement: 'Gestión Empleos',
    cartTitle: 'Carrito del Ecosistema',
    downloadPackage: 'Descargar Paquete v2.6',
    xpPrice: 'Precio XP'
  },
  FR: {
    news: 'Nouvelles',
    nodes: 'Node Talks Hub',
    tools: 'Outils DKP',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Soumettre',
    blog: 'Blog',
    shop: 'Boutique DKP',
    bounties: 'Tableau des Bounties',
    login: 'Connexion',
    logout: 'Déconnexion',
    dashboard: 'Tableau de Bord',
    vault: 'Mes Certificats Vault',
    settings: 'Paramètres du Compte',
    adminControl: 'Centre Admin',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Moteur Crawler DKP',
    shopManagement: 'Gestion Boutique DKP',
    jobsManagement: 'Gestion Emplois',
    cartTitle: 'Panier Écosystème',
    downloadPackage: 'Télécharger Package v2.6',
    xpPrice: 'Prix XP'
  },
  DE: {
    news: 'News',
    nodes: 'Node Talks Hub',
    tools: 'DKP Tools',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Einreichen',
    blog: 'Blog',
    shop: 'DKP Shop',
    bounties: 'Bounty Board',
    login: 'Anmelden',
    logout: 'Abmelden',
    dashboard: 'Persönliches Dashboard',
    vault: 'Meine Vault Zertifikate',
    settings: 'Konto-Einstellungen',
    adminControl: 'Admin-Kontrollzentrum',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'DKP Crawler-Engine',
    shopManagement: 'DKP Shop-Verwaltung',
    jobsManagement: 'Job-Hub Verwaltung',
    cartTitle: 'Ökosystem-Warenkorb',
    downloadPackage: 'v2.6 Paket herunterladen',
    xpPrice: 'XP-Preis'
  },
  JA: {
    news: 'ニュース',
    nodes: 'Node Talks ハブ',
    tools: 'DKP ツール',
    openuiStudio: 'OpenUI Studio AI',
    submit: '投稿する',
    blog: 'ブログ',
    shop: 'DKP ショップ',
    bounties: 'バウンティボード',
    login: 'ログイン',
    logout: 'ログアウト',
    dashboard: '個人ダッシュボード',
    vault: 'マイ Vault 証明書',
    settings: 'アカウント設定',
    adminControl: '管理者コントロール',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'DKP クローラーエンジン',
    shopManagement: 'DKP ショップ管理',
    jobsManagement: '求人ハブ管理',
    cartTitle: 'エコシステムカート',
    downloadPackage: 'v2.6 パッケージをダウンロード',
    xpPrice: 'XP 価格'
  },
  ZH: {
    news: '新闻',
    nodes: 'Node Talks 社区',
    tools: 'DKP 工具',
    openuiStudio: 'OpenUI Studio AI',
    submit: '提交',
    blog: '博客',
    shop: 'DKP 商店',
    bounties: '赏金任务板',
    login: '登录',
    logout: '退出登录',
    dashboard: '个人控制面板',
    vault: '我的 Vault 证书',
    settings: '账户设置',
    adminControl: '管理员控制中心',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'DKP 爬虫引擎',
    shopManagement: 'DKP 商店管理',
    jobsManagement: '招聘中心管理',
    cartTitle: '生态系统购物车',
    downloadPackage: '下载 v2.6 软件包',
    xpPrice: 'XP 价格'
  },
  PT: {
    news: 'Notícias',
    nodes: 'Node Talks Hub',
    tools: 'Ferramentas DKP',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Submeter',
    blog: 'Blog',
    shop: 'Loja DKP',
    bounties: 'Quadro de Bounties',
    login: 'Entrar',
    logout: 'Sair',
    dashboard: 'Painel Pessoal',
    vault: 'Meus Certificados Vault',
    settings: 'Configurações da Conta',
    adminControl: 'Painel de Controlo Admin',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Motor Crawler DKP',
    shopManagement: 'Gestão Loja DKP',
    jobsManagement: 'Gestão de Empregos',
    cartTitle: 'Carrinho do Ecossistema',
    downloadPackage: 'Descarregar Pacote v2.6',
    xpPrice: 'Preço XP'
  },
  PL: {
    news: 'Wiadomości',
    nodes: 'Node Talks Hub',
    tools: 'Narzędzia DKP',
    openuiStudio: 'OpenUI Studio AI',
    submit: 'Wyślij',
    blog: 'Blog',
    shop: 'Sklep DKP',
    bounties: 'Tablica Bounty',
    login: 'Zaloguj',
    logout: 'Wyloguj',
    dashboard: 'Osobisty Pulpit',
    vault: 'Moje Certyfikaty Vault',
    settings: 'Ustawienia Konta',
    adminControl: 'Centrum Admina',
    dkpDoctor: 'DKP Doctor (Pure SQL)',
    crawlerEngine: 'Silnik Crawler DKP',
    shopManagement: 'Zarządzanie Sklepem',
    jobsManagement: 'Zarządzanie Ofertami',
    cartTitle: 'Koszyk Ekosystemu',
    downloadPackage: 'Pobierz Pakiet v2.6',
    xpPrice: 'Cena XP'
  }
}

export function useDkpTranslator() {
  // Lettura SSR-safe del cookie tecnico dkp_lang (evita mismatch hydration)
  const langCookie = useCookie<string>('dkp_lang', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
    default: () => 'IT'
  })

  const initialCode = OFFICIAL_LANGUAGES.some(l => l.code === langCookie.value)
    ? langCookie.value
    : 'IT'

  const currentLang = useState<string>('dkp_active_lang', () => initialCode)

  const activeLanguageObj = computed(() => {
    return OFFICIAL_LANGUAGES.find(l => l.code === currentLang.value) || OFFICIAL_LANGUAGES[0]
  })

  function syncDocumentLang(langObj: DkpLanguage) {
    if (import.meta.client && typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', langObj.htmlLang)
    }
  }

  function setLanguage(code: string) {
    const normalized = code.toUpperCase()
    const found = OFFICIAL_LANGUAGES.find(l => l.code === normalized)
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
        if (saved && OFFICIAL_LANGUAGES.some(l => l.code === saved)) {
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
    const langDict = translations[currentLang.value] || translations['IT']
    return langDict[key] || translations['IT'][key] || key
  }

  return {
    currentLang,
    activeLanguageObj,
    languages: OFFICIAL_LANGUAGES,
    setLanguage,
    initTranslator,
    t
  }
}