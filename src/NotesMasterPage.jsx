import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import NotesMaster from './notes/NotesMaster'
import AuthPage from './AuthPage'
import { Container, CircularProgress, Box, Typography } from '@mui/material'

export default function NotesMasterPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const handleBack = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ color: '#64748b' }}>
            Loading NotesMaster...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (!user) {
    return <AuthPage onAuth={setUser} />
  }

  return <NotesMaster user={user} onBack={handleBack} />
} 