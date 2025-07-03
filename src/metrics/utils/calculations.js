import { 
  format, 
  subDays, 
  startOfDay, 
  endOfDay, 
  isWithinInterval,
  parseISO,
  differenceInDays,
  eachDayOfInterval
} from 'date-fns'
import { PRODUCTIVITY_WEIGHTS } from '../constants/metricsConstants'

/**
 * Calculate habit streak for a single habit
 */
export const calculateHabitStreak = (habit) => {
  if (!habit.completions || habit.completions.length === 0) return 0

  const sortedCompletions = habit.completions
    .map(completion => startOfDay(parseISO(completion.date)))
    .sort((a, b) => b - a) // Sort descending (most recent first)

  let currentStreak = 0
  let currentDate = startOfDay(new Date())
  
  // Check if today is completed, if not start from yesterday
  const todayCompleted = sortedCompletions.some(date => 
    date.getTime() === currentDate.getTime()
  )
  
  if (!todayCompleted) {
    currentDate = subDays(currentDate, 1)
  }

  for (const completionDate of sortedCompletions) {
    if (completionDate.getTime() === currentDate.getTime()) {
      currentStreak++
      currentDate = subDays(currentDate, 1)
    } else if (completionDate < currentDate) {
      break // Gap found, streak ends
    }
  }

  return currentStreak
}

/**
 * Check if habit is due on a specific date
 */
export const isHabitDueOnDate = (habit, date) => {
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
      const createdDate = parseISO(habit.createdAt)
      const daysDiff = differenceInDays(date, createdDate)
      return daysDiff >= 0 && daysDiff % habit.customInterval === 0
    default:
      return true
  }
}

/**
 * Check if chore is scheduled on a specific date
 */
export const isChoreScheduledOnDate = (chore, date) => {
  if (!chore.dateTime) return false
  
  const choreStart = parseISO(chore.dateTime)
  if (date < choreStart) return false
  
  switch (chore.repeat) {
    case 'none':
      return date.toDateString() === choreStart.toDateString()
    case 'daily':
      return true
    case 'weekly':
      return date.getDay() === choreStart.getDay()
    case 'monthly':
      return date.getDate() === choreStart.getDate()
    case 'yearly':
      return date.getMonth() === choreStart.getMonth() && 
             date.getDate() === choreStart.getDate()
    case 'weekdays':
      return ![0, 6].includes(date.getDay()) // Monday-Friday
    default:
      return false
  }
}

/**
 * Calculate habit consistency percentage over time period
 */
export const calculateHabitConsistency = (habits, timeRange = 7) => {
  if (habits.length === 0) return 0
  
  const endDate = new Date()
  const startDate = subDays(endDate, timeRange - 1)
  
  let totalExpected = 0
  let totalCompleted = 0
  
  habits.forEach(habit => {
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate })
    
    daysInRange.forEach(day => {
      const isDue = isHabitDueOnDate(habit, day)
      if (isDue) {
        totalExpected++
        
        const dayStr = format(day, 'yyyy-MM-dd')
        const isCompleted = habit.completions?.some(c => c.date === dayStr)
        if (isCompleted) {
          totalCompleted++
        }
      }
    })
  })
  
  return totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0
}

/**
 * Calculate chore completion rate
 */
export const calculateChoreCompletionRate = (chores, timeRange = 7) => {
  if (chores.length === 0) return 0
  
  const endDate = new Date()
  const startDate = subDays(endDate, timeRange - 1)
  
  let totalExpected = 0
  let totalCompleted = 0
  
  chores.forEach(chore => {
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate })
    
    daysInRange.forEach(day => {
      const isDue = isChoreScheduledOnDate(chore, day)
      if (isDue) {
        totalExpected++
        
        const dayStr = day.toISOString()
        const isCompleted = chore.doneDates?.includes(dayStr)
        if (isCompleted) {
          totalCompleted++
        }
      }
    })
  })
  
  return totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0
}

/**
 * Calculate overall productivity score
 */
export const calculateProductivityScore = (metrics) => {
  const {
    taskCompletionRate = 0,
    habitConsistency = 0, 
    focusTimeMinutes = 0,
    choreCompletionRate = 0,
    maxStreak = 0
  } = metrics

  // Normalize focus time (target: 2 hours = 120 minutes = 100%)
  const normalizedFocusTime = Math.min(100, (focusTimeMinutes / 120) * 100)
  
  // Calculate base score
  let score = (
    taskCompletionRate * PRODUCTIVITY_WEIGHTS.taskCompletion +
    habitConsistency * PRODUCTIVITY_WEIGHTS.habitConsistency +
    normalizedFocusTime * PRODUCTIVITY_WEIGHTS.focusTime +
    choreCompletionRate * PRODUCTIVITY_WEIGHTS.choreCompletion
  )
  
  // Add streak bonus (up to 10% bonus)
  const streakBonus = Math.min(10, maxStreak * 0.5) // 0.5% per day streak, max 10%
  score += streakBonus
  
  return Math.min(100, Math.max(0, score))
}

/**
 * Get productivity score message based on score
 */
export const getProductivityMessage = (score) => {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'  
  if (score >= 50) return 'average'
  return 'needsWork'
} 