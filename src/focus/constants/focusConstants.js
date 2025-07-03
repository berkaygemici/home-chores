// Timer modes
export const TIMER_MODES = {
  POMODORO: 'pomodoro',
  SHORT_BREAK: 'short_break',
  LONG_BREAK: 'long_break',
  CUSTOM: 'custom'
}

// Timer states
export const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed'
}

// Default timer settings (in minutes)
export const DEFAULT_SETTINGS = {
  pomodoroLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
  soundVolume: 0.5,
  dailyGoal: 8, // Number of pomodoros per day
  showTimerInTitle: true,
  minimizeToTray: false
}

// Focus session types
export const SESSION_TYPES = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short_break',
  LONG_BREAK: 'long_break'
}

// Distraction categories
export const DISTRACTION_CATEGORIES = [
  { id: 'social', name: 'Social Media', label: 'Social Media', icon: '📱', color: '#ef4444', value: 'social' },
  { id: 'noise', name: 'External Noise', label: 'External Noise', icon: '🔊', color: '#f59e0b', value: 'noise' },
  { id: 'hunger', name: 'Hunger/Thirst', label: 'Hunger/Thirst', icon: '🍎', color: '#10b981', value: 'hunger' },
  { id: 'thoughts', name: 'Wandering Thoughts', label: 'Wandering Thoughts', icon: '💭', color: '#8b5cf6', value: 'thoughts' },
  { id: 'interruption', name: 'Interruption', label: 'Interruption', icon: '🚪', color: '#06b6d4', value: 'interruption' },
  { id: 'fatigue', name: 'Fatigue', label: 'Fatigue', icon: '😴', color: '#64748b', value: 'fatigue' },
  { id: 'other', name: 'Other', label: 'Other', icon: '❓', color: '#84cc16', value: 'other' }
]

// Alias for compatibility with AdvancedAnalytics component
export const DISTRACTION_TYPES = DISTRACTION_CATEGORIES

// Task priority levels
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#10b981', bgcolor: '#f0fdf4' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', bgcolor: '#fffbeb' },
  { value: 'high', label: 'High', color: '#ef4444', bgcolor: '#fef2f2' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626', bgcolor: '#fef2f2' }
]

// Focus states for analytics
export const FOCUS_STATES = {
  EXCELLENT: 'excellent', // 90-100% completion
  GOOD: 'good',          // 70-89% completion
  AVERAGE: 'average',    // 50-69% completion
  POOR: 'poor'           // <50% completion
}

// Time periods for analytics
export const TIME_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
}

// Background sounds
export const BACKGROUND_SOUNDS = [
  { value: 'none', label: 'None', icon: '🔇' },
  { value: 'whitenoise', label: 'White Noise', icon: '🌊' },
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'cafe', label: 'Café Ambience', icon: '☕' },
  { value: 'forest', label: 'Forest', icon: '🌲' },
  { value: 'ocean', label: 'Ocean Waves', icon: '🌊' },
  { value: 'fireplace', label: 'Fireplace', icon: '🔥' }
]

// Motivational quotes
export const MOTIVATIONAL_QUOTES = [
  "Focus is not about doing more things. It's about doing the right things.",
  "The key to success is to focus our conscious mind on things we desire not things we fear.",
  "Concentration is the root of all the higher abilities in man.",
  "Focus on being productive instead of busy.",
  "Where focus goes, energy flows.",
  "The successful warrior is the average man with laser-like focus.",
  "Your focus determines your reality.",
  "Lack of direction, not lack of time, is the problem.",
  "It is during our darkest moments that we must focus to see the light.",
  "The ability to focus and be still, to really be present, is a gift.",
  "Success demands singleness of purpose.",
  "Focus on the solution, not on the problem.",
  "You can't depend on your eyes when your imagination is out of focus.",
  "Most people have no idea of the giant capacity we can immediately command when we focus all of our resources on mastering a single area of our lives.",
  "The art of being wise is knowing what to overlook."
]

// Achievement thresholds
export const ACHIEVEMENTS = {
  FIRST_SESSION: { id: 'first_session', title: 'Getting Started', description: 'Complete your first focus session' },
  STREAK_3: { id: 'streak_3', title: 'Consistency Builder', description: 'Complete 3 sessions in a row' },
  STREAK_7: { id: 'streak_7', title: 'Week Warrior', description: 'Complete 7 sessions in a row' },
  DAILY_GOAL: { id: 'daily_goal', title: 'Daily Champion', description: 'Reach your daily goal' },
  FOCUS_MASTER: { id: 'focus_master', title: 'Focus Master', description: 'Complete 100 total sessions' },
  DISTRACTION_FREE: { id: 'distraction_free', title: 'Zen Mode', description: 'Complete 5 sessions without logging distractions' }
}

// Default task structure for new tasks
export const DEFAULT_TASK = {
  title: '',
  description: '',
  priority: 'medium',
  estimatedPomodoros: 1,
  completedPomodoros: 0,
  status: 'todo', // todo, inprogress, done
  createdAt: null,
  updatedAt: null,
  projectId: null,
  tags: []
}

// Session storage keys
export const STORAGE_KEYS = {
  FOCUS_SETTINGS: 'focusmaster_settings',
  FOCUS_SESSIONS: 'focusmaster_sessions',
  FOCUS_TASKS: 'focusmaster_tasks',
  CURRENT_SESSION: 'focusmaster_current_session',
  ANALYTICS_DATA: 'focusmaster_analytics'
} 