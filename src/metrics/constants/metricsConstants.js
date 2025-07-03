// App theme colors and branding
export const APP_COLORS = {
  chores: '#10b981',      // Green
  tasks: '#3b82f6',       // Blue  
  habits: '#8b5cf6',      // Purple
  focus: '#f59e0b',       // Orange
  overview: '#06b6d4',    // Cyan
  primary: '#1e293b',     // Dark slate
  secondary: '#64748b',   // Slate
  background: '#f8fafc',  // Light blue-gray
  surface: '#ffffff'      // White
}

// App icons and names
export const APP_CONFIG = {
  chores: {
    name: 'ChoresMaster',
    icon: '🧹',
    color: APP_COLORS.chores,
    description: 'Home task management'
  },
  tasks: {
    name: 'TaskMaster', 
    icon: '✅',
    color: APP_COLORS.tasks,
    description: 'Project & task tracking'
  },
  habits: {
    name: 'HabitMaster',
    icon: '🎯', 
    color: APP_COLORS.habits,
    description: 'Daily habit building'
  },
  focus: {
    name: 'FocusMaster',
    icon: '🍅',
    color: APP_COLORS.focus,
    description: 'Pomodoro & deep work'
  }
}

// Productivity score calculation weights
export const PRODUCTIVITY_WEIGHTS = {
  taskCompletion: 0.25,        // 25% - Task completion rate
  habitConsistency: 0.25,      // 25% - Habit completion rate  
  focusTime: 0.25,            // 25% - Daily focus session achievement
  choreCompletion: 0.15,      // 15% - Chore completion rate
  streakBonus: 0.10           // 10% - Streak bonus multiplier
}

// Time periods for analytics
export const TIME_PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 2 weeks' },
  { value: 30, label: 'Last month' },
  { value: 90, label: 'Last 3 months' },
  { value: 365, label: 'Last year' }
]

// Chart color palettes
export const CHART_COLORS = {
  primary: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'],
  productivity: ['#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#7c3aed'],
  trends: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
  status: {
    completed: '#10b981',
    pending: '#f59e0b', 
    overdue: '#ef4444',
    inactive: '#94a3b8'
  }
}

// Dashboard widget configurations
export const WIDGET_CONFIGS = {
  overview: {
    totalTasks: { icon: '📝', color: APP_COLORS.tasks },
    totalChores: { icon: '🧹', color: APP_COLORS.chores },
    habitStreak: { icon: '🔥', color: APP_COLORS.habits },
    focusTime: { icon: '⏱️', color: APP_COLORS.focus },
    productivityScore: { icon: '📊', color: APP_COLORS.primary }
  },
  tasks: {
    completion: { icon: '✅', color: APP_COLORS.tasks },
    projects: { icon: '📁', color: '#059669' },
    overdue: { icon: '⚠️', color: '#ef4444' },
    avgTime: { icon: '⏰', color: '#8b5cf6' }
  },
  habits: {
    streaks: { icon: '🔥', color: '#f59e0b' },
    consistency: { icon: '📈', color: APP_COLORS.habits },
    categories: { icon: '🏷️', color: '#059669' },
    completion: { icon: '✨', color: '#06b6d4' }
  },
  focus: {
    sessions: { icon: '🍅', color: APP_COLORS.focus },
    duration: { icon: '⏱️', color: '#059669' },
    distractions: { icon: '📱', color: '#ef4444' },
    productivity: { icon: '🎯', color: APP_COLORS.focus }
  },
  chores: {
    completion: { icon: '🧹', color: APP_COLORS.chores },
    sections: { icon: '🏠', color: '#059669' },
    frequency: { icon: '📅', color: '#8b5cf6' },
    missed: { icon: '⏰', color: '#ef4444' }
  }
}

// Motivational messages for different score ranges
export const PRODUCTIVITY_MESSAGES = {
  excellent: [
    "🚀 You're absolutely crushing it! Keep up the amazing work!",
    "🌟 Outstanding productivity! You're in the zone!",
    "💎 Diamond-level performance! You're an inspiration!",
    "🏆 Top-tier productivity achieved! You're unstoppable!"
  ],
  good: [
    "💪 Great momentum! You're doing really well!",
    "🎯 Solid progress! Keep building those good habits!",
    "✨ Nice work! You're staying consistent!",
    "🌱 Growing strong! Your efforts are paying off!"
  ],
  average: [
    "📈 Steady progress! Every step counts!",
    "🎯 You're on track! Keep pushing forward!",
    "💫 Building momentum! Small wins add up!",
    "🌟 Good foundation! Ready to level up?"
  ],
  needsWork: [
    "🌱 Fresh start energy! Let's build something great!",
    "💪 Every champion starts somewhere! You've got this!",
    "🎯 Time to focus! Small steps lead to big wins!",
    "🔥 Ready to ignite your productivity? Let's go!"
  ]
}

// Export data formats
export const EXPORT_FORMATS = {
  csv: { 
    label: 'CSV', 
    extension: '.csv',
    mimeType: 'text/csv'
  },
  json: { 
    label: 'JSON', 
    extension: '.json',
    mimeType: 'application/json'
  },
  pdf: { 
    label: 'PDF', 
    extension: '.pdf',
    mimeType: 'application/pdf'
  }
}

// Achievement thresholds
export const ACHIEVEMENTS = {
  productivity: {
    bronze: 60,
    silver: 75, 
    gold: 85,
    platinum: 95
  },
  streaks: {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365
  },
  focus: {
    novice: 10,      // 10 sessions
    intermediate: 50,  // 50 sessions
    expert: 100,     // 100 sessions
    master: 500      // 500 sessions
  }
} 