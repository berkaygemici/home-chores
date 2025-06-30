// Email utility functions for HabitMaster
import { auth } from '../../firebase'

// Your Firebase Cloud Functions URLs - update these after deployment
const FIREBASE_FUNCTIONS_BASE_URL = 'https://us-central1-home-chores-217b8.cloudfunctions.net/sendTestHabitReminder'

/**
 * Send a test habit reminder email for the current user
 * @returns {Promise} - Promise that resolves with email sending result
 */
export const sendTestHabitReminder = async () => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/sendTestHabitReminder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: user.uid
    })
  })

  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to send test email')
  }
  
  return result
}

/**
 * Get the status of daily habit reminders for a user
 * This could be extended to check user preferences for email notifications
 * @returns {Object} - Email notification preferences
 */
export const getEmailNotificationStatus = () => {
  // For now, return default enabled status
  // In the future, this could check user preferences from Firestore
  return {
    enabled: true,
    time: '15:00',
    timezone: 'Europe/Berlin',
    lastSent: null // Could track when last email was sent
  }
}

/**
 * Format habit data for email preview
 * @param {Array} habits - Array of habit objects
 * @returns {Object} - Formatted data for email preview
 */
export const formatHabitEmailPreview = (habits) => {
  const now = new Date()
  
  const isHabitDueToday = (habit) => {
    const dayOfWeek = now.getDay()
    const dayOfMonth = now.getDate()
    
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
        const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
        return daysDiff % habit.customInterval === 0
      default:
        return true
    }
  }

  const isHabitCompletedToday = (habit) => {
    const today = now.toISOString().split('T')[0]
    return habit.completions && habit.completions.some(completion => 
      completion.date === today
    )
  }

  const dueTodayHabits = habits.filter(habit => 
    isHabitDueToday(habit) && !isHabitCompletedToday(habit)
  )
  
  const completedTodayHabits = habits.filter(habit => 
    isHabitDueToday(habit) && isHabitCompletedToday(habit)
  )

  return {
    totalHabits: habits.length,
    completedToday: completedTodayHabits.length,
    pendingToday: dueTodayHabits.length,
    dueTodayHabits,
    completedTodayHabits,
    wouldSendEmail: dueTodayHabits.length > 0 || completedTodayHabits.length > 0
  }
} 