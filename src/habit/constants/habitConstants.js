// Habit categories
export const HABIT_CATEGORIES = [
  { id: 'health', name: 'Health & Fitness', color: '#10b981', icon: '🏃‍♂️' },
  { id: 'learning', name: 'Learning', color: '#3b82f6', icon: '📚' },
  { id: 'productivity', name: 'Productivity', color: '#8b5cf6', icon: '⚡' },
  { id: 'mindfulness', name: 'Mindfulness', color: '#06b6d4', icon: '🧘‍♀️' },
  { id: 'social', name: 'Social', color: '#f59e0b', icon: '👥' },
  { id: 'creativity', name: 'Creativity', color: '#ef4444', icon: '🎨' },
  { id: 'lifestyle', name: 'Lifestyle', color: '#84cc16', icon: '🌱' },
  { id: 'other', name: 'Other', color: '#6b7280', icon: '📝' }
]

// Habit frequencies
export const HABIT_FREQUENCIES = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Specific days of the week' },
  { value: 'monthly', label: 'Monthly', description: 'Specific days of the month' },
  { value: 'custom', label: 'Custom', description: 'Custom interval' }
]

// Days of the week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
]

// Habit difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: '#10b981', description: 'Low effort required' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', description: 'Moderate effort' },
  { value: 'hard', label: 'Hard', color: '#ef4444', description: 'High effort required' }
]

// Default habit suggestions
export const HABIT_SUGGESTIONS = [
  { name: 'Drink 8 glasses of water', category: 'health', difficulty: 'easy' },
  { name: 'Read for 30 minutes', category: 'learning', difficulty: 'medium' },
  { name: 'Exercise for 30 minutes', category: 'health', difficulty: 'medium' },
  { name: 'Meditate for 10 minutes', category: 'mindfulness', difficulty: 'easy' },
  { name: 'Write in journal', category: 'creativity', difficulty: 'easy' },
  { name: 'Learn a new language', category: 'learning', difficulty: 'hard' },
  { name: 'Take a walk', category: 'health', difficulty: 'easy' },
  { name: 'Practice gratitude', category: 'mindfulness', difficulty: 'easy' },
  { name: 'Call a friend or family member', category: 'social', difficulty: 'easy' },
  { name: 'Organize workspace', category: 'productivity', difficulty: 'medium' }
]

// Streak milestones for celebrating achievements
export const STREAK_MILESTONES = [
  { days: 3, title: 'Getting Started!', reward: '🌱' },
  { days: 7, title: 'One Week Strong!', reward: '⭐' },
  { days: 14, title: 'Two Weeks Champion!', reward: '🏆' },
  { days: 30, title: 'Monthly Master!', reward: '🎯' },
  { days: 60, title: 'Momentum Builder!', reward: '🚀' },
  { days: 100, title: 'Century Club!', reward: '💎' },
  { days: 365, title: 'Year-Long Legend!', reward: '👑' }
] 