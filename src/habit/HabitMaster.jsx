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
  Snackbar,
  LinearProgress,
  Chip,
  Divider,
  Stack
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import InsightsIcon from '@mui/icons-material/Insights'
import SettingsIcon from '@mui/icons-material/Settings'

import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

import HabitCard from './components/HabitCard'
import HabitModal from './components/HabitModal'
import SettingsPage from './pages/SettingsPage'

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
  const [showSettings, setShowSettings] = useState(false)

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
    showSnackbar('Habit created successfully! 🎉')
  }

  const handleEditHabit = async (habitData) => {
    const newHabits = habits.map(h => h.id === habitData.id ? habitData : h)
    await saveHabits(newHabits)
    setEditingHabit(null)
    setHabitModalOpen(false)
    showSnackbar('Habit updated successfully! ✨')
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
    
    showSnackbar(isCompleted ? 'Completion removed' : 'Amazing! Keep the momentum going! 🚀✨')
  }

  const openCreateModal = () => {
    setEditingHabit(null)
    setHabitModalOpen(true)
  }

  const openEditModal = (habit) => {
    setEditingHabit(habit)
    setHabitModalOpen(true)
  }

  // Calculate enhanced analytics
  const totalHabits = habits.length
  const completedToday = habits.filter(isHabitCompletedToday).length
  const dueToday = habits.filter(isHabitDueToday).length
  const completionRate = dueToday > 0 ? (completedToday / dueToday) * 100 : 0
  
  // Calculate streaks
  const allStreaks = habits.map(habit => calculateStreak(habit))
  const maxStreak = allStreaks.length > 0 ? Math.max(...allStreaks) : 0
  const averageStreak = allStreaks.length > 0 ? Math.round(allStreaks.reduce((a, b) => a + b, 0) / allStreaks.length) : 0
  
  // Calculate weekly completion rate
  const thisWeek = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = formatTrackingDate(date)
    
    // Filter habits that were due on this specific date
    const dayHabits = habits.filter(habit => {
      const dayOfWeek = date.getDay()
      const dayOfMonth = date.getDate()
      
      switch (habit.frequency) {
        case 'daily':
          return true
        case 'weekly':
          return habit.weeklyDays && habit.weeklyDays.includes(dayOfWeek)
        case 'monthly':
          return habit.monthlyDays && habit.monthlyDays.includes(dayOfMonth)
        case 'custom':
          if (!habit.customInterval || !habit.createdAt) return false
          const createdDate = new Date(habit.createdAt)
          const daysDiff = Math.floor((date - createdDate) / (1000 * 60 * 60 * 24))
          return daysDiff % habit.customInterval === 0
        default:
          return true
      }
    })
    
    const dayCompleted = habits.filter(habit => {
      const completions = habit.completions || []
      return completions.some(c => c.date === dateStr) && dayHabits.some(h => h.id === habit.id)
    })
    
    thisWeek.push({
      date: dateStr,
      total: dayHabits.length,
      completed: dayCompleted.length,
      rate: dayHabits.length > 0 ? (dayCompleted.length / dayHabits.length) * 100 : 0
    })
  }

  const weeklyAverageRate = thisWeek.reduce((acc, day) => acc + day.rate, 0) / 7

  // Motivational messages based on performance
  const getMotivationalMessage = () => {
    if (totalHabits === 0) {
      return "🌟 Welcome to your habit journey! Every expert was once a beginner."
    }
    if (completionRate === 100 && dueToday > 0) {
      return "🏆 Perfect day! You're absolutely crushing it today!"
    }
    if (completionRate >= 80) {
      return "🚀 Fantastic progress! You're building unstoppable momentum!"
    }
    if (completionRate >= 50) {
      return "💪 Great work! Keep pushing forward, you've got this!"
    }
    if (completionRate > 0) {
      return "✨ Every step counts! Small progress is still progress."
    }
    return "🎯 Ready to start your day? Your future self will thank you!"
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#8b5cf6', width: 60, height: 60 }}>🎯</Avatar>
          <Typography variant="h6">Loading your habits...</Typography>
        </Box>
      </Container>
    )
  }

  if (showSettings) {
    return <SettingsPage 
      user={user} 
      onBack={() => setShowSettings(false)} 
      habits={habits}
      onHabitsUpdate={setHabits}
    />
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Enhanced Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#e2e8f0' }}
          >
            Back to Home
          </Button>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
            borderRadius: 3, 
            p: 1.5,
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
          }}>
            <Avatar sx={{ bgcolor: 'transparent', width: 48, height: 48, fontSize: '1.5rem' }}>
              🎯
            </Avatar>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #1e293b, #475569)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              HABITMASTER
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Build lasting habits, transform your life ✨
            </Typography>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setShowSettings(true)}
            sx={{ 
              borderRadius: 3, 
              fontWeight: 600,
              borderColor: '#8b5cf6',
              color: '#8b5cf6',
              '&:hover': { 
                borderColor: '#7c3aed',
                color: '#7c3aed',
                bgcolor: 'rgba(139, 92, 246, 0.05)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Settings
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateModal}
            sx={{ 
              borderRadius: 3, 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            New Habit
          </Button>
        </Stack>
      </Box>

      {/* Motivational Banner */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 4, 
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        border: '1px solid #bae6fd',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: '#0369a1',
            textAlign: 'center',
            fontSize: '1.1rem'
          }}>
            {getMotivationalMessage()}
          </Typography>
        </CardContent>
      </Card>

      {/* Enhanced Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Today's Progress */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <CalendarTodayIcon sx={{ color: '#8b5cf6', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {completedToday}/{dueToday}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Today's Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={completionRate} 
                sx={{ 
                  mt: 2, 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: 4
                  }
                }} 
              />
              <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                {Math.round(completionRate)}% Complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Habits */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <InsightsIcon sx={{ color: '#3b82f6', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {totalHabits}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Total Habits
              </Typography>
              <Chip 
                label="Active Tracking" 
                size="small" 
                sx={{ 
                  mt: 2, 
                  bgcolor: '#dbeafe', 
                  color: '#1e40af',
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Max Streak */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <LocalFireDepartmentIcon sx={{ color: '#f59e0b', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {maxStreak}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Longest Streak
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#92400e', 
                mt: 1, 
                display: 'block',
                fontWeight: 600
              }}>
                🔥 Keep it burning!
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Average */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: '#10b981', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {Math.round(weeklyAverageRate)}%
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Weekly Average
              </Typography>
              <Typography variant="caption" sx={{ 
                color: weeklyAverageRate >= 70 ? '#059669' : weeklyAverageRate >= 50 ? '#d97706' : '#dc2626', 
                mt: 1, 
                display: 'block',
                fontWeight: 600
              }}>
                {weeklyAverageRate >= 70 ? '📈 Excellent!' : weeklyAverageRate >= 50 ? '📊 Good Progress' : '💪 Keep Going!'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Weekly Progress Visualization */}
      {habits.length > 0 && (
        <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              📊 This Week's Journey
            </Typography>
            <Grid container spacing={1}>
              {thisWeek.map((day, index) => {
                const date = new Date(day.date)
                const dayName = date.toLocaleDateString('en', { weekday: 'short' })
                const isToday = day.date === formatTrackingDate(new Date())
                return (
                  <Grid item xs key={index} sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ 
                      color: isToday ? '#8b5cf6' : '#64748b',
                      fontWeight: isToday ? 600 : 400
                    }}>
                      {dayName}
                    </Typography>
                    <Box sx={{ 
                      width: '100%', 
                      height: 60,
                      bgcolor: day.rate === 0 ? '#f1f5f9' : 
                               day.rate < 50 ? '#fef3c7' :
                               day.rate < 80 ? '#dbeafe' : '#dcfce7',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 1,
                      border: isToday ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                      boxShadow: isToday ? '0 4px 12px rgba(139, 92, 246, 0.2)' : 'none'
                    }}>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 600,
                        color: day.rate === 0 ? '#64748b' : 
                               day.rate < 50 ? '#92400e' :
                               day.rate < 80 ? '#1e40af' : '#065f46'
                      }}>
                        {day.total > 0 ? `${day.completed}/${day.total}` : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {habits.length === 0 ? (
        <Paper sx={{ 
          p: 8, 
          textAlign: 'center', 
          borderRadius: 4, 
          mt: 4,
          background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
            borderRadius: '50%',
            width: 120,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)'
          }}>
            <Typography sx={{ fontSize: '3rem' }}>🎯</Typography>
          </Box>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
            Ready to build amazing habits?
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: 500, mx: 'auto' }}>
            Start your transformation journey today. Every small step leads to remarkable changes. 
            Create your first habit and watch yourself grow! 🚀
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={openCreateModal}
            sx={{ 
              borderRadius: 3, 
              fontWeight: 600,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Create Your First Habit
          </Button>
        </Paper>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              🎯 Your Habits
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={`${completedToday} completed today`} 
                size="small" 
                sx={{ bgcolor: '#dcfce7', color: '#065f46', fontWeight: 600 }} 
              />
              <Chip 
                label={`${dueToday - completedToday} remaining`} 
                size="small" 
                sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600 }} 
              />
            </Stack>
          </Box>
          
          <Grid container spacing={3}>
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
        </Box>
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
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
          '&:hover': { 
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            transform: 'scale(1.1)',
            boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)'
          },
          transition: 'all 0.3s ease',
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
          sx={{ borderRadius: 3, fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
} 