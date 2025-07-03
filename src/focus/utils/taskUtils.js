import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { DEFAULT_TASK, TASK_PRIORITIES } from '../constants/focusConstants'

/**
 * Get all projects and tasks from TaskMaster
 */
export const getTaskMasterData = async (userId) => {
  try {
    const projectDoc = await getDoc(doc(db, 'taskmaster_projects', userId))
    if (projectDoc.exists()) {
      const { projects = [] } = projectDoc.data()
      return projects
    }
    return []
  } catch (error) {
    console.error('Failed to load TaskMaster projects:', error)
    return []
  }
}

/**
 * Get all tasks from TaskMaster projects
 */
export const getAllTaskMasterTasks = async (userId) => {
  const projects = await getTaskMasterData(userId)
  const allTasks = []
  
  projects.forEach(project => {
    if (project.tasks && Array.isArray(project.tasks)) {
      project.tasks.forEach(task => {
        allTasks.push({
          ...task,
          projectId: project.id,
          projectName: project.name,
          source: 'taskmaster'
        })
      })
    }
  })
  
  return allTasks
}

/**
 * Get tasks suitable for focus sessions (todo and inprogress)
 */
export const getFocusableTasks = async (userId) => {
  const allTasks = await getAllTaskMasterTasks(userId)
  return allTasks.filter(task => 
    task.status === 'todo' || task.status === 'inprogress'
  )
}

/**
 * Create a new task in TaskMaster
 */
export const createTaskInTaskMaster = async (userId, projectId, taskData, currentUser) => {
  try {
    const projects = await getTaskMasterData(userId)
    const projectIndex = projects.findIndex(p => p.id === projectId)
    
    if (projectIndex === -1) {
      throw new Error('Project not found')
    }
    
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description || '',
      status: 'todo',
      assignee: taskData.assignee || null,
      reporter: currentUser,
      priority: taskData.priority || 'medium',
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const updatedProjects = [...projects]
    updatedProjects[projectIndex] = {
      ...updatedProjects[projectIndex],
      tasks: [...(updatedProjects[projectIndex].tasks || []), newTask]
    }
    
    await setDoc(doc(db, 'taskmaster_projects', userId), { projects: updatedProjects }, { merge: true })
    
    return {
      ...newTask,
      projectId,
      projectName: updatedProjects[projectIndex].name,
      source: 'taskmaster'
    }
  } catch (error) {
    console.error('Failed to create task in TaskMaster:', error)
    throw error
  }
}

/**
 * Update task status in TaskMaster
 */
export const updateTaskInTaskMaster = async (userId, taskId, projectId, updates) => {
  try {
    const projects = await getTaskMasterData(userId)
    const projectIndex = projects.findIndex(p => p.id === projectId)
    
    if (projectIndex === -1) {
      throw new Error('Project not found')
    }
    
    const project = projects[projectIndex]
    const taskIndex = project.tasks.findIndex(t => t.id === taskId)
    
    if (taskIndex === -1) {
      throw new Error('Task not found')
    }
    
    const updatedProjects = [...projects]
    updatedProjects[projectIndex] = {
      ...project,
      tasks: project.tasks.map((task, index) => 
        index === taskIndex 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    }
    
    await setDoc(doc(db, 'taskmaster_projects', userId), { projects: updatedProjects }, { merge: true })
    
    return updatedProjects[projectIndex].tasks[taskIndex]
  } catch (error) {
    console.error('Failed to update task in TaskMaster:', error)
    throw error
  }
}

/**
 * Get focus-specific task data from Firebase
 */
export const getFocusTasks = async (userId) => {
  try {
    const focusDoc = await getDoc(doc(db, 'focusmaster_tasks', userId))
    if (focusDoc.exists()) {
      return focusDoc.data().tasks || []
    }
    return []
  } catch (error) {
    console.error('Failed to load focus tasks:', error)
    return []
  }
}

/**
 * Save focus-specific task data to Firebase
 */
export const saveFocusTasks = async (userId, tasks) => {
  try {
    await setDoc(doc(db, 'focusmaster_tasks', userId), { tasks }, { merge: true })
  } catch (error) {
    console.error('Failed to save focus tasks:', error)
    throw error
  }
}

/**
 * Create a new focus-only task
 */
export const createFocusTask = (taskData) => {
  return {
    ...DEFAULT_TASK,
    id: `focus_${Date.now()}`,
    title: taskData.title,
    description: taskData.description || '',
    priority: taskData.priority || 'medium',
    estimatedPomodoros: taskData.estimatedPomodoros || 1,
    tags: taskData.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'focusmaster'
  }
}

/**
 * Update a focus task
 */
export const updateFocusTask = (task, updates) => {
  return {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  }
}

/**
 * Complete a pomodoro for a task
 */
export const completeTaskPomodoro = (task) => {
  const completedPomodoros = (task.completedPomodoros || 0) + 1
  const updates = {
    completedPomodoros,
    updatedAt: new Date().toISOString()
  }
  
  // Auto-complete task if all pomodoros are done
  if (completedPomodoros >= (task.estimatedPomodoros || 1)) {
    updates.status = 'done'
  } else if (task.status === 'todo') {
    updates.status = 'inprogress'
  }
  
  return updateFocusTask(task, updates)
}

/**
 * Get task priority configuration
 */
export const getTaskPriorityConfig = (priority) => {
  return TASK_PRIORITIES.find(p => p.value === priority) || TASK_PRIORITIES[1]
}

/**
 * Filter tasks by status
 */
export const filterTasksByStatus = (tasks, status) => {
  return tasks.filter(task => task.status === status)
}

/**
 * Sort tasks by priority
 */
export const sortTasksByPriority = (tasks) => {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
  return [...tasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority] || 2
    const bPriority = priorityOrder[b.priority] || 2
    return bPriority - aPriority
  })
}

