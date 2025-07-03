import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import App from './App.jsx'
import SharedCalendar from './SharedCalendar.jsx'
import InvitationHandler from './InvitationHandler.jsx'
import TaskMasterPage from './TaskMasterPage.jsx'
import HabitMasterPage from './HabitMasterPage.jsx'
import FocusMasterPage from './FocusMasterPage.jsx'
import MetricsMasterPage from './MetricsMasterPage.jsx'
import NotesMasterPage from './NotesMasterPage.jsx'
import AuthPage from './AuthPage.jsx'

export default function AppRouter() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const handleLoginRequired = () => {
    // This will be called from InvitationHandler when login is required
    // The App component will handle the auth flow
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#64748b'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/share/:userId" element={<SharedCalendar />} />
      <Route path="/taskmaster" element={<TaskMasterPage />} />
      <Route path="/habitmaster" element={<HabitMasterPage />} />
      <Route path="/focusmaster" element={<FocusMasterPage />} />
      <Route path="/metricsmaster" element={<MetricsMasterPage />} />
      <Route path="/notesmaster" element={<NotesMasterPage />} />
      <Route 
        path="/invite/:projectId/:invitationId" 
        element={
          <InvitationHandler 
            user={user} 
            onLoginRequired={handleLoginRequired}
          />
        } 
      />
    </Routes>
  )
} 