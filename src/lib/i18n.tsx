"use client"

import { createContext, useContext, ReactNode } from "react"

export type Lang = "en"

const translations: Record<string, string> = {
  "admin.title": "Admin",
  "nav.dashboard": "Dashboard",
  "nav.products": "Products",
  "nav.orders": "Orders",
  "nav.settings": "Settings",
  "nav.logout": "Logout",
}

interface I18nContextType {
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({ t: (key: string) => translations[key] || key })

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={{ t: (key: string) => translations[key] || key }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
