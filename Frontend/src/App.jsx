import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [projectInfo, setProjectInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/info`)
        setProjectInfo(res.data)
      } catch (err) {
        setError('Unable to connect to the server. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    fetchInfo()
  }, [])

  return (
    <div className="app-wrapper">
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <main className="hero-card">
        {/* Logo / Icon */}
        <div className="logo-ring">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
            <circle cx="24" cy="24" r="22" stroke="url(#g)" strokeWidth="3" />
            <path d="M14 32 L22 20 L28 26 L36 16" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="36" cy="16" r="3" fill="url(#g)" />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6C63FF" />
                <stop offset="1" stopColor="#00D2FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Content */}
        {loading && (
          <div className="status-block loading">
            <div className="spinner" />
            <p>Connecting to backend…</p>
          </div>
        )}

        {error && !loading && (
          <div className="status-block error">
            <span className="status-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {projectInfo && !loading && (
          <>
            <div className="badge">v{projectInfo.version}</div>
            <h1 className="project-title">{projectInfo.name}</h1>
            <p className="project-desc">{projectInfo.description}</p>

            <div className="pill-row">
              <span className="pill">React + Vite</span>
              <span className="pill">Express</span>
              <span className="pill">Node.js</span>
              <span className="pill">MongoDB</span>
            </div>

            <div className="server-status">
              <span className="dot" />
              Backend connected
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>FinSight AI &copy; {new Date().getFullYear()} &mdash; Built with ❤️</p>
      </footer>
    </div>
  )
}

export default App
