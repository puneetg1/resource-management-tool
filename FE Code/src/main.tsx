import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RecordsPage from './pages/RecordsPage'
import EditRecordPage from './pages/EditRecordPage'
import HeadcountDashboardPage from './pages/HeadcountDashboardPage' // 1. Import the new page

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/headcount', element: <HeadcountDashboardPage /> }, // 2. Add the new route
  { path: '/records', element: <RecordsPage /> },
  { path: '/records/:id', element: <EditRecordPage /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)