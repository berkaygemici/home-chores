import React, { useState, useEffect } from 'react'
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Fab,
  Alert,
  Snackbar
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

import HabitCard from './components/HabitCard'
import HabitModal from './components/HabitModal'
import EmailSettings from './components/EmailSettings'

import { 
  isHabitDueToday, 
  isHabitCompletedToday,
  calculateStreak
} from './utils/habitUtils'
import { formatTrackingDate } from './utils/dateUtils'

export default function HabitMaster({ user, onBack }) {
  const [habits, setHabits] = useState([])
  const [habitModalOpen, setHabitModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [loading, setLoading] = useState(true)

  // Load habits from Firebase
  useEffect(() => {
    if (!user) {
      setHabits([])
      setLoading(false)
      return
    }

    const loadHabits = async () => {
      try {
        const habitDoc = await getDoc(doc(db, 'habitmaster_habits', user.uid))
        if (habitDoc.exists()) {
          setHabits(habitDoc.data().habits || [])
        }
      } catch (error) {
        console.error('Failed to load habits:', error)
        showSnackbar('Failed to load habits', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadHabits()
  }, [user])

  // Save habits to Firebase
  const saveHabits = async (newHabits) => {
    if (!user) return
    
    try {
      await setDoc(doc(db, 'habitmaster_habits', user.uid), { habits: newHabits }, { merge: true })
      setHabits(newHabits)
    } catch (error) {
      console.error('Failed to save habits:', error)
      showSnackbar('Failed to save habits', 'error')
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreateHabit = async (habitData) => {
    const newHabits = [...habits, habitData]
    await saveHabits(newHabits)
    setHabitModalOpen(false)
    showSnackbar('Habit created successfully!')
  }

  const handleEditHabit = async (habitData) => {
    const newHabits = habits.map(h => h.id === habitData.id ? habitData : h)
    await saveHabits(newHabits)
    setEditingHabit(null)
    setHabitModalOpen(false)
    showSnackbar('Habit updated successfully!')
  }

  const handleDeleteHabit = async (habitId) => {
    const newHabits = habits.filter(h => h.id !== habitId)
    await saveHabits(newHabits)
    showSnackbar('Habit deleted successfully!')
  }

  const handleToggleCompletion = async (habitId) => {
    const today = formatTrackingDate(new Date())
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const completions = habit.completions || []
    const isCompleted = completions.some(c => c.date === today)

    let newCompletions
    if (isCompleted) {
      // Remove completion
      newCompletions = completions.filter(c => c.date !== today)
    } else {
      // Add completion
      newCompletions = [...completions, {
        date: today,
        timestamp: new Date().toISOString(),
        value: habit.target || 1
      }]
    }

    const updatedHabit = { ...habit, completions: newCompletions }
    const newHabits = habits.map(h => h.id === habitId ? updatedHabit : h)
    await saveHabits(newHabits)
    
    showSnackbar(isCompleted ? 'Completion removed' : 'Great job! Keep it up! 🎉')
  }

  const openCreateModal = () => {
    setEditingHabit(null)
    setHabitModalOpen(true)
  }

  const openEditModal = (habit) => {
    setEditingHabit(habit)
    setHabitModalOpen(true)
  }

  // Calculate basic analytics
  const totalHabits = habits.length
  const completedToday = habits.filter(isHabitCompletedToday).length
  const dueToday = habits.filter(isHabitDueToday).length

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">Loading habits...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Back to Home
          </Button>
          <Avatar sx={{ bgcolor: '#8b5cf6', width: 48, height: 48 }}>
            🎯
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              HABITMASTER
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Build lasting habits, track your progress
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateModal}
          sx={{ 
            borderRadius: 2, 
            fontWeight: 600,
            bgcolor: '#8b5cf6',
            '&:hover': { bgcolor: '#7c3aed' }
          }}
        >
          New Habit
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {totalHabits}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Total Habits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {completedToday}/{dueToday}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Today's Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {Math.round(dueToday > 0 ? (completedToday / dueToday) * 100 : 0)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Email Settings */}
      <EmailSettings user={user} habits={habits} />

      {/* Main Content */}
      {habits.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, mt: 4 }}>
          <Avatar sx={{ bgcolor: '#e0e7ff', mx: 'auto', mb: 3, width: 80, height: 80 }}>
            🎯
          </Avatar>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            No habits yet
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
            Start building better habits. Create your first habit to begin your journey.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={openCreateModal}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' }
            }}
          >
            Create Your First Habit
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {habits.map((habit) => (
            <Grid item xs={12} sm={6} md={4} key={habit.id}>
              <HabitCard
                habit={habit}
                onToggleCompletion={handleToggleCompletion}
                onEdit={openEditModal}
                onDelete={handleDeleteHabit}
                onClick={() => openEditModal(habit)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add habit"
        onClick={openCreateModal}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#8b5cf6',
          '&:hover': { bgcolor: '#7c3aed' },
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Modals */}
      <HabitModal
        open={habitModalOpen}
        onClose={() => {
          setHabitModalOpen(false)
          setEditingHabit(null)
        }}
        onSave={editingHabit ? handleEditHabit : handleCreateHabit}
        habit={editingHabit}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
} 