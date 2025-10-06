import { DUMMY_USERS } from '../config'
const AUTH_KEY = 'app_auth_user'

export const Auth = {
  login(username, password) {
    const user = DUMMY_USERS.find(u => u.username === username && u.password === password)
    if (user) {
      const { password: _pw, ...safe } = user
      localStorage.setItem(AUTH_KEY, JSON.stringify(safe))
      return true
    }
    return false
  },
  logout() {
    localStorage.removeItem(AUTH_KEY)
  },
  currentUser() {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  },
  isAuthenticated() {
    return !!this.currentUser()
  }
}


