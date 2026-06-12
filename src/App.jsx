import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Check,
  Copy,
  RotateCw,
  Building2,
  Users,
  Target,
  Briefcase,
  Sun,
  Moon,
  LogOut,
  Settings,
  Lock,
  User as UserIcon
} from 'lucide-react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

// Inline Instagram Icon to replace missing ESM exports in some bundlers
const Instagram = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className || "w-4 h-4"}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

function App() {
  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('scout_token') || '')
  const [user, setUser] = useState(null) // { username, role }
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // System states
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDark, setIsDark] = useState(localStorage.getItem('scout_theme') === 'dark')

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState('client') // 'client', 'supplier', 'settings'
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minScoring, setMinScoring] = useState(1)

  // Details Modal
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [leadDetail, setLeadDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState('analysis') // 'analysis', 'proposal', 'crm'

  // Admin config settings state
  const [settingsConfig, setSettingsConfig] = useState({
    min_scoring_threshold: 7,
    enabled_sources: ['Kaspi', '2GIS', 'Instagram'],
    default_search_region: 'Almaty'
  })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  // Scout Runner state
  const [scoutCategory, setScoutCategory] = useState('E-commerce')
  const [scoutRegion, setScoutRegion] = useState('Almaty')
  const [scoutJobID, setScoutJobID] = useState(null)
  const [isScouting, setIsScouting] = useState(false)

  // Proposal Draft
  const [proposalDraft, setProposalDraft] = useState('')
  const [proposalLoading, setProposalLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // New Communication log
  const [newCommType, setNewCommType] = useState('whatsapp')
  const [newCommContent, setNewCommContent] = useState('')

  // Configure light/dark theme class on startup and updates
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('scout_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('scout_theme', 'light')
    }
  }, [isDark])

  // Get current user profile (whoami)
  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!res.ok) {
        // Token expired or invalid
        handleLogout()
        return
      }
      const data = await res.json()
      setUser({ username: data.username, role: data.role })
    } catch (e) {
      console.error(e)
    }
  }

  // Load leads and settings config on login
  useEffect(() => {
    if (token) {
      fetchProfile(token)
      fetchLeads(token)
      fetchSettings(token)
    }
  }, [token])

  // Fetch leads from backend
  const fetchLeads = async (authToken = token, showSilently = false) => {
    if (!showSilently) setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      if (!res.ok) throw new Error('Api returned error status')
      const data = await res.json()
      setLeads(data || [])
      setError(null)
    } catch (err) {
      setError('Не удалось подключиться к API бэкенда. Убедитесь, что сервер Go запущен.')
      console.error(err)
    } finally {
      if (!showSilently) setLoading(false)
    }
  }

  // Fetch settings config
  const fetchSettings = async (authToken = token) => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSettingsConfig(data)
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      })

      if (res.status === 401) {
        throw new Error('Неверный логин или пароль')
      }
      if (!res.ok) throw new Error('Ошибка сервера авторизации')

      const data = await res.json()
      localStorage.setItem('scout_token', data.token)
      setToken(data.token)
      setUsernameInput('')
      setPasswordInput('')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // Logout session
  const handleLogout = () => {
    localStorage.removeItem('scout_token')
    setToken('')
    setUser(null)
    setLeads([])
  }

  // Poll leads when scouting is active
  useEffect(() => {
    let interval
    if (isScouting && token) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/leads`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            if (data && data.length > leads.length) {
              setLeads(data)
              setIsScouting(false)
              setScoutJobID(null)
            }
          }
        } catch (e) {
          console.error(e)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isScouting, leads.length, token])

  // Fetch company details
  const fetchLeadDetails = async (id) => {
    setDetailLoading(true)
    setProposalDraft('')
    try {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      if (!res.ok) throw new Error('Failed to load lead details')
      const data = await res.json()
      setLeadDetail(data)
      setSelectedLeadId(id)
    } catch (err) {
      alert('Ошибка при загрузке детальной информации о компании.')
    } finally {
      setDetailLoading(false)
    }
  }

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      if (!res.ok) throw new Error('Failed to update task')
      
      if (selectedLeadId) {
        await fetchLeadDetails(selectedLeadId)
      }
      await fetchLeads(token, true)
    } catch (err) {
      alert('Не удалось обновить статус задачи.')
    }
  }

  // Add custom manual communication note
  const handleAddCommunication = async (e) => {
    e.preventDefault()
    if (!newCommContent.trim()) return

    // Locally append to timeline for responsive visual display
    const newLog = {
      id: Math.random().toString(),
      type: newCommType,
      content: newCommContent,
      created_at: new Date().toISOString()
    }
    setLeadDetail(prev => ({
      ...prev,
      communications: [newLog, ...(prev.communications || [])]
    }))
    setNewCommContent('')
  }

  // Generate commercial offer pitch
  const handleGenerateProposal = async () => {
    if (!leadDetail) return
    setProposalLoading(true)
    setProposalDraft('')
    try {
      const res = await fetch(`${API_BASE}/companies/${leadDetail.id}/proposal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      if (!res.ok) throw new Error('Failed to generate offer')
      const data = await res.json()
      setProposalDraft(data.proposal)
    } catch (err) {
      alert('Ошибка генерации коммерческого предложения.')
    } finally {
      setProposalLoading(false)
    }
  }

  // Save Settings Config (Admin Only)
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSettingsLoading(true)
    setSettingsSuccess(false)
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsConfig)
      })
      if (res.status === 403) {
        alert('Доступ запрещен: Изменять системные настройки может только администратор.')
        return
      }
      if (!res.ok) throw new Error('Failed to save settings')
      
      const data = await res.json()
      setSettingsConfig(data)
      setSettingsSuccess(true)
      setTimeout(() => setSettingsSuccess(false), 3000)
    } catch (err) {
      alert('Не удалось сохранить настройки системы.')
    } finally {
      setSettingsLoading(false)
    }
  }

  // Toggle sources helper
  const handleToggleSource = (sourceName) => {
    const currentSources = [...settingsConfig.enabled_sources]
    let nextSources
    if (currentSources.includes(sourceName)) {
      nextSources = currentSources.filter(s => s !== sourceName)
    } else {
      nextSources = [...currentSources, sourceName]
    }
    setSettingsConfig({
      ...settingsConfig,
      enabled_sources: nextSources
    })
  }

  // Trigger Scout Job
  const handleTriggerScout = async (e) => {
    e.preventDefault()
    setIsScouting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/scout/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: scoutCategory, region: scoutRegion })
      })
      if (!res.ok) throw new Error('Failed to start scout job')
      const data = await res.json()
      setScoutJobID(data.job_id)
    } catch (err) {
      setIsScouting(false)
      alert('Не удалось запустить процесс сбора данных.')
    }
  }

  // Copy offer pitch
  const handleCopyProposal = () => {
    navigator.clipboard.writeText(proposalDraft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filter computations
  const filteredLeads = leads.filter(lead => {
    if (lead.type !== activeTab) return false

    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.region.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === '' || lead.category.toLowerCase() === categoryFilter.toLowerCase()
    
    const score = lead.analysis ? lead.analysis.scoring : 0
    const matchesScoring = score >= minScoring

    return matchesSearch && matchesCategory && matchesScoring
  })

  // Calculations for counters
  const totalClients = leads.filter(l => l.type === 'client').length
  const totalSuppliers = leads.filter(l => l.type === 'supplier').length
  const highPotential = leads.filter(l => l.analysis && l.analysis.scoring >= settingsConfig.min_scoring_threshold).length
  
  const activeTasks = leads.reduce((acc, lead) => {
    return acc + (lead.tasks ? lead.tasks.filter(t => t.status !== 'closed').length : 0)
  }, 0)

  const uniqueCategories = [...new Set(leads.map(l => l.category))]

  // LOGIN SCREEN RENDER
  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-250 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}>
        {/* Floating gradient orb */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className={`max-w-md w-full mx-4 p-8 rounded-2xl border shadow-xl backdrop-blur-md relative z-10 transition-colors ${
          isDark ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-slate-200'
        }`}>
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3 text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Вход в систему</h2>
            <p className={`text-xs mt-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Коммерческий разведчик • AI-разведка лидов
            </p>
          </div>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs px-3.5 py-2.5 rounded-xl mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Имя пользователя
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="admin или manager"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-200' : 'bg-slate-50 border-slate-250 text-slate-800'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Пароль
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-200' : 'bg-slate-50 border-slate-250 text-slate-800'
                  }`}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full font-bold text-sm text-white py-3 px-4 rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 transition flex items-center justify-center space-x-2"
            >
              {authLoading ? (
                <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>Войти</span>
              )}
            </button>
          </form>

          {/* Account credentials helper */}
          <div className={`mt-6 pt-4 border-t text-[11px] leading-relaxed space-y-1 ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <p className="font-semibold text-center mb-1">Демо-аккаунты для входа:</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-bold text-indigo-400">Администратор</span>
                <p>Логин: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">admin</code></p>
                <p>Пароль: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">adminpassword</code></p>
              </div>
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-bold text-indigo-400">Менеджер</span>
                <p>Логин: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">manager</code></p>
                <p>Пароль: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">managerpassword</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MAIN SYSTEM DASHBOARD RENDER
  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-40 transition-colors ${
        isDark ? 'border-slate-900 bg-slate-950/80 backdrop-blur-md' : 'border-slate-200 bg-white/80 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-base font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Коммерческий Разведчик
              </h1>
              <span className={`text-[10px] tracking-wider uppercase font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                AI Lead Qualification CRM
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Operator info details */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2 text-xs">
                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {user.username}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  user.role === 'admin'
                    ? 'text-teal-500 bg-teal-500/10 border border-teal-500/20'
                    : 'text-indigo-500 bg-indigo-500/10 border border-indigo-500/20'
                }`}>
                  {user.role === 'admin' ? 'Админ' : 'Менеджер'}
                </span>
              </div>
            )}

            {/* Light/Dark mode Switcher */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg border transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-white' : 'bg-slate-100 border-slate-250 text-slate-600 hover:text-slate-900'
              }`}
              title="Переключить тему оформления"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Force Reload data */}
            <button
              onClick={() => fetchLeads()}
              className={`p-2 rounded-lg border transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-250 text-slate-500 hover:text-slate-850'
              }`}
              title="Обновить списки"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-lg transition-colors"
              title="Выйти из сессии"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center space-x-3 text-rose-600 dark:text-rose-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Stats Summary widgets */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`border p-6 rounded-2xl shadow-sm flex items-center justify-between transition-colors ${
            isDark ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-200'
          }`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Покупатели (Лиды)
              </p>
              <h3 className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {loading ? '...' : totalClients}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Users className="w-6 h-6" />
            </div>
          </div>
          
          <div className={`border p-6 rounded-2xl shadow-sm flex items-center justify-between transition-colors ${
            isDark ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-200'
          }`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Поставщики (Заводы)
              </p>
              <h3 className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {loading ? '...' : totalSuppliers}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600'
            }`}>
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className={`border p-6 rounded-2xl shadow-sm flex items-center justify-between transition-colors ${
            isDark ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-200'
          }`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Высокий потенциал (≥{settingsConfig.min_scoring_threshold})
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {loading ? '...' : highPotential}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Target className="w-6 h-6" />
            </div>
          </div>

          <div className={`border p-6 rounded-2xl shadow-sm flex items-center justify-between transition-colors ${
            isDark ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-200'
          }`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Задачи в работе
              </p>
              <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {loading ? '...' : activeTasks}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
            }`}>
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Action controls grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Scout Trigger form */}
          <div className={`border p-6 rounded-2xl shadow-sm h-fit space-y-6 transition-colors ${
            isDark ? 'bg-slate-900/50 border-slate-850' : 'bg-white border-slate-200'
          }`}>
            <div>
              <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>Запуск сбора лидов</span>
              </h3>
              <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Инициирует сканирование открытых источников, 2GIS, Kaspi по заданным нишам.
              </p>
            </div>

            <form onSubmit={handleTriggerScout} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ниша или сегмент
                </label>
                <select
                  value={scoutCategory}
                  onChange={(e) => setScoutCategory(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="E-commerce">Интернет-магазины (Казахстан)</option>
                  <option value="Retail">Розничные точки (Казахстан)</option>
                  <option value="Instagram-shop">Instagram-продавцы (Казахстан)</option>
                  <option value="Suppliers (Global)">Глобальные производители (Китай, Корея)</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Регион сканирования
                </label>
                <input
                  type="text"
                  value={scoutRegion}
                  onChange={(e) => setScoutRegion(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isScouting}
                className="w-full font-bold text-sm text-white py-2.5 px-4 rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isScouting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                    <span>Сканирование...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Начать сбор и скоринг</span>
                  </>
                )}
              </button>
            </form>

            {isScouting && (
              <div className={`border rounded-xl p-3 text-xs leading-relaxed space-y-1.5 ${
                isDark ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>Статус процесса:</span>
                  <span className="animate-pulse text-indigo-600 dark:text-teal-400">Активный поиск</span>
                </div>
                <p>Запущен краулер по источникам: {settingsConfig.enabled_sources.join(', ')}.</p>
                {scoutJobID && <p className="text-[10px] opacity-60">ID задачи: {scoutJobID}</p>}
              </div>
            )}
          </div>

          {/* Main workspace navigation panel */}
          <div className={`lg:col-span-2 border p-6 rounded-2xl shadow-sm space-y-6 transition-colors ${
            isDark ? 'bg-slate-900/30 border-slate-850' : 'bg-white border-slate-200'
          }`}>
            
            {/* Navigation tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-850">
              <div className={`flex p-1 rounded-xl border w-fit ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  onClick={() => {
                    setActiveTab('client')
                    setCategoryFilter('')
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'client'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : `${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`
                  }`}
                >
                  Клиенты
                </button>
                <button
                  onClick={() => {
                    setActiveTab('supplier')
                    setCategoryFilter('')
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'supplier'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : `${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`
                  }`}
                >
                  Поставщики
                </button>
                {/* Admin-only settings navigation tab */}
                {user && user.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      activeTab === 'settings'
                        ? 'bg-teal-600 text-white shadow-md'
                        : `${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Настройки системы</span>
                  </button>
                )}
              </div>

              {activeTab !== 'settings' && (
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Быстрый поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-850 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* TAB: Settings panel */}
            {activeTab === 'settings' && user && user.role === 'admin' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 text-sm">
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Настройки AI-Анализатора и Лимитов</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Управляйте параметрами квалификации и источниками парсинга в реальном времени.
                  </p>
                </div>

                {settingsSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Настройки системы успешно сохранены и применены!</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Источники поиска
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Kaspi', '2GIS', 'Instagram', 'Satu', 'Wildberries', 'Ozon'].map((source) => {
                        const isChecked = settingsConfig.enabled_sources.includes(source)
                        return (
                          <button
                            key={source}
                            type="button"
                            onClick={() => handleToggleSource(source)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors ${
                              isChecked
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : `${isDark ? 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'}`
                            }`}
                          >
                            <span>{source}</span>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-400'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Порог скоринга (High Potential)
                        </label>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                          {settingsConfig.min_scoring_threshold} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settingsConfig.min_scoring_threshold}
                        onChange={(e) => setSettingsConfig({
                          ...settingsConfig,
                          min_scoring_threshold: parseInt(e.target.value)
                        })}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="text-[10px] text-slate-400">
                        Определяет минимальный рейтинг лида, при котором он квалифицируется как высокопотенциальный.
                      </span>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Регион по умолчанию
                      </label>
                      <input
                        type="text"
                        value={settingsConfig.default_search_region}
                        onChange={(e) => setSettingsConfig({
                          ...settingsConfig,
                          default_search_region: e.target.value
                        })}
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDark ? 'bg-slate-950 border-slate-850 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-slate-850">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/20 transition flex items-center space-x-2"
                  >
                    {settingsLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Сохранить настройки</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: Lead / Supplier Listing Table */}
            {activeTab !== 'settings' && (
              <div className="space-y-4">
                {/* Advanced Table filters */}
                <div className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-4 ${
                  isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-250'
                }`}>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Категория ({categoryFilter || 'Все'})
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className={`w-full border rounded-lg px-2 py-1 text-xs focus:outline-none ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="">Все категории</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Минимальный скоринг
                      </label>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{minScoring} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={minScoring}
                      onChange={(e) => setMinScoring(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className={`overflow-x-auto border rounded-xl shadow-sm ${
                  isDark ? 'border-slate-850' : 'border-slate-200'
                }`}>
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-850 text-left text-xs">
                    <thead className={`text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <tr>
                        <th className="px-4 py-3">Компания</th>
                        <th className="px-4 py-3">Категория</th>
                        <th className="px-4 py-3">Регион</th>
                        <th className="px-4 py-3">Оценка</th>
                        <th className="px-4 py-3 text-right">Операции</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      isDark ? 'divide-slate-850 bg-slate-900/10' : 'divide-slate-200 bg-white'
                    }`}>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                            <span className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></span>
                            Загрузка данных...
                          </td>
                        </tr>
                      ) : filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                            Компаний по заданным критериям не найдено.
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead) => {
                          const score = lead.analysis ? lead.analysis.scoring : 0
                          let badgeColor = 'text-rose-600 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-500/20'
                          if (score >= settingsConfig.min_scoring_threshold) {
                            badgeColor = 'text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-500/20'
                          } else if (score >= 5) {
                            badgeColor = 'text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-500/20'
                          }

                          return (
                            <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                              <td className="px-4 py-3 font-semibold">
                                <div className="flex flex-col">
                                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{lead.name}</span>
                                  {lead.website && (
                                    <a
                                      href={lead.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-indigo-650 dark:text-indigo-400 hover:underline inline-flex items-center space-x-1 mt-0.5 w-fit"
                                    >
                                      <Globe className="w-2.5 h-2.5" />
                                      <span>{lead.website.replace('https://', '').replace('http://', '')}</span>
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>{lead.category}</td>
                              <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lead.region}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                                  {score > 0 ? `${score} / 10` : 'Нет оценки'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => fetchLeadDetails(lead.id)}
                                  className={`px-3 py-1 border text-[11px] rounded-lg font-bold transition-all ${
                                    isDark 
                                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white' 
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
                                  }`}
                                >
                                  Смотреть
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </section>
      </main>

      {/* Slide-out details Drawer */}
      {selectedLeadId && leadDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className={`w-full max-w-2xl border-l h-full flex flex-col shadow-2xl relative ${
            isDark ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          }`}>
            
            {/* Drawer Header */}
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-850' : 'border-slate-200'}`}>
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  leadDetail.type === 'client'
                    ? 'text-indigo-600 bg-indigo-50 border border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/50 dark:border-indigo-500/20'
                    : 'text-teal-600 bg-teal-50 border border-teal-200 dark:text-teal-400 dark:bg-teal-950/50 dark:border-teal-500/20'
                }`}>
                  {leadDetail.type === 'client' ? 'Клиент' : 'Поставщик'}
                </span>
                <h2 className={`text-xl font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{leadDetail.name}</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{leadDetail.category} • {leadDetail.region}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedLeadId(null)
                  setLeadDetail(null)
                }}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Contacts box */}
              <div className={`border rounded-2xl p-4 space-y-3 ${
                isDark ? 'bg-slate-950/50 border-slate-850' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  Контактная информация
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {leadDetail.contacts.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{leadDetail.contacts.email}</span>
                    </div>
                  )}
                  {leadDetail.contacts.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{leadDetail.contacts.phone}</span>
                    </div>
                  )}
                  {leadDetail.contacts.whatsapp && (
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <a
                        href={`https://wa.me/${leadDetail.contacts.whatsapp.replace(/\+/g, '').replace(/\s/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        WhatsApp ({leadDetail.contacts.whatsapp})
                      </a>
                    </div>
                  )}
                  {leadDetail.contacts.instagram && (
                    <div className="flex items-center space-x-2">
                      <Instagram className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <a
                        href={`https://instagram.com/${leadDetail.contacts.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                      >
                        Instagram ({leadDetail.contacts.instagram})
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Tabs selection */}
              <div className="flex border-b dark:border-slate-850">
                <button
                  onClick={() => setDetailTab('analysis')}
                  className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
                    detailTab === 'analysis'
                      ? 'border-indigo-650 text-indigo-600 dark:border-indigo-500 dark:text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Анализ пробелов
                </button>
                <button
                  onClick={() => setDetailTab('proposal')}
                  className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
                    detailTab === 'proposal'
                      ? 'border-indigo-650 text-indigo-600 dark:border-indigo-500 dark:text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Предложение (КП)
                </button>
                <button
                  onClick={() => setDetailTab('crm')}
                  className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
                    detailTab === 'crm'
                      ? 'border-indigo-650 text-indigo-600 dark:border-indigo-500 dark:text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  CRM Задачи & Логи
                </button>
              </div>

              {/* DETAIL TAB: Analysis & Gaps */}
              {detailTab === 'analysis' && (
                <div className="space-y-6">
                  {leadDetail.analysis ? (
                    <>
                      {/* Score card */}
                      <div className={`border rounded-2xl p-5 flex items-center space-x-4 ${
                        isDark ? 'bg-slate-950/20 border-slate-850' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center ${
                          isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
                        }`}>
                          <span className={`text-2xl font-extrabold leading-none ${isDark ? 'text-white' : 'text-indigo-600'}`}>
                            {leadDetail.analysis.scoring}
                          </span>
                          <span className="text-[9px] font-bold uppercase mt-1 text-slate-400">Оценка</span>
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Скоринг квалификации: {leadDetail.analysis.scoring}/10
                          </h4>
                          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            На основе представленности, доступности сайта, скорости работы и пробелов на рынке.
                          </p>
                        </div>
                      </div>

                      {/* Gaps */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Дефициты ассортимента</span>
                        </h4>
                        <div className="space-y-2">
                          {leadDetail.analysis.gaps && leadDetail.analysis.gaps.map((gap, i) => (
                            <div key={i} className={`flex items-start space-x-2.5 border p-3 rounded-xl text-xs ${
                              isDark ? 'bg-slate-950/40 border-slate-850 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                              <span>{gap}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className={`border rounded-2xl p-5 space-y-2.5 ${
                        isDark ? 'bg-indigo-950/15 border-indigo-900/30' : 'bg-indigo-50 border-indigo-100'
                      }`}>
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                          <Sparkles className="w-4 h-4" />
                          <span>AI-Рекомендация по продаже</span>
                        </h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {leadDetail.analysis.recommendations}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      Отсутствует аналитический скоринг для этой компании.
                    </div>
                  )}
                </div>
              )}

              {/* DETAIL TAB: Commercial proposal */}
              {detailTab === 'proposal' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Автоматическая генерация КП
                    </h4>
                    <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Текст предложения формируется под обнаруженные пробелы и адаптируется под специфику работы компании.
                    </p>
                    <button
                      onClick={handleGenerateProposal}
                      disabled={proposalLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/10"
                    >
                      {proposalLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                          <span>Генерация КП...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Сформировать предложение</span>
                        </>
                      )}
                    </button>
                  </div>

                  {proposalDraft && (
                    <div className={`border rounded-2xl p-5 relative space-y-4 ${
                      isDark ? 'border-slate-850 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <div className="flex justify-between items-center pb-2 border-b dark:border-slate-900 border-slate-200">
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-wider font-bold flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Проект КП (Менеджер может изменить)</span>
                        </span>
                        <button
                          onClick={handleCopyProposal}
                          className={`px-2.5 py-1 border text-[11px] rounded-lg font-bold flex items-center space-x-1 transition ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Скопировано</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Копировать</span>
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={proposalDraft}
                        onChange={(e) => setProposalDraft(e.target.value)}
                        rows="12"
                        className={`w-full bg-transparent border-0 p-0 text-xs focus:outline-none focus:ring-0 leading-relaxed font-mono ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* DETAIL TAB: Tasks and Timeline */}
              {detailTab === 'crm' && (
                <div className="space-y-6">
                  
                  {/* Tasks List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>Активные задачи</span>
                    </h4>
                    
                    <div className="space-y-2">
                      {leadDetail.tasks && leadDetail.tasks.length > 0 ? (
                        leadDetail.tasks.map((task) => (
                          <div key={task.id} className={`border p-4 rounded-xl space-y-3 ${
                            isDark ? 'bg-slate-950/30 border-slate-850' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</h5>
                                <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                task.status === 'closed'
                                  ? 'text-emerald-600 bg-emerald-50 border border-emerald-250 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-500/20'
                                  : task.status === 'in_progress'
                                  ? 'text-amber-600 bg-amber-50 border border-amber-250 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-500/20'
                                  : 'text-indigo-600 bg-indigo-50 border border-indigo-250 dark:text-indigo-400 dark:bg-indigo-950/50 dark:border-indigo-500/20'
                              }`}>
                                {task.status === 'closed' ? 'Закрыта' : task.status === 'in_progress' ? 'В работе' : 'Новая'}
                              </span>
                            </div>

                            <div className="flex space-x-2 pt-2 border-t dark:border-slate-900 border-slate-200 text-[10px] font-bold">
                              {task.status !== 'in_progress' && task.status !== 'closed' && (
                                <button
                                  onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                  className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg transition-colors"
                                >
                                  Взять в работу
                                </button>
                              )}
                              {task.status !== 'closed' && (
                                <button
                                  onClick={() => handleUpdateTaskStatus(task.id, 'closed')}
                                  className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                                >
                                  Выполнить задачу
                                </button>
                              )}
                              {task.status === 'closed' && (
                                <button
                                  onClick={() => handleUpdateTaskStatus(task.id, 'new')}
                                  className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                                >
                                  Переоткрыть задачу
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">Задач по квалификации не назначено.</p>
                      )}
                    </div>
                  </div>

                  {/* Add Log */}
                  <form onSubmit={handleAddCommunication} className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Зарегистрировать звонок/письмо</h4>
                    <div className="flex gap-2">
                      <select
                        value={newCommType}
                        onChange={(e) => setNewCommType(e.target.value)}
                        className={`border rounded-lg text-xs px-2.5 py-1.5 focus:outline-none ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="phone">Звонок</option>
                        <option value="instagram">Instagram</option>
                      </select>
                      <input
                        type="text"
                        value={newCommContent}
                        onChange={(e) => setNewCommContent(e.target.value)}
                        placeholder="Например: Отправили КП, ждут согласования..."
                        className={`flex-1 border rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:border-indigo-500 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                        required
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить</span>
                      </button>
                    </div>
                  </form>

                  {/* Timeline logs list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>История событий (Таймлайн)</span>
                    </h4>

                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-250 dark:before:bg-slate-800">
                      {leadDetail.communications && leadDetail.communications.length > 0 ? (
                        leadDetail.communications.map((comm) => {
                          let icon = <Clock className="w-3.5 h-3.5" />
                          let iconBg = 'bg-slate-100 border border-slate-200 text-slate-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'

                          if (comm.type === 'system') {
                            icon = <Sparkles className="w-3.5 h-3.5" />
                            iconBg = 'bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-500/20 dark:text-indigo-400'
                          } else if (comm.type === 'manager') {
                            icon = <Briefcase className="w-3.5 h-3.5" />
                            iconBg = 'bg-teal-50 border border-teal-200 text-teal-600 dark:bg-teal-950 dark:border-teal-500/20 dark:text-teal-400'
                          } else if (comm.type === 'whatsapp') {
                            icon = <MessageSquare className="w-3.5 h-3.5" />
                            iconBg = 'bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-500/20 dark:text-emerald-400'
                          } else if (comm.type === 'instagram') {
                            icon = <Instagram className="w-3.5 h-3.5" />
                            iconBg = 'bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-950 dark:border-rose-500/20 dark:text-rose-400'
                          } else if (comm.type === 'email') {
                            icon = <Mail className="w-3.5 h-3.5" />
                            iconBg = 'bg-sky-50 border border-sky-200 text-sky-650 dark:bg-sky-950 dark:border-sky-500/20 dark:text-sky-400'
                          } else if (comm.type === 'phone') {
                            icon = <Phone className="w-3.5 h-3.5" />
                            iconBg = 'bg-purple-50 border border-purple-200 text-purple-650 dark:bg-purple-950 dark:border-purple-500/20 dark:text-purple-400'
                          }

                          return (
                            <div key={comm.id} className="flex space-x-3 text-xs pl-6 relative">
                              <div className={`w-5 h-5 rounded-full absolute left-0 flex items-center justify-center z-10 ${iconBg}`}>
                                {icon}
                              </div>
                              <div className={`border p-3 rounded-xl flex-1 ${
                                isDark ? 'bg-slate-950/20 border-slate-850' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                                  <span className="font-bold capitalize">{comm.type}</span>
                                  <span>{new Date(comm.created_at).toLocaleString('ru-RU', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{comm.content}</p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-slate-400 pl-6 font-semibold">История контактов с лидом пуста.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
