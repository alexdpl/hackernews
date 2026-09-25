// app/composables/useDkpTranslator.ts
import { useState, onMounted } from '#imports'

export interface DkpLanguage {
  code: string
  label: string
  flag: string
}

export const OFFICIAL_LANGUAGES: DkpLanguage[] = [
  { code: 'IT', label: 'Italiano', flag: '🇮🇹' },
  { code: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'ES', label: 'Español', flag: '🇪🇸' },
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
  { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'JA', label: '日本語', flag: '🇯🇵' },
  { code: 'ZH', label: '中文', flag: '🇨🇳' },
  { code: 'PT', label: 'Português', flag: '🇵🇹' },
  { code: 'PL', label: 'Polski', flag: '🇵🇱' }
]

// Dizionario Core DKP Kernel v2.0
const translations: Record<string, Record<string, string>> = {
  IT: {
    news: 'news',
    tools: 'DKP Tools',
    submit: 'submit',
    blog: 'Blog',
    login: 'Accedi',
    logout: 'Disconnetti',
    dashboard: 'Dashboard Personale',
    vault: 'I Miei Certificati Vault',
    settings: 'Impostazioni Account',
    adminControl: 'Control Center Admin',
    crawlerEngine: 'DKP Crawler Engine',
    shopManagement: 'Gestione DKP Shop',
    jobsManagement: 'Gestione Job Hub'
  },
  EN: {
    news: 'news',
    tools: 'DKP Tools',
    submit: 'submit',
    blog: 'Blog',
    login: 'Sign In',
    logout: 'Disconnect',
    dashboard: 'Personal Dashboard',
    vault: 'My Vault Certificates',
    settings: 'Account Settings',
    adminControl: 'Admin Control Center',
    crawlerEngine: 'DKP Crawler Engine',
    shopManagement: 'DKP Shop Management',
    jobsManagement: 'Job Hub Management'
  },
  ES: {
    news: 'noticias',
    tools: 'Herramientas DKP',
    submit: 'enviar',
    blog: 'Blog',
    login: 'Acceder',
    logout: 'Desconectar',
    dashboard: 'Panel Personal',
    vault: 'Mis Certificados Vault',
    settings: 'Ajustes de Cuenta',
    adminControl: 'Centro de Control Admin',
    crawlerEngine: 'Motor Crawler DKP',
    shopManagement: 'Gestión Tienda DKP',
    jobsManagement: 'Gestión Empleos'
  },
  FR: {
    news: 'nouvelles',
    tools: 'Outils DKP',
    submit: 'soumettre',
    blog: 'Blog',
    login: 'Connexion',
    logout: 'Déconnexion',
    dashboard: 'Tableau de Bord',
    vault: 'Mes Certificats Vault',
    settings: 'Paramètres del Compte',
    adminControl: 'Centre Admin',
    crawlerEngine: 'Moteur Crawler DKP',
    shopManagement: 'Gestion Boutique DKP',
    jobsManagement: 'Gestion Emplois'
  },
  DE: {
    news: 'News',
    tools: 'DKP Tools',
    submit: 'einreichen',
    blog: 'Blog',
    login: 'Anmelden',
    logout: 'Abmelden',
    dashboard: 'Persönliches Dashboard',
    vault: 'Meine Vault Zertifikate',
    settings: 'Konto-Einstellungen',
    adminControl: 'Admin-Kontrollzentrum',
    crawlerEngine: 'DKP Crawler-Engine',
    shopManagement: 'DKP Shop-Verwaltung',
    jobsManagement: 'Job-Hub Verwaltung'
  },
  JA: {
    news: 'ニュース',
    tools: 'DKP ツール',
    submit: '投稿する',
    blog: 'ブログ',
    login: 'ログイン',
    logout: 'ログアウト',
    dashboard: '個人ダッシュボード',
    vault: 'マイ Vault 証明書',
    settings: 'アカウント設定',
    adminControl: '管理者コントロール',
    crawlerEngine: 'DKP クローラーエンジン',
    shopManagement: 'DKP ショップ管理',
    jobsManagement: '求人ハブ管理'
  },
  ZH: {
    news: '新闻',
    tools: 'DKP 工具',
    submit: '提交',
    blog: '博客',
    login: '登录',
    logout: '退出登录',
    dashboard: '个人控制面板',
    vault: '我的 Vault 证书',
    settings: '账户设置',
    adminControl: '管理员控制中心',
    crawlerEngine: 'DKP 爬虫引擎',
    shopManagement: 'DKP 商店管理',
    jobsManagement: '招聘中心管理'
  },
  PT: {
    news: 'notícias',
    tools: 'Ferramentas DKP',
    submit: 'submeter',
    blog: 'Blog',
    login: 'Entrar',
    logout: 'Sair',
    dashboard: 'Painel Pessoal',
    vault: 'Meus Certificados Vault',
    settings: 'Configurações da Conta',
    adminControl: 'Painel de Controlo Admin',
    crawlerEngine: 'Motor Crawler DKP',
    shopManagement: 'Gestão Loja DKP',
    jobsManagement: 'Gestão de Empregos'
  },
  PL: {
    news: 'wiadomości',
    tools: 'Narzędzia DKP',
    submit: 'wyślij',
    blog: 'Blog',
    login: 'Zaloguj',
    logout: 'Wyloguj',
    dashboard: 'Osobisty Pulpit',
    vault: 'Moje Certyfikaty Vault',
    settings: 'Ustawienia Konta',
    adminControl: 'Centrum Admina',
    crawlerEngine: 'Silnik Crawler DKP',
    shopManagement: 'Zarządzanie Sklepem',
    jobsManagement: 'Zarządzanie Ofertami'
  }
}

export function useDkpTranslator() {
  const currentLang = useState<string>('dkp_active_lang', () => 'IT')

  const activeLanguageObj = computed(() => {
    return OFFICIAL_LANGUAGES.find(l => l.code === currentLang.value) || OFFICIAL_LANGUAGES[0]
  })

  function setLanguage(code: string) {
    const found = OFFICIAL_LANGUAGES.find(l => l.code === code)
    if (found) {
      currentLang.value = found.code
      if (import.meta.client) {
        localStorage.setItem('dkp_lang', found.code)
        document.cookie = `dkp_lang=${found.code}; path=/; max-age=31536000`
      }
    }
  }

  function initTranslator() {
    if (import.meta.client) {
      const saved = localStorage.getItem('dkp_lang')
      if (saved && OFFICIAL_LANGUAGES.some(l => l.code === saved)) {
        currentLang.value = saved
      }
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