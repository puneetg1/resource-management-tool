import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../config';
import { Auth } from '../utils/auth';
import './Layout.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = Auth.currentUser();

  const isLogin = location.pathname === '/login';

  if (isLogin) {
    return (
      <div className="login-shell">
        <div className="login-card">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="layout-root">
      <header className="layout-header">
        <div className="layout-title">{APP_NAME}</div>
        <nav className="layout-nav">
          <Link to="/dashboard" className={location.pathname.startsWith('/dashboard') ? 'active' : ''}>Dashboard</Link>
          <Link to="/records" className={location.pathname.startsWith('/records') ? 'active' : ''}>Records</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <span style={{ color: '#6b7280' }}>{user.username} ({user.role})</span>
              <button onClick={() => { Auth.logout(); navigate('/login') }} className="btn">Logout</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="btn">Login</button>
          )}
        </div>
      </header>
      <main className="layout-main container">{children}</main>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        theme="colored"
      />
    </div>
  );
}