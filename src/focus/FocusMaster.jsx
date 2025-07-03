import React, { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  Stack,
  Avatar,
  Chip,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SettingsIcon from '@mui/icons-material/Settings'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import InsightsIcon from '@mui/icons-material/Insights'
import HistoryIcon from '@mui/icons-material/History'
import TimerIcon from '@mui/icons-material/Timer'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

import FocusTimer from './components/FocusTimer'
import TaskPicker from './components/TaskPicker'
import DistractionLogger from './components/DistractionLogger'
import AdvancedAnalytics from './components/AdvancedAnalytics'
import FocusMode from './components/FocusMode'
import SettingsPage from './pages/SettingsPage'

import { DEFAULT_SETTINGS, MOTIVATIONAL_QUOTES } from './constants/focusConstants'
import { 
  getAllTaskMasterTasks, 
  createFocusTask, 
  createTaskInTaskMaster,
  getFocusTasks,
  saveFocusTasks,
  completeTaskPomodoro,
  getTaskMasterData
} from './utils/taskUtils'
import { 
  calculateStreak,
  getSessionsForDate,
  calculateTotalFocusTime,
  getWeeklySessionData,
  formatDuration,
  sendNotification,
  requestNotificationPermission
} from './utils/timerUtils'

export default function FocusMaster({ user, onBack }) {
  // Core state
  const [currentTab, setCurrentTab] = useState(0) // 0: Timer, 1: History, 2: Analytics
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [currentTask, setCurrentTask] = useState(null)
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [sessions, setSessions] = useState([])
  const [distractions, setDistractions] = useState([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [distractionLoggerOpen, setDistractionLoggerOpen] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [currentSession, setCurrentSession] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [focusModeActive, setFocusModeActive] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadUserData()
  }, [user])

  // Request notification permission on mount
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestNotificationPermission()
    }
  }, [settings.notificationsEnabled])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Load settings
      const settingsDoc = await getDoc(doc(db, 'focusmaster_settings', user.uid))
      if (settingsDoc.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...settingsDoc.data().settings })
      }

      // Load sessions
      const sessionsDoc = await getDoc(doc(db, 'focusmaster_sessions', user.uid))
      if (sessionsDoc.exists()) {
        setSessions(sessionsDoc.data().sessions || [])
      }

      // Load focus tasks
      const focusTasks = await getFocusTasks(user.uid)
      
      // Load TaskMaster tasks
      const taskMasterTasks = await getAllTaskMasterTasks(user.uid)
      
      // Load projects for task creation
      const projectsData = await getTaskMasterData(user.uid)
      setProjects(projectsData)
      
      // Combine all tasks
      setTasks([...focusTasks, ...taskMasterTasks])

    } catch (error) {
      console.error('Failed to load user data:', error)
      showSnackbar('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      await setDoc(doc(db, 'focusmaster_settings', user.uid), { settings: newSettings }, { merge: true })
      setSettings(newSettings)
    } catch (error) {
      console.error('Failed to save settings:', error)
      showSnackbar('Failed to save settings', 'error')
    }
  }

  const saveSessions = async (newSessions) => {
    try {
      await setDoc(doc(db, 'focusmaster_sessions', user.uid), { sessions: newSessions }, { merge: true })
      setSessions(newSessions)
    } catch (error) {
      console.error('Failed to save sessions:', error)
      showSnackbar('Failed to save sessions', 'error')
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSessionComplete = async (sessionData) => {
    const newSessions = [...sessions, sessionData]
    await saveSessions(newSessions)
    
    if (sessionData.type === 'focus') {
      showSnackbar('🎉 Focus session completed! Great work!', 'success')
      
      // Update task if one was selected
      if (currentTask) {
        handleTaskComplete(currentTask)
      }
    } else {
      showSnackbar('Break time over! Ready to focus?', 'info')
    }
  }

  const handleTaskSelect = (task) => {
    setCurrentTask(task)
    if (task) {
      showSnackbar(`Starting focus session for: ${task.title}`, 'info')
    }
  }

  const handleTaskCreate = async (taskData) => {
    try {
      let newTask
      
      if (taskData.addToTaskMaster && taskData.projectId) {
        // Create in TaskMaster
        const currentUser = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          avatar: user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
        }
        
        newTask = await createTaskInTaskMaster(user.uid, taskData.projectId, taskData, currentUser)
      } else {
        // Create focus-only task
        newTask = createFocusTask(taskData)
        const focusTasks = await getFocusTasks(user.uid)
        await saveFocusTasks(user.uid, [...focusTasks, newTask])
      }
      
      setTasks(prev => [...prev, newTask])
      showSnackbar('Task created successfully! 🎉', 'success')
      
    } catch (error) {
      console.error('Failed to create task:', error)
      showSnackbar('Failed to create task', 'error')
    }
  }

  const handleTaskComplete = async (task) => {
    try {
      if (task.source === 'focusmaster') {
        // Update focus task
        const updatedTask = completeTaskPomodoro(task)
        const focusTasks = await getFocusTasks(user.uid)
        const updatedFocusTasks = focusTasks.map(t => t.id === task.id ? updatedTask : t)
        await saveFocusTasks(user.uid, updatedFocusTasks)
        
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t))
        setCurrentTask(updatedTask)
      }
      // TaskMaster tasks would need more complex integration
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleLogDistraction = (sessionId, distractionData) => {
    const newDistraction = { ...distractionData, sessionId }
    setDistractions(prev => [...prev, newDistraction])
    showSnackbar('Distraction logged. Stay focused! 💪', 'warning')
  }

  const handleRefreshTasks = () => {
    loadUserData()
  }

  // Calculate stats for dashboard
  const todaySessions = getSessionsForDate(sessions, new Date())
  const focusSessionsToday = todaySessions.filter(s => s.type === 'focus' && s.completed)
  const totalFocusTimeToday = calculateTotalFocusTime(sessions, 1)
  const currentStreak = calculateStreak(sessions)
  const weeklyData = getWeeklySessionData(sessions)

  // Get random motivational quote
  const dailyQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#8b5cf6', width: 60, height: 60 }}>🎯</Avatar>
          <Typography variant="h6">Loading FocusMaster...</Typography>
        </Box>
      </Container>
    )
  }

  if (showSettings) {
    return (
      <SettingsPage 
        user={user} 
        onBack={() => setShowSettings(false)} 
        settings={settings}
        onSaveSettings={saveSettings}
      />
    )
  }

  if (showAnalytics) {
    return (
      <AdvancedAnalytics 
        sessions={sessions}
        distractions={distractions}
        tasks={tasks}
        onBack={() => setShowAnalytics(false)}
      />
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip
            title={focusModeActive ? "Focus mode is active - finish your session first! 🧘‍♂️" : ""}
            arrow
          >
            <span>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  if (focusModeActive) {
                    showSnackbar('🧘‍♂️ Focus mode is active! Complete your session first to leave.', 'info')
                  } else {
                    onBack()
                  }
                }}
                disabled={focusModeActive}
                sx={{ 
                  borderRadius: 2, 
                  fontWeight: 600, 
                  borderColor: focusModeActive ? '#d1d5db' : '#e2e8f0',
                  color: focusModeActive ? '#9ca3af' : 'inherit',
                  '&:disabled': {
                    borderColor: '#d1d5db',
                    color: '#9ca3af'
                  }
                }}
              >
                Back to Home
              </Button>
            </span>
          </Tooltip>
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
              FOCUSMASTER
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Deep work sessions with the Pomodoro technique 🍅
            </Typography>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Tooltip
            title={focusModeActive ? "Focus mode is active - finish your session first! 🧘‍♂️" : ""}
            arrow
          >
            <span>
              <Button
                variant="outlined"
                startIcon={<InsightsIcon />}
                onClick={() => {
                  if (focusModeActive) {
                    showSnackbar('🧘‍♂️ Focus mode is active! Complete your session first to access analytics.', 'info')
                  } else {
                    setShowAnalytics(true)
                  }
                }}
                disabled={focusModeActive}
                sx={{ 
                  borderRadius: 3, 
                  fontWeight: 600,
                  borderColor: focusModeActive ? '#d1d5db' : '#3b82f6',
                  color: focusModeActive ? '#9ca3af' : '#3b82f6',
                  '&:hover': focusModeActive ? {} : { 
                    borderColor: '#2563eb',
                    color: '#2563eb',
                    bgcolor: 'rgba(59, 130, 246, 0.05)'
                  },
                  '&:disabled': {
                    borderColor: '#d1d5db',
                    color: '#9ca3af'
                  }
                }}
              >
                Analytics
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={focusModeActive ? "Focus mode is active - finish your session first! 🧘‍♂️" : ""}
            arrow
          >
            <span>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => {
                  if (focusModeActive) {
                    showSnackbar('🧘‍♂️ Focus mode is active! Complete your session first to access settings.', 'info')
                  } else {
                    setShowSettings(true)
                  }
                }}
                disabled={focusModeActive}
                sx={{ 
                  borderRadius: 3, 
                  fontWeight: 600,
                  borderColor: focusModeActive ? '#d1d5db' : '#8b5cf6',
                  color: focusModeActive ? '#9ca3af' : '#8b5cf6',
                  '&:hover': focusModeActive ? {} : { 
                    borderColor: '#7c3aed',
                    color: '#7c3aed',
                    bgcolor: 'rgba(139, 92, 246, 0.05)'
                  },
                  '&:disabled': {
                    borderColor: '#d1d5db',
                    color: '#9ca3af'
                  }
                }}
              >
                Settings
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Daily Quote */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 4, 
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        border: '1px solid #bae6fd'
      }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: '#0369a1',
            fontStyle: 'italic',
            mb: 1
          }}>
            "{dailyQuote}"
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            💡 Daily inspiration to keep you focused
          </Typography>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <TimerIcon sx={{ color: '#ef4444', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {focusSessionsToday.length}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Sessions Today
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#ef4444', 
                display: 'block',
                fontWeight: 600,
                mt: 1
              }}>
                Goal: {settings.dailyGoal}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: '#10b981', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {formatDuration(totalFocusTimeToday)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Focus Time Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <LocalFireDepartmentIcon sx={{ color: '#f59e0b', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {currentStreak}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Day Streak
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#f59e0b', 
                display: 'block',
                fontWeight: 600,
                mt: 1
              }}>
                🔥 Keep it going!
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <EmojiEventsIcon sx={{ color: '#8b5cf6', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {tasks.filter(t => t.status === 'done').length}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Tasks Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Focus Mode Section */}
      {focusModeActive && (
        <Box sx={{ mb: 4 }}>
          <FocusMode
            isActive={focusModeActive}
            onToggle={() => setFocusModeActive(!focusModeActive)}
            currentSession={currentSession}
            onLogDistraction={handleLogDistraction}
            settings={settings}
          />
        </Box>
      )}

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Timer Section */}
        <Grid item xs={12} md={8}>
          <FocusTimer
            settings={settings}
            currentTask={currentTask}
            onSessionComplete={handleSessionComplete}
            onLogDistraction={(sessionId) => {
              setCurrentSessionId(sessionId)
              setDistractionLoggerOpen(true)
            }}
            onTaskComplete={handleTaskComplete}
          />
        </Grid>

        {/* Task Selection */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Focus Mode Toggle (when inactive) */}
            {!focusModeActive && (
              <FocusMode
                isActive={focusModeActive}
                onToggle={() => setFocusModeActive(!focusModeActive)}
                currentSession={currentSession}
                onLogDistraction={handleLogDistraction}
                settings={settings}
              />
            )}
            
            {/* Task Selection */}
            <TaskPicker
              tasks={tasks}
              currentTask={currentTask}
              projects={projects}
              onTaskSelect={handleTaskSelect}
              onCreateTask={handleTaskCreate}
              onRefreshTasks={handleRefreshTasks}
              loading={loading}
              disabled={focusModeActive}
            />
          </Stack>
        </Grid>
      </Grid>

      {/* Distraction Logger */}
      <DistractionLogger
        open={distractionLoggerOpen}
        onClose={() => setDistractionLoggerOpen(false)}
        onLogDistraction={handleLogDistraction}
        sessionId={currentSessionId}
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