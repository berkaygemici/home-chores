import { TIMER_MODES, SESSION_TYPES } from '../constants/focusConstants'

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format time in HH:MM format for longer durations
 */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

/**
 * Convert minutes to seconds
 */
export const minutesToSeconds = (minutes) => minutes * 60

/**
 * Convert seconds to minutes
 */
export const secondsToMinutes = (seconds) => Math.floor(seconds / 60)

/**
 * Get the next timer mode in the Pomodoro sequence
 */
export const getNextTimerMode = (currentMode, sessionCount, sessionsUntilLongBreak = 4) => {
  if (currentMode === TIMER_MODES.POMODORO) {
    // After focus session, determine break type
    if (sessionCount % sessionsUntilLongBreak === 0) {
      return TIMER_MODES.LONG_BREAK
    }
    return TIMER_MODES.SHORT_BREAK
  }
  
  // After any break, return to focus
  return TIMER_MODES.POMODORO
}

/**
 * Get session type from timer mode
 */
export const getSessionType = (timerMode) => {
  switch (timerMode) {
    case TIMER_MODES.POMODORO:
      return SESSION_TYPES.FOCUS
    case TIMER_MODES.SHORT_BREAK:
      return SESSION_TYPES.SHORT_BREAK
    case TIMER_MODES.LONG_BREAK:
      return SESSION_TYPES.LONG_BREAK
    default:
      return SESSION_TYPES.FOCUS
  }
}

/**
 * Calculate session completion percentage
 */
export const calculateCompletionPercentage = (timeLeft, totalTime) => {
  if (totalTime <= 0) return 0
  const elapsed = totalTime - timeLeft
  return Math.round((elapsed / totalTime) * 100)
}

/**
 * Get timer mode label
 */
export const getTimerModeLabel = (mode) => {
  switch (mode) {
    case TIMER_MODES.POMODORO:
      return 'Focus Time'
    case TIMER_MODES.SHORT_BREAK:
      return 'Short Break'
    case TIMER_MODES.LONG_BREAK:
      return 'Long Break'
    case TIMER_MODES.CUSTOM:
      return 'Custom Timer'
    default:
      return 'Timer'
  }
}

/**
 * Get timer mode color
 */
export const getTimerModeColor = (mode) => {
  switch (mode) {
    case TIMER_MODES.POMODORO:
      return '#ef4444' // Red for focus
    case TIMER_MODES.SHORT_BREAK:
      return '#10b981' // Green for short break
    case TIMER_MODES.LONG_BREAK:
      return '#3b82f6' // Blue for long break
    case TIMER_MODES.CUSTOM:
      return '#8b5cf6' // Purple for custom
    default:
      return '#6b7280' // Gray default
  }
}

/**
 * Create a new session object
 */
export const createSession = (timerMode, duration, taskId = null) => {
  return {
    id: `session_${Date.now()}`,
    type: getSessionType(timerMode),
    duration: duration, // in seconds
    taskId,
    startTime: new Date().toISOString(),
    endTime: null,
    completed: false,
    completionPercentage: 0,
    distractions: [],
    notes: ''
  }
}

/**
 * Complete a session
 */
export const completeSession = (session, timeLeft) => {
  const completionPercentage = calculateCompletionPercentage(timeLeft, session.duration)
  return {
    ...session,
    endTime: new Date().toISOString(),
    completed: completionPercentage >= 90, // Consider completed if 90%+ finished
    completionPercentage
  }
}

/**
 * Check if session was successful (>90% completion)
 */
export const isSessionSuccessful = (session) => {
  return session.completionPercentage >= 90
}

/**
 * Calculate streak from sessions
 */
export const calculateStreak = (sessions) => {
  if (!sessions || sessions.length === 0) return 0
  
  const focusSessions = sessions
    .filter(s => s.type === SESSION_TYPES.FOCUS && s.completed)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
  
  if (focusSessions.length === 0) return 0
  
  let streak = 0
  let currentDate = new Date().toDateString()
  
  for (const session of focusSessions) {
    const sessionDate = new Date(session.startTime).toDateString()
    
    if (sessionDate === currentDate) {
      streak++
      // Move to previous day
      const prevDay = new Date(currentDate)
      prevDay.setDate(prevDay.getDate() - 1)
      currentDate = prevDay.toDateString()
    } else {
      break
    }
  }
  
  return streak
}

/**
 * Get sessions for a specific date
 */
export const getSessionsForDate = (sessions, date) => {
  const targetDate = new Date(date).toDateString()
  return sessions.filter(session => {
    const sessionDate = new Date(session.startTime).toDateString()
    return sessionDate === targetDate
  })
}

/**
 * Calculate total focus time for a period
 */
export const calculateTotalFocusTime = (sessions, days = 1) => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days + 1)
  cutoffDate.setHours(0, 0, 0, 0)
  
  return sessions
    .filter(session => {
      const sessionDate = new Date(session.startTime)
      return sessionDate >= cutoffDate && 
             session.type === SESSION_TYPES.FOCUS && 
             session.completed
    })
    .reduce((total, session) => total + secondsToMinutes(session.duration), 0)
}

/**
 * Get daily session counts for the past week
 */
export const getWeeklySessionData = (sessions) => {
  const weekData = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const daySessions = getSessionsForDate(sessions, date)
    const focusSessions = daySessions.filter(s => s.type === SESSION_TYPES.FOCUS && s.completed)
    
    weekData.push({
      date: date.toDateString(),
      dayName: date.toLocaleDateString('en', { weekday: 'short' }),
      sessions: focusSessions.length,
      focusTime: focusSessions.reduce((total, s) => total + secondsToMinutes(s.duration), 0)
    })
  }
  
  return weekData
}

/**
 * Play notification sound
 */
export const playNotificationSound = (volume = 0.5) => {
  // Create a simple beep sound using Web Audio API
  if (typeof window !== 'undefined' && window.AudioContext) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }
}

/**
 * Send browser notification
 */
export const sendNotification = (title, body, icon = '🎯') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: icon
    })
  }
}

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return Notification.permission === 'granted'
} 