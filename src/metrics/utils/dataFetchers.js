import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'

/**
 * Fetch all data from all productivity apps
 */
export const fetchAllAppsData = async (userId) => {
  try {
    const [choresDoc, tasksDoc, habitsDoc, focusSessionsDoc] = await Promise.all([
      getDoc(doc(db, 'chores', userId)),
      getDoc(doc(db, 'taskmaster_projects', userId)),
      getDoc(doc(db, 'habitmaster_habits', userId)),
      getDoc(doc(db, 'focusmaster_sessions', userId))
    ])

    return {
      chores: {
        chores: choresDoc.exists() ? choresDoc.data().chores || [] : []
      },
      tasks: {
        projects: tasksDoc.exists() ? tasksDoc.data().projects || [] : []
      },
      habits: {
        habits: habitsDoc.exists() ? habitsDoc.data().habits || [] : []
      },
      focus: {
        sessions: focusSessionsDoc.exists() ? focusSessionsDoc.data().sessions || [] : []
      }
    }
  } catch (error) {
    console.error('Failed to fetch apps data:', error)
    return {
      chores: { chores: [] },
      tasks: { projects: [] },
      habits: { habits: [] },
      focus: { sessions: [] }
    }
  }
}

/**
 * Fetch chores data specifically
 */
export const fetchChoresData = async (userId) => {
  try {
    const [choresDoc, sectionsDoc] = await Promise.all([
      getDoc(doc(db, 'chores', userId)),
      getDoc(doc(db, 'sections', userId))
    ])

    return {
      chores: choresDoc.exists() ? choresDoc.data().chores || [] : [],
      sections: sectionsDoc.exists() ? sectionsDoc.data().sections || [] : []
    }
  } catch (error) {
    console.error('Failed to fetch chores data:', error)
    return { chores: [], sections: [] }
  }
}

/**
 * Fetch tasks data specifically
 */
export const fetchTasksData = async (userId) => {
  try {
    const tasksDoc = await getDoc(doc(db, 'taskmaster_projects', userId))
    return {
      projects: tasksDoc.exists() ? tasksDoc.data().projects || [] : []
    }
  } catch (error) {
    console.error('Failed to fetch tasks data:', error)
    return { projects: [] }
  }
}

/**
 * Fetch habits data specifically
 */
export const fetchHabitsData = async (userId) => {
  try {
    const habitsDoc = await getDoc(doc(db, 'habitmaster_habits', userId))
    return {
      habits: habitsDoc.exists() ? habitsDoc.data().habits || [] : []
    }
  } catch (error) {
    console.error('Failed to fetch habits data:', error)
    return { habits: [] }
  }
}

/**
 * Fetch focus data specifically
 */
export const fetchFocusData = async (userId) => {
  try {
    const [sessionsDoc, settingsDoc] = await Promise.all([
      getDoc(doc(db, 'focusmaster_sessions', userId)),
      getDoc(doc(db, 'focusmaster_settings', userId))
    ])

    return {
      sessions: sessionsDoc.exists() ? sessionsDoc.data().sessions || [] : [],
      settings: settingsDoc.exists() ? settingsDoc.data().settings || {} : {}
    }
  } catch (error) {
    console.error('Failed to fetch focus data:', error)
    return { sessions: [], settings: {} }
  }
} 