import { 
  format, 
  subDays, 
  startOfDay, 
  endOfDay, 
  isWithinInterval,
  parseISO,
  eachDayOfInterval
} from 'date-fns'
import { 
  calculateHabitStreak, 
  calculateHabitConsistency, 
  calculateChoreCompletionRate,
  calculateProductivityScore,
  isHabitDueOnDate,
  isChoreScheduledOnDate
} from './calculations'

/**
 * Calculate overview metrics for dashboard
 */
export const calculateOverviewMetrics = (allData, timeRange = 7) => {
  const endDate = new Date()
  const startDate = subDays(endDate, timeRange - 1)
  
  // Tasks metrics
  const allTasks = allData.tasks.projects.flatMap(project => 
    (project.tasks || []).map(task => ({
      ...task,
      projectName: project.name
    }))
  )
  
  const completedTasks = allTasks.filter(task => {
    if (task.status !== 'done') return false
    if (!task.updatedAt) return false
    const taskDate = parseISO(task.updatedAt)
    return isWithinInterval(taskDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
  }).length

  // Chores metrics  
  const choreCompletions = allData.chores.chores.reduce((total, chore) => {
    if (!chore.doneDates) return total
    return total + chore.doneDates.filter(dateStr => {
      const choreDate = parseISO(dateStr)
      return isWithinInterval(choreDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
    }).length
  }, 0)

  // Habits metrics
  const habitCompletions = allData.habits.habits.reduce((total, habit) => {
    if (!habit.completions) return total
    return total + habit.completions.filter(completion => {
      const habitDate = parseISO(completion.date)
      return isWithinInterval(habitDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
    }).length
  }, 0)

  // Calculate current habit streaks
  const maxHabitStreak = Math.max(0, ...allData.habits.habits.map(habit => 
    calculateHabitStreak(habit)
  ))

  // Focus metrics
  const focusSessions = allData.focus.sessions.filter(session => {
    if (!session.startTime || !session.completed) return false
    const sessionDate = parseISO(session.startTime)
    return isWithinInterval(sessionDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
  })

  const totalFocusTime = focusSessions
    .filter(s => s.type === 'focus')
    .reduce((total, session) => total + (session.duration || 0), 0) / 60 // Convert to minutes

  // Calculate productivity score
  const productivityScore = calculateProductivityScore({
    taskCompletionRate: allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0,
    habitConsistency: calculateHabitConsistency(allData.habits.habits, timeRange),
    focusTimeMinutes: totalFocusTime,
    choreCompletionRate: calculateChoreCompletionRate(allData.chores.chores, timeRange),
    maxStreak: maxHabitStreak
  })

  return {
    totalTasks: allTasks.length,
    completedTasks,
    totalChores: allData.chores.chores.length,
    choreCompletions,
    totalHabits: allData.habits.habits.length,
    habitCompletions,
    maxHabitStreak,
    totalFocusSessions: focusSessions.length,
    totalFocusTime: Math.round(totalFocusTime),
    productivityScore: Math.round(productivityScore),
    timeRange
  }
}

/**
 * Get weekly trend data for charts
 */
export const getWeeklyTrendData = (allData, weeks = 4) => {
  const trendData = []
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = subDays(new Date(), i * 7)
    const weekStart = subDays(weekEnd, 6)
    
    const weekMetrics = calculateOverviewMetrics(allData, 7)
    
    trendData.push({
      week: format(weekStart, 'MMM dd'),
      tasks: weekMetrics.completedTasks,
      chores: weekMetrics.choreCompletions,
      habits: weekMetrics.habitCompletions,
      focus: weekMetrics.totalFocusTime,
      productivity: weekMetrics.productivityScore
    })
  }
  
  return trendData
}

/**
 * Get task analytics data
 */
export const getTaskAnalytics = (tasksData, timeRange = 30) => {
  const allTasks = tasksData.projects.flatMap(project => 
    (project.tasks || []).map(task => ({
      ...task,
      projectName: project.name,
      projectId: project.id
    }))
  )

  const endDate = new Date()
  const startDate = subDays(endDate, timeRange - 1)

  // Task completion by project
  const projectStats = tasksData.projects.map(project => ({
    name: project.name,
    total: project.tasks?.length || 0,
    completed: project.tasks?.filter(t => t.status === 'done')?.length || 0,
    inProgress: project.tasks?.filter(t => t.status === 'inprogress')?.length || 0,
    todo: project.tasks?.filter(t => t.status === 'todo')?.length || 0
  }))

  // Priority distribution
  const priorityStats = ['low', 'medium', 'high', 'urgent'].map(priority => ({
    priority,
    count: allTasks.filter(t => t.priority === priority).length
  }))

  // Daily completion trend
  const dailyData = eachDayOfInterval({ start: startDate, end: endDate }).map(day => ({
    date: format(day, 'MMM dd'),
    completed: allTasks.filter(task => {
      if (task.status !== 'done' || !task.updatedAt) return false
      const taskDate = parseISO(task.updatedAt)
      return taskDate.toDateString() === day.toDateString()
    }).length
  }))

  return {
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter(t => t.status === 'done').length,
    inProgressTasks: allTasks.filter(t => t.status === 'inprogress').length,
    todoTasks: allTasks.filter(t => t.status === 'todo').length,
    projectStats,
    priorityStats,
    dailyData,
    completionRate: allTasks.length > 0 ? 
      (allTasks.filter(t => t.status === 'done').length / allTasks.length) * 100 : 0
  }
}

/**
 * Get habit analytics data
 */
export const getHabitAnalytics = (habitsData, timeRange = 30) => {
  const habits = habitsData.habits
  const endDate = new Date()
  const startDate = subDays(endDate, timeRange - 1)

  // Calculate streaks for all habits
  const habitStreaks = habits.map(habit => ({
    name: habit.name,
    currentStreak: calculateHabitStreak(habit),
    category: habit.category || 'other'
  }))

  // Category breakdown
  const categoryStats = {}
  habits.forEach(habit => {
    const category = habit.category || 'other'
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, active: 0 }
    }
    categoryStats[category].total++
  })

  // Daily completion rate
  const dailyData = eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    let totalDue = 0
    let totalCompleted = 0
    
    habits.forEach(habit => {
      if (isHabitDueOnDate(habit, day)) {
        totalDue++
        if (habit.completions?.some(c => c.date === dayStr)) {
          totalCompleted++
        }
      }
    })
    
    return {
      date: format(day, 'MMM dd'),
      completionRate: totalDue > 0 ? (totalCompleted / totalDue) * 100 : 0,
      completed: totalCompleted,
      due: totalDue
    }
  })

  return {
    totalHabits: habits.length,
    maxStreak: Math.max(0, ...habitStreaks.map(h => h.currentStreak)),
    avgStreak: habitStreaks.length > 0 ? 
      Math.round(habitStreaks.reduce((sum, h) => sum + h.currentStreak, 0) / habitStreaks.length) : 0,
    habitStreaks,
    categoryStats,
    dailyData,
    overallConsistency: calculateHabitConsistency(habits, timeRange)
  }
}

