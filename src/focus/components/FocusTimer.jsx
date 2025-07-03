import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import StopIcon from '@mui/icons-material/Stop'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import TimerIcon from '@mui/icons-material/Timer'
import NotificationsIcon from '@mui/icons-material/Notifications'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import BugReportIcon from '@mui/icons-material/BugReport'

import { 
  TIMER_MODES, 
  TIMER_STATES,
  SESSION_TYPES 
} from '../constants/focusConstants'
import { 
  formatTime, 
  minutesToSeconds,
  getTimerModeLabel,
  getTimerModeColor,
  getNextTimerMode,
  calculateCompletionPercentage,
  playNotificationSound,
  sendNotification
} from '../utils/timerUtils'

export default function FocusTimer({ 
  settings, 
  currentTask, 
  onSessionComplete,
  onLogDistraction,
  onTaskComplete
}) {
  const [timerMode, setTimerMode] = useState(TIMER_MODES.POMODORO)
  const [timerState, setTimerState] = useState(TIMER_STATES.IDLE)
  const [timeLeft, setTimeLeft] = useState(minutesToSeconds(settings.pomodoroLength))
  const [totalTime, setTotalTime] = useState(minutesToSeconds(settings.pomodoroLength))
  const [sessionCount, setSessionCount] = useState(0)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [distractionModalOpen, setDistractionModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')

  const intervalRef = useRef(null)
  const timerModeColor = getTimerModeColor(timerMode)

  // Initialize timer when mode or settings change
  useEffect(() => {
    let duration
    switch (timerMode) {
      case TIMER_MODES.POMODORO:
        duration = minutesToSeconds(settings.pomodoroLength)
        break
      case TIMER_MODES.SHORT_BREAK:
        duration = minutesToSeconds(settings.shortBreakLength)
        break
      case TIMER_MODES.LONG_BREAK:
        duration = minutesToSeconds(settings.longBreakLength)
        break
      default:
        duration = minutesToSeconds(settings.pomodoroLength)
    }
    
    if (timerState === TIMER_STATES.IDLE) {
      setTimeLeft(duration)
      setTotalTime(duration)
    }
  }, [timerMode, settings, timerState])

  // Timer countdown logic
  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState, timeLeft])

  // Update document title with timer
  useEffect(() => {
    if (settings.showTimerInTitle && timerState === TIMER_STATES.RUNNING) {
      document.title = `${formatTime(timeLeft)} - ${getTimerModeLabel(timerMode)} | FocusMaster`
    } else if (settings.showTimerInTitle) {
      document.title = 'FocusMaster'
    }

    return () => {
      if (settings.showTimerInTitle) {
        document.title = 'FocusMaster'
      }
    }
  }, [timeLeft, timerMode, timerState, settings.showTimerInTitle])

  const handleStart = () => {
    if (timerState === TIMER_STATES.IDLE) {
      const sessionId = `session_${Date.now()}`
      setCurrentSessionId(sessionId)
      setSessionNotes('')
    }
    setTimerState(TIMER_STATES.RUNNING)
  }

  const handlePause = () => {
    setTimerState(TIMER_STATES.PAUSED)
  }

  const handleStop = () => {
    setTimerState(TIMER_STATES.IDLE)
    setTimeLeft(totalTime)
    setCurrentSessionId(null)
    setSessionNotes('')
  }

  const handleTimerComplete = () => {
    setTimerState(TIMER_STATES.COMPLETED)
    
    // Play sound notification
    if (settings.soundEnabled) {
      playNotificationSound(settings.soundVolume)
    }

    // Send browser notification
    if (settings.notificationsEnabled) {
      const isBreak = timerMode !== TIMER_MODES.POMODORO
      const title = isBreak ? 'Break Complete!' : 'Focus Session Complete!'
      const body = isBreak 
        ? 'Time to get back to work! 💪'
        : 'Great job! Time for a well-deserved break 🎉'
      sendNotification(title, body)
    }

    // Handle session completion
    const sessionData = {
      id: currentSessionId,
      type: timerMode === TIMER_MODES.POMODORO ? SESSION_TYPES.FOCUS : 
            timerMode === TIMER_MODES.SHORT_BREAK ? SESSION_TYPES.SHORT_BREAK : SESSION_TYPES.LONG_BREAK,
      duration: totalTime,
      taskId: currentTask?.id,
      startTime: new Date(Date.now() - totalTime * 1000).toISOString(),
      endTime: new Date().toISOString(),
      completed: true,
      completionPercentage: 100,
      distractions: [],
      notes: sessionNotes
    }

    if (onSessionComplete) {
      onSessionComplete(sessionData)
    }

    // Update session count for focus sessions
    if (timerMode === TIMER_MODES.POMODORO) {
      setSessionCount(prev => prev + 1)
      
      // Handle task completion
      if (currentTask && onTaskComplete) {
        onTaskComplete(currentTask)
      }
    }

    // Auto-start next session if enabled
    const nextMode = getNextTimerMode(timerMode, sessionCount + 1, settings.sessionsUntilLongBreak)
    
    setTimeout(() => {
      setTimerMode(nextMode)
      setTimerState(TIMER_STATES.IDLE)
      
      const shouldAutoStart = (nextMode === TIMER_MODES.POMODORO && settings.autoStartPomodoros) ||
                              (nextMode !== TIMER_MODES.POMODORO && settings.autoStartBreaks)
      
      if (shouldAutoStart) {
        setTimeout(() => {
          handleStart()
        }, 1000)
      }
    }, 2000)
  }

  const handleSkip = () => {
    const nextMode = getNextTimerMode(timerMode, sessionCount, settings.sessionsUntilLongBreak)
    setTimerMode(nextMode)
    setTimerState(TIMER_STATES.IDLE)
    setCurrentSessionId(null)
    setSessionNotes('')
  }

  const handleLogDistraction = () => {
    setDistractionModalOpen(true)
  }

  const handleDistractionLogged = (distractionData) => {
    if (onLogDistraction && currentSessionId) {
      onLogDistraction(currentSessionId, distractionData)
    }
    setDistractionModalOpen(false)
  }

  const handleNotesClick = () => {
    setNotesModalOpen(true)
  }

  const handleNotesSave = () => {
    setNotesModalOpen(false)
  }

  const completionPercentage = calculateCompletionPercentage(timeLeft, totalTime)
  const progressValue = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  const isRunning = timerState === TIMER_STATES.RUNNING
  const isPaused = timerState === TIMER_STATES.PAUSED
  const isCompleted = timerState === TIMER_STATES.COMPLETED
  const isIdle = timerState === TIMER_STATES.IDLE

  return (
    <>
      <Paper sx={{ 
        p: 4, 
        borderRadius: 4, 
        textAlign: 'center',
        background: `linear-gradient(135deg, ${timerModeColor}15, ${timerModeColor}05)`,
        border: `2px solid ${timerModeColor}30`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, transparent 0%, ${timerModeColor}08 100%)`,
          zIndex: 0
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Timer Mode Header */}
          <Box sx={{ mb: 3 }}>
            <Chip
              label={getTimerModeLabel(timerMode)}
              sx={{
                bgcolor: timerModeColor,
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                px: 2,
                py: 1
              }}
            />
          </Box>

          {/* Current Task Display */}
          {currentTask && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                Working on:
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: '#1e293b',
                maxWidth: 300,
                mx: 'auto',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentTask.title}
              </Typography>
            </Box>
          )}

          {/* Timer Display */}
          <Box sx={{ 
            position: 'relative', 
            display: 'inline-block',
            mb: 4
          }}>
            <CircularProgress
              variant="determinate"
              value={progressValue}
              size={200}
              thickness={4}
              sx={{
                color: timerModeColor,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <CircularProgress
              variant="determinate"
              value={100}
              size={200}
              thickness={4}
              sx={{
                color: `${timerModeColor}20`,
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: -1
              }}
            />
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <Typography variant="h2" sx={{ 
                fontWeight: 700, 
                color: timerModeColor,
                fontSize: '2.5rem',
                fontFamily: 'monospace'
              }}>
                {formatTime(timeLeft)}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#64748b',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                {completionPercentage}% Complete
              </Typography>
            </Box>
          </Box>

          {/* Session Info */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
              <Chip
                icon={<TimerIcon />}
                label={`Session ${sessionCount + 1}`}
                size="small"
                variant="outlined"
                sx={{ borderColor: timerModeColor, color: timerModeColor }}
              />
              {settings.notificationsEnabled && (
                <Chip
                  icon={<NotificationsIcon />}
                  label="Notifications On"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: '#10b981', color: '#10b981' }}
                />
              )}
              {settings.soundEnabled && (
                <Chip
                  icon={<VolumeUpIcon />}
                  label="Sound On"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                />
              )}
            </Stack>
          </Box>

          {/* Timer Controls */}
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
            {isIdle && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={handleStart}
                sx={{
                  bgcolor: timerModeColor,
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  '&:hover': { bgcolor: `${timerModeColor}dd` }
                }}
              >
                Start {getTimerModeLabel(timerMode)}
              </Button>
            )}

            {isRunning && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PauseIcon />}
                  onClick={handlePause}
                  sx={{
                    bgcolor: '#f59e0b',
                    borderRadius: 3,
                    px: 3,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#d97706' }
                  }}
                >
                  Pause
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<StopIcon />}
                  onClick={handleStop}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    borderRadius: 3,
                    px: 3,
                    fontWeight: 600,
                    '&:hover': { 
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      bgcolor: '#fef2f2'
                    }
                  }}
                >
                  Stop
                </Button>
              </>
            )}

            {isPaused && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStart}
                  sx={{
                    bgcolor: timerModeColor,
                    borderRadius: 3,
                    px: 3,
                    fontWeight: 600,
                    '&:hover': { bgcolor: `${timerModeColor}dd` }
                  }}
                >
                  Resume
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<StopIcon />}
                  onClick={handleStop}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    borderRadius: 3,
                    px: 3,
                    fontWeight: 600,
                    '&:hover': { 
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      bgcolor: '#fef2f2'
                    }
                  }}
                >
                  Stop
                </Button>
              </>
            )}

            {isCompleted && (
              <Button
                variant="contained"
                size="large"
                startIcon={<SkipNextIcon />}
                onClick={handleSkip}
                sx={{
                  bgcolor: '#10b981',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Continue
              </Button>
            )}
          </Stack>

          {/* Action Buttons */}
          {(isRunning || isPaused) && (
            <Stack direction="row" spacing={1} justifyContent="center">
              <Tooltip title="Log Distraction">
                <IconButton
                  onClick={handleLogDistraction}
                  sx={{
                    bgcolor: '#fef3c7',
                    color: '#d97706',
                    '&:hover': { bgcolor: '#fde68a' }
                  }}
                >
                  <BugReportIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Add Notes">
                <IconButton
                  onClick={handleNotesClick}
                  sx={{
                    bgcolor: '#dbeafe',
                    color: '#2563eb',
                    '&:hover': { bgcolor: '#bfdbfe' }
                  }}
                >
                  ✏️
                </IconButton>
              </Tooltip>

              <Tooltip title="Skip Session">
                <IconButton
                  onClick={handleSkip}
                  sx={{
                    bgcolor: '#f3f4f6',
                    color: '#64748b',
                    '&:hover': { bgcolor: '#e5e7eb' }
                  }}
                >
                  <SkipNextIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Distraction Logging Modal */}
      <Dialog open={distractionModalOpen} onClose={() => setDistractionModalOpen(false)}>
        <DialogTitle>Log Distraction</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            What distracted you? This helps improve your focus patterns.
          </Typography>
          {/* Distraction logging form will be added here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDistractionModalOpen(false)}>Cancel</Button>
          <Button onClick={() => handleDistractionLogged({})}>Log</Button>
        </DialogActions>
      </Dialog>

      {/* Session Notes Modal */}
      <Dialog open={notesModalOpen} onClose={() => setNotesModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Session Notes</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Add notes about this session..."
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesModalOpen(false)}>Cancel</Button>
          <Button onClick={handleNotesSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 