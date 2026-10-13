import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { getAdminToken, loginAdmin } from '../lib/auth'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (getAdminToken()) return <Navigate to="/admin" replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await loginAdmin(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[color:var(--el-bg)]">
      <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-8">
        <form onSubmit={onSubmit} className="w-full space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3 pb-2 border-b border-black/5">
            <img
              src="/assets/logo.png"
              alt="Euphoria Lashes"
              className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-rose-200/80"
            />
            <div>
              <h1 className="text-lg font-bold font-serif-luxury text-neutral-900">Acceso Administrador</h1>
              <p className="text-xs text-neutral-600">Euphoria Lashes · Gestión de Catálogo</p>
            </div>
          </div>

          <TextField
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="username"
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
          />

          {error ? <div className="text-sm text-[color:var(--el-alert)]">{error}</div> : null}

          <Button variant="primary" className="w-full" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </main>
    </div>
  )
}
