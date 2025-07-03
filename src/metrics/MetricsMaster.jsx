import React, { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Avatar,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Card,
  CardContent
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SettingsIcon from '@mui/icons-material/Settings'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import RefreshIcon from '@mui/icons-material/Refresh'
import InsightsIcon from '@mui/icons-material/Insights'
import TaskIcon from '@mui/icons-material/Task'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import TimerIcon from '@mui/icons-material/Timer'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

import OverviewDashboard from './components/OverviewDashboard'
import TaskAnalyticsDashboard from './components/TaskAnalyticsDashboard'
import HabitAnalyticsDashboard from './components/HabitAnalyticsDashboard'
import FocusAnalyticsDashboard from './components/FocusAnalyticsDashboard'
import ChoreAnalyticsDashboard from './components/ChoreAnalyticsDashboard'

import { fetchAllAppsData } from './utils/dataFetchers'
import { 
  calculateOverviewMetrics, 
  getTaskAnalytics, 
  getHabitAnalytics, 
  getFocusAnalytics, 
  getChoreAnalytics 
} from './utils/analytics'
import { APP_COLORS, PRODUCTIVITY_MESSAGES } from './constants/metricsConstants'

const TABS = [
  { id: 'overview', label: 'Overview', icon: InsightsIcon, color: APP_COLORS.overview },
  { id: 'tasks', label: 'Tasks', icon: TaskIcon, color: APP_COLORS.tasks },
  { id: 'habits', label: 'Habits', icon: TrackChangesIcon, color: APP_COLORS.habits },
  { id: 'focus', label: 'Focus', icon: TimerIcon, color: APP_COLORS.focus },
  { id: 'chores', label: 'Chores', icon: CleaningServicesIcon, color: APP_COLORS.chores }
]

export default function MetricsMaster({ user, onBack }) {
  // Core state
  const [currentTab, setCurrentTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState({
    tasks: [],
    habits: [],
    focusSessions: [],
    chores: [],
    projects: [],
    sections: []
  })
  const [metrics, setMetrics] = useState({})
  
  // UI state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [lastUpdated, setLastUpdated] = useState(null)

  // Load data on mount
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadAllData()
  }, [user])

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      const allData = await fetchAllAppsData(user.uid)
      console.log('Raw data from Firebase:', allData)
      
      // Flatten the data structure for components
      const flattenedData = {
        tasks: allData.tasks.projects,
        habits: allData.habits.habits,
        focusSessions: allData.focus.sessions,
        chores: allData.chores.chores,
        projects: allData.tasks.projects,
        sections: [] // Will be populated if needed
      }
      
      setData(flattenedData)
      console.log('Flattened data:', flattenedData)
      
      const overviewMetrics = calculateOverviewMetrics(allData)
      console.log('Calculated metrics:', overviewMetrics)
      setMetrics(overviewMetrics)
      
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Failed to load data:', error)
      showSnackbar('Failed to load analytics data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData()
    setRefreshing(false)
    showSnackbar('Data refreshed successfully! 📊', 'success')
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue)
  }

  const getMotivationalMessage = () => {
    const score = metrics.productivityScore || 0
    if (score >= 90) return PRODUCTIVITY_MESSAGES.excellent[Math.floor(Math.random() * PRODUCTIVITY_MESSAGES.excellent.length)]
    if (score >= 70) return PRODUCTIVITY_MESSAGES.good[Math.floor(Math.random() * PRODUCTIVITY_MESSAGES.good.length)]
    if (score >= 50) return PRODUCTIVITY_MESSAGES.average[Math.floor(Math.random() * PRODUCTIVITY_MESSAGES.average.length)]
    return PRODUCTIVITY_MESSAGES.needsWork[Math.floor(Math.random() * PRODUCTIVITY_MESSAGES.needsWork.length)]
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Loading {currentTab} data...
        </Typography>
      )
    }

    switch (currentTab) {
      case 'overview':
        return <OverviewDashboard overviewMetrics={metrics} trendData={[]} timeRange={7} />
      case 'tasks':
        const taskAnalytics = getTaskAnalytics({ projects: data.projects || [] }, 30)
        return <TaskAnalyticsDashboard taskAnalytics={taskAnalytics} timeRange={30} />
      case 'habits':
        const habitAnalytics = getHabitAnalytics({ habits: data.habits || [] }, 30)
        return <HabitAnalyticsDashboard habitAnalytics={habitAnalytics} timeRange={30} />
      case 'focus':
        const focusAnalytics = getFocusAnalytics({ sessions: data.focusSessions || [] }, 30)
        return <FocusAnalyticsDashboard focusAnalytics={focusAnalytics} timeRange={30} />
      case 'chores':
        const choreAnalytics = getChoreAnalytics({ chores: data.chores || [] }, 30)
        return <ChoreAnalyticsDashboard choreAnalytics={choreAnalytics} timeRange={30} />
      default:
        return <OverviewDashboard overviewMetrics={metrics} trendData={[]} timeRange={7} />
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: 'linear-gradient(135deg, #667eea, #764ba2)', 
            width: 60, 
            height: 60,
            fontSize: '1.5rem'
          }}>
            📊
          </Avatar>
          <CircularProgress size={40} sx={{ color: '#667eea' }} />
          <Typography variant="h6" sx={{ color: '#64748b' }}>
            Loading MetricsMaster...
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Aggregating data from all your productivity apps
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
                        sx={{
              borderRadius: 2,
              fontWeight: 600,
              borderColor: '#e2e8f0',
              '&:hover': { borderColor: '#cbd5e1', bgcolor: 'rgba(15, 23, 42, 0.02)' }
            }}
          >
            Back to Home
          </Button>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #667eea, #764ba2)', 
            borderRadius: 3, 
            p: 1.5,
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
          }}>
            <Avatar sx={{ bgcolor: 'transparent', width: 48, height: 48, fontSize: '1.5rem' }}>
              📊
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
              METRICSMASTER
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Your personal productivity analytics dashboard 📈
            </Typography>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2} alignItems="center">
          {lastUpdated && (
            <Chip
              icon={<TrendingUpIcon />}
              label={`Updated ${lastUpdated.toLocaleTimeString()}`}
              size="small"
              sx={{ 
                bgcolor: '#f0f9ff', 
                color: '#0369a1',
                fontWeight: 500
              }}
            />
          )}
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                bgcolor: '#f1f5f9',
                '&:hover': { bgcolor: '#e2e8f0' }
              }}
            >
              <RefreshIcon sx={{ 
                color: '#475569',
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Motivational Message */}
      {metrics.productivityScore !== undefined && (
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
              {getMotivationalMessage()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              💡 Productivity Score: {Math.round(metrics.productivityScore)}% | Keep up the great work!
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ 
        borderRadius: 3, 
        mb: 4, 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: 64,
              textTransform: 'none'
            },
            '& .MuiTabs-indicator': {
              height: 3
            }
          }}
        >
          {TABS.map((tab) => {
            const IconComponent = tab.icon
            return (
              <Tab
                key={tab.id}
                value={tab.id}
                icon={<IconComponent sx={{ fontSize: 20 }} />}
                label={tab.label}
                iconPosition="start"
                sx={{
                  color: currentTab === tab.id ? tab.color : '#64748b',
                  '&.Mui-selected': {
                    color: tab.color
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: tab.color
                  }
                }}
              />
            )
          })}
        </Tabs>
      </Paper>

      {/* Main Content */}
      <Box sx={{ mb: 4 }}>
        {renderTabContent()}
      </Box>

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

      {/* CSS for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Container>
  )
}
