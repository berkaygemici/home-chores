import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  IconButton,
  Fade,
  Slide,
  LinearProgress
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import PsychologyIcon from '@mui/icons-material/Psychology'
import TimerIcon from '@mui/icons-material/Timer'
import CloseIcon from '@mui/icons-material/Close'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const COMMON_DISTRACTING_SITES = [
  { name: 'Social Media', sites: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'linkedin.com'] },
  { name: 'Entertainment', sites: ['youtube.com', 'netflix.com', 'twitch.tv', 'reddit.com'] },
  { name: 'News & Blogs', sites: ['news.google.com', 'cnn.com', 'bbc.com', 'medium.com'] },
  { name: 'Shopping', sites: ['amazon.com', 'ebay.com', 'aliexpress.com', 'etsy.com'] },
  { name: 'Games', sites: ['steam.com', 'epic.com', 'battle.net', 'xbox.com'] }
]

const MINDFULNESS_PROMPTS = [
  "Take a deep breath and return to your task. You've got this! 🌟",
  "Notice the urge to browse, acknowledge it, and let it pass. 🧘‍♂️",
  "Your future self will thank you for staying focused right now. 💪",
  "What would completing this task mean to you? Hold that vision. ✨",
  "This distraction is temporary, but your progress is lasting. 🎯",
  "Feel your breath, ground yourself, and recommit to your goal. 🌱",
  "You chose to focus for a reason. Trust that decision. 🔥",
  "Notice how good it feels to be in control of your attention. 💎"
]

const FOCUS_MANTRAS = [
  "I am in control of my attention",
  "Every moment of focus builds my future",
  "I choose progress over distraction",
  "My goals are worth my undivided attention",
  "I am capable of deep, sustained focus"
]