/**
 * Sort tasks by creation date (newest first)
 */
export const sortTasksByDate = (tasks) => {
  return [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Search tasks by title or description
 */
export const searchTasks = (tasks, query) => {
  if (!query.trim()) return tasks
  
  const lowercaseQuery = query.toLowerCase()
  return tasks.filter(task =>
    task.title.toLowerCase().includes(lowercaseQuery) ||
    (task.description && task.description.toLowerCase().includes(lowercaseQuery))
  )
}

/**
 * Get task progress percentage
 */
export const getTaskProgress = (task) => {
  const completed = task.completedPomodoros || 0
  const estimated = task.estimatedPomodoros || 1
  return Math.round((completed / estimated) * 100)
}

/**
 * Estimate task completion time
 */
export const estimateTaskTime = (task, pomodoroLength = 25) => {
  const remaining = Math.max(0, (task.estimatedPomodoros || 1) - (task.completedPomodoros || 0))
  return remaining * pomodoroLength // in minutes
}

/**
 * Check if task is overdue (has been in progress for more than estimated time)
 */
export const isTaskOverdue = (task, pomodoroLength = 25) => {
  if (task.status !== 'inprogress' || !task.updatedAt) return false
  
  const daysSinceUpdate = Math.floor(
    (new Date() - new Date(task.updatedAt)) / (1000 * 60 * 60 * 24)
  )
  const estimatedDays = Math.ceil((task.estimatedPomodoros || 1) * pomodoroLength / 60 / 8) // 8 hours per day
  
  return daysSinceUpdate > estimatedDays * 2 // Consider overdue if 2x estimated time
}

/**
 * Get task tags
 */
export const getUniqueTaskTags = (tasks) => {
  const allTags = tasks.flatMap(task => task.tags || [])
  return [...new Set(allTags)].sort()
}

/**
 * Filter tasks by tag
 */
export const filterTasksByTag = (tasks, tag) => {
  return tasks.filter(task => task.tags && task.tags.includes(tag))
}

/**
 * Get task statistics
 */
export const getTaskStatistics = (tasks) => {
  const total = tasks.length
  const todo = tasks.filter(t => t.status === 'todo').length
  const inProgress = tasks.filter(t => t.status === 'inprogress').length
  const done = tasks.filter(t => t.status === 'done').length
  
  const totalPomodoros = tasks.reduce((sum, t) => sum + (t.estimatedPomodoros || 1), 0)
  const completedPomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)
  
  return {
    total,
    todo,
    inProgress,
    done,
    completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    totalPomodoros,
    completedPomodoros,
    pomodoroCompletionRate: totalPomodoros > 0 ? Math.round((completedPomodoros / totalPomodoros) * 100) : 0
  }
} 