/**
 * Get focus analytics data  
 */
export const getFocusAnalytics = (focusData, timeRange = 30) => {
  const sessions = focusData.sessions
  const endDate = new Date()
  const startDate = subDays(endDate, timeRange - 1)

  const sessionsInRange = sessions.filter(session => {
    if (!session.startTime) return false
    const sessionDate = parseISO(session.startTime)
    return isWithinInterval(sessionDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
  })

  const focusSessions = sessionsInRange.filter(s => s.type === 'focus')
  const completedSessions = focusSessions.filter(s => s.completed)

  // Daily session data
  const dailyData = eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
    const daySessions = focusSessions.filter(session => {
      const sessionDate = parseISO(session.startTime)
      return sessionDate.toDateString() === day.toDateString()
    })
    
    const completedDaySessions = daySessions.filter(s => s.completed)
    
    return {
      date: format(day, 'MMM dd'),
      sessions: daySessions.length,
      completed: completedDaySessions.length,
      totalTime: completedDaySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60 // minutes
    }
  })

  return {
    totalSessions: focusSessions.length,
    completedSessions: completedSessions.length,
    totalFocusTime: Math.round(completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60),
    avgSessionLength: completedSessions.length > 0 ? 
      Math.round(completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length / 60) : 0,
    completionRate: focusSessions.length > 0 ? 
      (completedSessions.length / focusSessions.length) * 100 : 0,
    dailyData
  }
}

/**
 * Get chore analytics data
 */
export const getChoreAnalytics = (choresData, timeRange = 30) => {
  const chores = choresData.chores
  const endDate = new Date()
  const startDate = subDays(endDate, timeRange - 1)

  // Section breakdown
  const sectionStats = {}
  chores.forEach(chore => {
    const section = chore.section || 'Other'
    if (!sectionStats[section]) {
      sectionStats[section] = { total: 0, completed: 0 }
    }
    sectionStats[section].total++
    
    // Count completions in time range
    const completions = chore.doneDates?.filter(dateStr => {
      const choreDate = parseISO(dateStr)
      return isWithinInterval(choreDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
    })?.length || 0
    
    sectionStats[section].completed += completions
  })

  // Daily completion data
  const dailyData = eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
    let totalDue = 0
    let totalCompleted = 0
    
    chores.forEach(chore => {
      if (isChoreScheduledOnDate(chore, day)) {
        totalDue++
        const dayStr = day.toISOString()
        if (chore.doneDates?.includes(dayStr)) {
          totalCompleted++
        }
      }
    })
    
    return {
      date: format(day, 'MMM dd'),
      completed: totalCompleted,
      due: totalDue,
      completionRate: totalDue > 0 ? (totalCompleted / totalDue) * 100 : 0
    }
  })

  return {
    totalChores: chores.length,
    totalCompletions: Object.values(sectionStats).reduce((sum, section) => sum + section.completed, 0),
    sectionStats,
    dailyData,
    completionRate: calculateChoreCompletionRate(chores, timeRange)
  }
} 