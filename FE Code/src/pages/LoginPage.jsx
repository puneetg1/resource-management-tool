import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Auth } from '../utils/auth'
import Layout from '../components/Layout'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    const ok = Auth.login(username, password)
    if (ok) {
      navigate('/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <Layout>
      <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <h2 className="login-title">Login</h2>
        <form onSubmit={onSubmit} className="login-form">
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="login-input" />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input" />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn">Login</button>
        </form>
        <small style={{ color: 'var(--muted)' }}>Try: admin/admin123 or user/user123</small>
      </div>
    </Layout>
  )
}



