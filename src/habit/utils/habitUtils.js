import { format, isToday, startOfDay, differenceInDays, parseISO, isSameDay } from 'date-fns'

// Calculate current streak for a habit
export const calculateStreak = (habit) => {
  if (!habit.completions || habit.completions.length === 0) {
    return 0
  }

  const sortedCompletions = habit.completions
    .map(completion => startOfDay(parseISO(completion.date)))
    .sort((a, b) => b - a) // Sort descending (most recent first)

  let currentStreak = 0
  let currentDate = startOfDay(new Date())
  
  // If today is not completed, start from yesterday
  const todayCompleted = sortedCompletions.some(date => isSameDay(date, currentDate))
  if (!todayCompleted) {
    currentDate.setDate(currentDate.getDate() - 1)
  }

  for (const completionDate of sortedCompletions) {
    if (isSameDay(completionDate, currentDate)) {
      currentStreak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (completionDate < currentDate) {
      // Gap found, streak ends
      break
    }
  }

  return currentStreak
}

// Calculate longest streak for a habit
export const calculateLongestStreak = (habit) => {
  if (!habit.completions || habit.completions.length === 0) {
    return 0
  }

  const sortedCompletions = habit.completions
    .map(completion => startOfDay(parseISO(completion.date)))
    .sort((a, b) => a - b) // Sort ascending

  let longestStreak = 1
  let currentStreak = 1

  for (let i = 1; i < sortedCompletions.length; i++) {
    const prevDate = sortedCompletions[i - 1]
    const currentDate = sortedCompletions[i]
    const daysDiff = differenceInDays(currentDate, prevDate)

    if (daysDiff === 1) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return longestStreak
}

// Check if habit is completed today
export const isHabitCompletedToday = (habit) => {
  if (!habit.completions) return false
  
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  return habit.completions.some(completion => 
    format(parseISO(completion.date), 'yyyy-MM-dd') === todayStr
  )
}

// Check if habit is due today based on frequency
export const isHabitDueToday = (habit) => {
  const today = new Date()
  const todayDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.

  switch (habit.frequency) {
    case 'daily':
      return true
    case 'weekly':
      return habit.weeklyDays && habit.weeklyDays.includes(todayDay)
    case 'monthly':
      const todayDate = today.getDate()
      return habit.monthlyDays && habit.monthlyDays.includes(todayDate)
    case 'custom':
      // For custom frequency, check if enough time has passed since last completion
      if (!habit.completions || habit.completions.length === 0) return true
      
      const lastCompletion = habit.completions
        .map(c => parseISO(c.date))
        .sort((a, b) => b - a)[0] // Most recent completion
      
      const daysSinceLastCompletion = differenceInDays(today, lastCompletion)
      return daysSinceLastCompletion >= (habit.customInterval || 1)
    default:
      return true
  }
}

// Get completion rate for a habit (percentage)
export const getCompletionRate = (habit, days = 30) => {
  if (!habit.completions) return 0

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Count expected days based on habit frequency
  let expectedDays = 0
  let actualCompletions = 0

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const tempHabit = { ...habit } // Create temp habit to check if due on this day
    
    if (isHabitDueOnDate(tempHabit, d)) {
      expectedDays++
      
      // Check if completed on this day
      const dateStr = format(d, 'yyyy-MM-dd')
      if (habit.completions.some(c => format(parseISO(c.date), 'yyyy-MM-dd') === dateStr)) {
        actualCompletions++
      }
    }
  }

  return expectedDays > 0 ? Math.round((actualCompletions / expectedDays) * 100) : 0
}

// Helper function to check if habit is due on a specific date
const isHabitDueOnDate = (habit, date) => {
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
      // For custom, this is more complex - we'd need the creation date and interval
      // For simplicity, assume it's due every customInterval days
      const daysSinceCreation = differenceInDays(date, parseISO(habit.createdAt))
      return daysSinceCreation % (habit.customInterval || 1) === 0
    default:
      return true
  }
}

// Get next milestone for a habit
export const getNextMilestone = (currentStreak) => {
  const milestones = [3, 7, 14, 30, 60, 100, 365]
  return milestones.find(milestone => milestone > currentStreak) || null
}

// Generate habit analytics data
export const generateHabitAnalytics = (habits) => {
  const totalHabits = habits.length
  const completedToday = habits.filter(isHabitCompletedToday).length
  const dueToday = habits.filter(isHabitDueToday).length
  
  const streaks = habits.map(calculateStreak)
  const longestCurrentStreak = Math.max(...streaks, 0)
  const averageStreak = streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0
  
  const completionRates = habits.map(habit => getCompletionRate(habit, 30))
  const averageCompletionRate = completionRates.length > 0 ? 
    Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length) : 0

  return {
    totalHabits,
    completedToday,
    dueToday,
    longestCurrentStreak,
    averageStreak,
    averageCompletionRate,
    completionPercentage: dueToday > 0 ? Math.round((completedToday / dueToday) * 100) : 0
  }
}

// Sort habits by various criteria
export const sortHabits = (habits, sortBy = 'name') => {
  switch (sortBy) {
    case 'name':
      return [...habits].sort((a, b) => a.name.localeCompare(b.name))
    case 'streak':
      return [...habits].sort((a, b) => calculateStreak(b) - calculateStreak(a))
    case 'completion':
      return [...habits].sort((a, b) => getCompletionRate(b) - getCompletionRate(a))
    case 'created':
      return [...habits].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    case 'category':
      return [...habits].sort((a, b) => a.category.localeCompare(b.category))
    default:
      return habits
  }
} 