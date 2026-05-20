"use client"

import { Component, ReactNode } from "react"

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; errorKey: number }

/**
 * Catches React DOM reconciliation errors caused by browser translation
 * (Google/Chrome translate inserting <font> tags), and auto-remounts
 * the component tree with a fresh DOM to recover without full page reload.
 */
export default class AdminErrorBoundary extends Component<Props, State> {
  private recoverTimer: ReturnType<typeof setTimeout> | null = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorKey: 0 }
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error("[AdminErrorBoundary] Caught error, auto-recovering:", error.message)
    // Auto-recover after a brief delay
    this.recoverTimer = setTimeout(() => {
      this.setState(prev => ({
        hasError: false,
        errorKey: prev.errorKey + 1,
      }))
    }, 300)
  }

  componentWillUnmount() {
    if (this.recoverTimer) clearTimeout(this.recoverTimer)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Recovering...</p>
          </div>
        </div>
      )
    }
    return (
      <div key={this.state.errorKey} className="contents">
        {this.props.children}
      </div>
    )
  }
}