export default function FocusMode({ 
  isActive, 
  onToggle, 
  currentSession,
  onLogDistraction,
  settings = {}
}) {
  const [distractionAttempts, setDistractionAttempts] = useState(0)
  const [mindfulnessPromptOpen, setMindfulnessPromptOpen] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [focusIntensity, setFocusIntensity] = useState('medium') // low, medium, high
  const [blockedSites, setBlockedSites] = useState([])
  const [urlCheckInterval, setUrlCheckInterval] = useState(null)
  const [showMantra, setShowMantra] = useState(false)
  const [currentMantra, setCurrentMantra] = useState('')

  // Initialize blocked sites based on focus intensity
  useEffect(() => {
    if (isActive) {
      const defaultBlocked = COMMON_DISTRACTING_SITES.reduce((acc, category) => {
        if (focusIntensity === 'high') {
          return [...acc, ...category.sites]
        } else if (focusIntensity === 'medium') {
          return [...acc, ...category.sites.slice(0, 2)] // Only block most common ones
        }
        return acc // low intensity blocks nothing by default
      }, [])
      setBlockedSites(defaultBlocked)
    }
  }, [isActive, focusIntensity])

  // Monitor for tab changes and distracting activities
  useEffect(() => {
    if (!isActive) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs/apps
        handleDistractionAttempt('tab_switch')
      }
    }

    const handleFocus = () => {
      // User returned to the page
      if (distractionAttempts > 0) {
        showMindfulnessPrompt()
      }
    }

    const handleKeydown = (e) => {
      // Detect common shortcuts that lead to distractions
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        // New tab
        e.preventDefault()
        handleDistractionAttempt('new_tab')
        return false
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        // Address bar focus
        e.preventDefault()
        handleDistractionAttempt('address_bar')
        return false
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('keydown', handleKeydown)

    // Check URL periodically for blocked sites
    const interval = setInterval(checkForBlockedSites, 2000)
    setUrlCheckInterval(interval)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('keydown', handleKeydown)
      if (interval) clearInterval(interval)
    }
  }, [isActive, distractionAttempts])

  // Show periodic mantras during long sessions
  useEffect(() => {
    if (!isActive || !currentSession) return

    const showMantraInterval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 5 minutes
        showFocusMantra()
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(showMantraInterval)
  }, [isActive, currentSession])

  const checkForBlockedSites = useCallback(() => {
    const currentUrl = window.location.hostname
    const isBlocked = blockedSites.some(site => currentUrl.includes(site))
    
    if (isBlocked) {
      handleDistractionAttempt('blocked_site')
    }
  }, [blockedSites])

  const handleDistractionAttempt = (type) => {
    setDistractionAttempts(prev => prev + 1)
    
    // Log the distraction attempt
    if (onLogDistraction && currentSession) {
      onLogDistraction(currentSession.id, {
        type: 'interruption',
        description: `Focus mode detected: ${type}`,
        timestamp: new Date().toISOString(),
        severity: 'medium'
      })
    }

    // Show mindfulness prompt for higher attempts
    if (distractionAttempts >= 2) {
      showMindfulnessPrompt()
    }
  }

  const showMindfulnessPrompt = () => {
    const prompt = MINDFULNESS_PROMPTS[Math.floor(Math.random() * MINDFULNESS_PROMPTS.length)]
    setCurrentPrompt(prompt)
    setMindfulnessPromptOpen(true)
  }

  const showFocusMantra = () => {
    const mantra = FOCUS_MANTRAS[Math.floor(Math.random() * FOCUS_MANTRAS.length)]
    setCurrentMantra(mantra)
    setShowMantra(true)
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setShowMantra(false)
    }, 4000)
  }

  const handlePromptClose = (wasRefocused = false) => {
    setMindfulnessPromptOpen(false)
    if (wasRefocused) {
      setDistractionAttempts(0) // Reset counter if user commits to refocus
    }
  }

  const getFocusIntensityColor = (intensity) => {
    switch (intensity) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#ef4444'
      default: return '#64748b'
    }
  }

  const getFocusIntensityDescription = (intensity) => {
    switch (intensity) {
      case 'low': return 'Gentle reminders, minimal blocking'
      case 'medium': return 'Moderate blocking, mindfulness prompts'
      case 'high': return 'Aggressive blocking, frequent reminders'
      default: return ''
    }
  }

  if (!isActive) {
    return (
      <Paper sx={{ 
        p: 3, 
        borderRadius: 4, 
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #f8fafc, #ffffff)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            🧘‍♂️ Focus Mode
          </Typography>
          <Switch
            checked={false}
            onChange={onToggle}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#8b5cf6',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#8b5cf6',
              },
            }}
          />
        </Box>
        
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Activate focus mode to minimize distractions and enhance concentration during your Pomodoro sessions.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Focus Intensity
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['low', 'medium', 'high'].map((intensity) => (
              <Chip
                key={intensity}
                label={intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                onClick={() => setFocusIntensity(intensity)}
                variant={focusIntensity === intensity ? 'filled' : 'outlined'}
                sx={{
                  bgcolor: focusIntensity === intensity ? getFocusIntensityColor(intensity) : 'transparent',
                  color: focusIntensity === intensity ? 'white' : getFocusIntensityColor(intensity),
                  borderColor: getFocusIntensityColor(intensity),
                  '&:hover': {
                    bgcolor: focusIntensity === intensity ? getFocusIntensityColor(intensity) : 'rgba(139, 92, 246, 0.1)'
                  }
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
            {getFocusIntensityDescription(focusIntensity)}
          </Typography>
        </Box>

        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 3,
            bgcolor: '#f0f9ff',
            '& .MuiAlert-icon': { color: '#3b82f6' }
          }}
        >
          Focus mode will help you stay on track by providing gentle nudges when distractions arise.
        </Alert>
      </Paper>
    )
  }

  return (
    <>
      {/* Active Focus Mode Display */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 4, 
        border: '2px solid #8b5cf6',
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon /> Focus Mode Active
            </Typography>
            <Switch
              checked={true}
              onChange={onToggle}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: 'white',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              Intensity: {focusIntensity.charAt(0).toUpperCase() + focusIntensity.slice(1)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Distraction attempts: {distractionAttempts}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<BlockIcon />}
              label={`${blockedSites.length} sites monitored`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)', 
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
            <Chip 
              icon={<VisibilityOffIcon />}
              label="Tab switching detected"
              size="small"
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)', 
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Box>
        </Box>

        {/* Animated background */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1))',
          backgroundSize: '20px 20px',
          animation: 'slide 20s linear infinite',
          zIndex: 1
        }} />
      </Paper>

      {/* Floating Mantra */}
      <Fade in={showMantra}>
        <Paper sx={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          p: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          color: 'white',
          zIndex: 9999,
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.4)',
          minWidth: 300,
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            🧘‍♂️ Focus Mantra
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            "{currentMantra}"
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={100}
            sx={{ 
              mt: 2, 
              height: 3, 
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white',
                animation: 'shrink 4s linear'
              }
            }} 
          />
        </Paper>
      </Fade>

      {/* Mindfulness Prompt Dialog */}
      <Dialog
        open={mindfulnessPromptOpen}
        onClose={() => handlePromptClose(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
            border: '2px solid #f59e0b'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#92400e',
          fontWeight: 700
        }}>
          <WarningIcon /> Mindful Moment
          <IconButton
            edge="end"
            onClick={() => handlePromptClose(false)}
            sx={{ ml: 'auto', color: '#92400e' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="h6" sx={{ 
            color: '#92400e', 
            fontWeight: 600, 
            mb: 2,
            textAlign: 'center'
          }}>
            {currentPrompt}
          </Typography>
          
          <Alert 
            severity="warning" 
            sx={{ 
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid #f59e0b',
              color: '#92400e'
            }}
          >
            You've been detected trying to switch away from your focus session. Take a moment to reconnect with your intention.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => handlePromptClose(false)}
            sx={{ 
              color: '#64748b',
              '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.1)' }
            }}
          >
            I need a break
          </Button>
          <Button
            variant="contained"
            onClick={() => handlePromptClose(true)}
            startIcon={<CheckCircleIcon />}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)'
              }
            }}
          >
            Recommit to Focus
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </>
  )
} 