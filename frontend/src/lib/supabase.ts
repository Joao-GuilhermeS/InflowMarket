import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis do Supabase não configuradas.')
}

const sessionPreferenceKey = 'inflowmarket-keep-connected'
let keepSession = sessionStorage.getItem(sessionPreferenceKey) !== 'false'

const authStorage = {
  getItem(key: string) {
    const selectedStorage = keepSession ? localStorage : sessionStorage
    const fallbackStorage = keepSession ? sessionStorage : localStorage

    return selectedStorage.getItem(key) ?? fallbackStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    const selectedStorage = keepSession ? localStorage : sessionStorage
    const fallbackStorage = keepSession ? sessionStorage : localStorage

    selectedStorage.setItem(key, value)
    fallbackStorage.removeItem(key)
  },
  removeItem(key: string) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export function setAuthSessionPersistence(keepConnected: boolean) {
  keepSession = keepConnected

  if (keepConnected) {
    sessionStorage.removeItem(sessionPreferenceKey)
  } else {
    sessionStorage.setItem(sessionPreferenceKey, 'false')
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
  },
})