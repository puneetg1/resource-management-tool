import './App.css'
import Layout from './components/Layout'
import { Link } from 'react-router-dom'

function App() {
  return (
    <Layout>
      <div style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Welcome</h1>
        <p>Choose a page:</p>
        <ul>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/records">Records (CRUD)</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
          
          
        </ul>
      </div>
    </Layout>
  )
}

export default App
