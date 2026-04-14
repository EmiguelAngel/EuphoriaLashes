import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { AdminPage } from './pages/AdminPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { clearAdminToken, verifyAdminSession } from './lib/auth'
import { useEffect, useState } from 'react'

function RequireAdmin({ children }: { children: React.ReactElement }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'no'>('checking')

  useEffect(() => {
    let mounted = true
    void verifyAdminSession().then((ok) => {
      if (!mounted) return
      if (!ok) clearAdminToken()
      setStatus(ok ? 'ok' : 'no')
    })
    return () => {
      mounted = false
    }
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-dvh bg-[color:var(--el-bg)]">
        <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-4 py-8 text-sm text-neutral-600">
          Verificando sesión...
        </main>
      </div>
    )
  }
  if (status === 'no') return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

