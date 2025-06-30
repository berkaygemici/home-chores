import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import './App.css'
import AuthPage from './AuthPage'
import { auth, db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  Box, Button, Fab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, Typography, Paper, List, ListItem, ListItemText, IconButton, Chip, Stack, Checkbox, Drawer, Divider, Tooltip, DialogContentText
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import ArrowForward from '@mui/icons-material/ArrowForward'
import AutoAwesome from '@mui/icons-material/AutoAwesome'

import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, isBefore, isToday, isPast } from 'date-fns'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import HomeIcon from '@mui/icons-material/Home'

const SECTIONS = ['All', 'Kitchen', 'Closet', 'Bathroom', 'Living Room', 'Bedroom', 'Other']

const REPEAT_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week on this day' },
  { value: 'monthly', label: 'Every month on this date' },
  { value: 'yearly', label: 'Every year on this date' },
  { value: 'weekdays', label: 'Every weekday (Mon–Fri)' },
  { value: 'custom', label: 'Custom...' },
]

function addRecurringEvents(chore, choreIdx) {
  const events = []
  const { name, dateTime, repeat = 'none', section, doneDates = [], deletedDates = [], description } = chore
  if (!dateTime) return events
  let date = new Date(dateTime)
  const today = new Date()
  let count = 0
  while (date <= new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()) && count < 500) {
    const iso = date.toISOString()
    if (!deletedDates?.includes(iso)) {
      const isDone = doneDates.includes(iso)
      events.push({
        title: name,
        date: iso,
        extendedProps: { choreIdx, section, isDone, dateTime: iso, description },
        color: isDone ? '#b2f2bb' : (isPast(date) && !isDone ? '#ffb3b3' : undefined)
      })
    }
    // Repeat logic
    if (repeat === 'none') break
    if (repeat === 'daily') date.setDate(date.getDate() + 1)
    else if (repeat === 'weekly') date.setDate(date.getDate() + 7)
    else if (repeat === 'monthly') {
      date.setMonth(date.getMonth() + 1)
    } else if (repeat === 'yearly') {
      date.setFullYear(date.getFullYear() + 1)
    } else if (repeat === 'weekdays') {
      do { date.setDate(date.getDate() + 1) } while ([0, 6].includes(date.getDay()))
    } else break
    count++
  }
  return events
}

function TaskModal({ open, onClose, onSave, initial, occurrenceDate, sections, onDelete }) {
  const [name, setName] = useState(initial?.name || '')
  const [dateTime, setDateTime] = useState(initial?.dateTime ? new Date(initial.dateTime) : new Date())
  const [repeat, setRepeat] = useState(initial?.repeat || 'none')
  const [section, setSection] = useState(initial?.section || (sections[0] || 'Other'))
  const [description, setDescription] = useState(initial?.description || '')
  const [deletePrompt, setDeletePrompt] = useState(false)
  const [deleteType, setDeleteType] = useState('')

  useEffect(() => {
    setName(initial?.name || '')
    setDateTime(initial?.dateTime ? new Date(initial.dateTime) : new Date())
    setRepeat(initial?.repeat || 'none')
    setSection(initial?.section || (sections[0] || 'Other'))
    setDescription(initial?.description || '')
    setDeletePrompt(false)
    setDeleteType('')
  }, [initial, sections, open])

  const handleDelete = () => setDeletePrompt(true)
  const handleDeleteConfirm = (type) => {
    setDeleteType(type)
    setDeletePrompt(false)
    onDelete(type, type === 'single' ? occurrenceDate : dateTime.toISOString())
  }

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{
      sx: {
        borderRadius: 4,
        boxShadow: '0 8px 32px #2563eb33',
        minWidth: 340,
        p: 0,
        overflow: 'visible',
        background: 'linear-gradient(120deg, #f5f7fa 60%, #e3f0ff 100%)',
      }
    }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.35rem', color: '#2563eb', pb: 0 }}>{initial ? 'Edit Task' : 'Add Task'}</DialogTitle>
      <DialogContent sx={{display:'flex', flexDirection:'column', gap:2, minWidth:320, pt:2, pb:1}}>
        <TextField label="Task name" value={name} onChange={e => setName(e.target.value)} required autoFocus fullWidth sx={{mb:1, borderRadius:2, background:'#fff'}}/>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label="Date & Time"
            value={dateTime}
            onChange={setDateTime}
            ampm={false}
            renderInput={(params) => <TextField {...params} fullWidth sx={{borderRadius:2, background:'#fff'}} />}
          />
        </LocalizationProvider>
        <FormControl fullWidth sx={{mb:1, borderRadius:2, background:'#fff'}}>
          <InputLabel>Repeat</InputLabel>
          <Select value={repeat} label="Repeat" onChange={e => setRepeat(e.target.value)}>
            {REPEAT_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{mb:1, borderRadius:2, background:'#fff'}}>
          <InputLabel>Section</InputLabel>
          <Select value={section} label="Section" onChange={e => setSection(e.target.value)}>
            {sections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} multiline minRows={2} fullWidth sx={{borderRadius:2, background:'#fff'}}/>
      </DialogContent>
      <DialogActions sx={{px:3, pb:2, pt:1, justifyContent:'space-between'}}>
        {onDelete && <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete} sx={{borderRadius:99, fontWeight:600}}>Delete</Button>}
        <Box sx={{display:'flex', gap:1}}>
          <Button onClick={onClose} sx={{borderRadius:99, fontWeight:600}}>Cancel</Button>
          <Button variant="contained" onClick={() => onSave({ name, dateTime: dateTime.toISOString(), repeat, section, description })} sx={{borderRadius:99, fontWeight:600, boxShadow:'0 2px 8px #2563eb22'}}>{initial ? 'Save' : 'Add'}</Button>
        </Box>
      </DialogActions>
      <Dialog open={deletePrompt} onClose={()=>setDeletePrompt(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to delete only this occurrence or all occurrences of this task?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDeletePrompt(false)}>Cancel</Button>
          <Button color="error" onClick={()=>handleDeleteConfirm('single')}>Only this occurrence</Button>
          <Button color="error" onClick={()=>handleDeleteConfirm('all')}>All occurrences</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

function SectionModal({ open, onClose, sections, onAdd, onDelete }) {
  const [newSection, setNewSection] = useState('')
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Manage Sections</DialogTitle>
      <DialogContent sx={{minWidth:300}}>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{mb:2}}>
          {sections.map(s => (
            <Chip key={s} label={s} onDelete={s!=='Other'?()=>onDelete(s):undefined} color={s==='Other'?'default':'primary'} sx={{mb:1}} />
          ))}
        </Stack>
        <Box sx={{display:'flex', gap:1}}>
          <TextField label="New section" value={newSection} onChange={e=>setNewSection(e.target.value)} fullWidth />
          <Button variant="contained" onClick={()=>{if(newSection) {onAdd(newSection); setNewSection('')}}}>Add</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}



export default function App() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState(null) // 'chores' or 'tasks'
  const navigate = useNavigate()
  const [chores, setChores] = useState([])
  const [sections, setSections] = useState(['Other'])
  const [modalOpen, setModalOpen] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterSection, setFilterSection] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [modalInitial, setModalInitial] = useState(null)
  const [quickAddDate, setQuickAddDate] = useState(null)
  const [deleteContext, setDeleteContext] = useState({})
  const [shareOpen, setShareOpen] = useState(false)
  const shareUrl = `${window.location.origin}/share/${user ? user.uid : ''}`



  // Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      // Check for pending invitations after login
      if (u) {
        checkPendingInvitations(u)
      }
    })
    return unsub
  }, [])

  // Check for pending invitations after login
  const checkPendingInvitations = async (user) => {
    const pendingInvitation = localStorage.getItem('pendingInvitation')
    if (pendingInvitation) {
      try {
        const invitationData = JSON.parse(pendingInvitation)
        
        // Check if the logged-in user's email matches the invitation
        if (user.email === invitationData.email) {
          // Redirect to invitation handler
          window.location.href = `/invite/${invitationData.projectId}/${invitationData.invitationId}`
        } else {
          // Clear the pending invitation if emails don't match
          localStorage.removeItem('pendingInvitation')
        }
      } catch (error) {
        console.error('Error processing pending invitation:', error)
        localStorage.removeItem('pendingInvitation')
      }
    }
  }

  // Load chores and sections from Firestore
  useEffect(() => {
    if (!user) {
      setChores([])
      setSections(['Other'])
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      getDoc(doc(db, 'chores', user.uid)),
      getDoc(doc(db, 'sections', user.uid))
    ]).then(([choreSnap, sectionSnap]) => {
      setChores(choreSnap.exists() ? choreSnap.data().chores || [] : [])
      setSections(sectionSnap.exists() ? sectionSnap.data().sections || ['Other'] : ['Other'])
      setLoading(false)
    }).catch(() => {
      setChores([])
      setSections(['Other'])
      setLoading(false)
    })
    // Fallback: timeout in case Firestore hangs
    const timeout = setTimeout(() => setLoading(false), 7000)
    return () => clearTimeout(timeout)
  }, [user])



  // Save chores
  const saveChores = async (newChores) => {
    if (!user) return
    await setDoc(doc(db, 'chores', user.uid), { chores: newChores }, { merge: true })
    setChores(newChores)
  }
  // Save sections
  const saveSections = async (newSections) => {
    if (!user) return
    await setDoc(doc(db, 'sections', user.uid), { sections: newSections }, { merge: true })
    setSections(newSections)
  }

  // Task handlers
  const handleAddTask = async (task) => {
    await saveChores([...chores, { ...task, doneDates: [], deletedDates: [] }])
    setModalOpen(false)
    setQuickAddDate(null)
  }
  const handleEditChore = async (task) => {
    if (editIdx == null) return
    const newChores = chores.map((c, i) => i === editIdx ? { ...c, ...task } : c)
    await saveChores(newChores)
    setEditIdx(null)
    setModalOpen(false)
    setQuickAddDate(null)
  }
  const handleDeleteChore = async (type, isoDate) => {
    if (editIdx == null) return
    if (type === 'all') {
      const newChores = chores.filter((_, i) => i !== editIdx)
      await saveChores(newChores)
    } else if (type === 'single' && modalInitial && isoDate) {
      const newChores = chores.map((c, i) => {
        if (i !== editIdx) return c
        return { ...c, deletedDates: [...(c.deletedDates || []), isoDate] }
      })
      await saveChores(newChores)
    }
    setEditIdx(null)
    setModalOpen(false)
    setQuickAddDate(null)
  }

  // Mark a specific occurrence as done/undone
  const handleToggleDone = async (taskIdx, isoDate) => {
    const newChores = chores.map((c, i) => {
      if (i !== taskIdx) return c
      const doneDates = c.doneDates || []
      const idx = doneDates.indexOf(isoDate)
      if (idx === -1) return { ...c, doneDates: [...doneDates, isoDate] }
      else return { ...c, doneDates: doneDates.filter(d => d !== isoDate) }
    })
    await saveChores(newChores)
  }

  // Section handlers
  const handleAddSection = async (section) => {
    if (!sections.includes(section)) await saveSections([...sections, section])
  }
  const handleDeleteSection = async (section) => {
    if (section === 'Other') return
    const newSections = sections.filter(s => s !== section)
    await saveSections(newSections)
    // Remove section from tasks
    const newChores = chores.map(c => c.section === section ? { ...c, section: 'Other' } : c)
    await saveChores(newChores)
  }



  // Keyboard shortcut for 'c' to open add task modal
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'c' && !modalOpen && !sectionModalOpen) {
        setEditIdx(null)
        setModalInitial(null)
        setModalOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modalOpen, sectionModalOpen])

  const filteredChores = filterSection === 'All' ? chores : chores.filter(c => c.section === filterSection)
  const events = filteredChores.flatMap((chore, idx) => addRecurringEvents(chore, idx))

  // Checklist panel: show all tasks for today, sorted by time
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = chores
    .flatMap((task, idx) => {
      // For recurring, generate all occurrences for today
      const occurrences = []
      let date = new Date(task.dateTime)
      const repeat = task.repeat || 'none'
      let count = 0
      while (format(date, 'yyyy-MM-dd') <= todayStr && count < 500) {
        if (format(date, 'yyyy-MM-dd') === todayStr && !(task.deletedDates||[]).includes(date.toISOString())) {
          occurrences.push({ ...task, occurrenceDate: date.toISOString(), taskIdx: idx })
        }
        if (repeat === 'none') break
        if (repeat === 'daily') date.setDate(date.getDate() + 1)
        else if (repeat === 'weekly') date.setDate(date.getDate() + 7)
        else if (repeat === 'monthly') date.setMonth(date.getMonth() + 1)
        else if (repeat === 'yearly') date.setFullYear(date.getFullYear() + 1)
        else if (repeat === 'weekdays') { do { date.setDate(date.getDate() + 1) } while ([0, 6].includes(date.getDay())) }
        else break
        count++
      }
      return occurrences
    })
    .sort((a, b) => new Date(a.occurrenceDate) - new Date(b.occurrenceDate))

  if (!user) return <AuthPage onAuth={setUser} />

  // New: Mode selection after login
  if (!mode) {
    return (
      <Box sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          zIndex: 0
        }
      }}>
        {/* Floating background elements */}
        <Box sx={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          width: 120,
          height: 120,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
            '33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
            '66%': { transform: 'translate(-20px, 20px) rotate(240deg)' }
          }
        }} />
        <Box sx={{
          position: 'absolute',
          top: '70%',
          right: '10%',
          width: 80,
          height: 80,
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite reverse',
        }} />
        <Box sx={{
          position: 'absolute',
          top: '40%',
          left: '85%',
          width: 60,
          height: 60,
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%',
          animation: 'float 10s ease-in-out infinite',
        }} />

        <Box sx={{
          p: { xs: 4, sm: 6, md: 8 },
          borderRadius: 6,
          minWidth: { xs: 350, sm: 480, md: 600 },
          maxWidth: { xs: 520, sm: 600, md: 800, lg: 900 },
          width: { xs: '90%', sm: '85%', md: '80%', lg: '75%' },
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 3, md: 4 },
          position: 'relative',
          zIndex: 1,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 32px 64px rgba(0, 0, 0, 0.15), 0 16px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.2), 0 20px 40px rgba(0, 0, 0, 0.15)'
          }
        }}>
          {/* Welcome Header */}
          <Box sx={{ mb: { xs: 2, md: 3 } }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              width: { xs: 100, md: 120 },
              height: { xs: 100, md: 120 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: { xs: '0 auto 24px', md: '0 auto 32px' },
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
              animation: 'pulse 3s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.08)' }
              }
            }}>
              <RocketLaunchIcon sx={{ color: '#fff', fontSize: { xs: 50, md: 60 } }} />
            </Box>
            
            <Typography variant="h3" sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px',
              mb: { xs: 2, md: 3 },
              fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem' }
            }}>
              Welcome Back!
            </Typography>
            
            <Typography variant="h6" sx={{
              color: '#64748b',
              fontWeight: 600,
              fontSize: { xs: '1.2rem', md: '1.4rem' },
              mb: { xs: 1, md: 2 }
            }}>
              Your Productivity Universe
            </Typography>
            
            <Typography variant="body1" sx={{
              color: '#334155',
              fontSize: { xs: '1.1rem', md: '1.2rem' },
              fontWeight: 500,
              maxWidth: { xs: '100%', md: '500px' },
              mx: 'auto'
            }}>
              Choose your workspace to begin your journey
            </Typography>
          </Box>

          {/* Project Cards */}
          <Box sx={{ 
            width: '100%', 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, 1fr)' },
            gap: { xs: 2.5, md: 3, xl: 4 },
            maxWidth: { xs: '100%', md: '600px', xl: '1000px' },
            mx: 'auto'
          }}>
            <Box
              onClick={() => setMode('chores')}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: { xs: 4, md: 5 },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: { xs: 'auto', md: '80px', xl: '140px' },
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: '0 12px 48px rgba(102, 126, 234, 0.4)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover::before': {
                  left: '100%',
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'row', xl: 'column' },
                alignItems: 'center', 
                gap: { xs: 2, md: 3, xl: 2 }, 
                position: 'relative', 
                zIndex: 1,
                textAlign: { xs: 'left', xl: 'center' }
              }}>
                <HomeIcon sx={{ fontSize: { xs: 32, md: 40, xl: 48 } }} />
                <Box sx={{ textAlign: { xs: 'left', xl: 'center' }, flex: { xs: 1, xl: 'unset' } }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.5rem', xl: '1.3rem' } }}>
                    CHORESMASTER
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '1rem', md: '1.1rem', xl: '1rem' } }}>
                    Organize your home tasks & routines
                  </Typography>
                </Box>
                <ArrowForward sx={{ fontSize: { xs: 24, md: 28 }, opacity: 0.8, display: { xl: 'none' } }} />
              </Box>
            </Box>

            <Box
              onClick={() => navigate('/taskmaster')}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: { xs: 4, md: 5 },
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 32px rgba(240, 147, 251, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: { xs: 'auto', md: '80px', xl: '140px' },
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: '0 12px 48px rgba(240, 147, 251, 0.4)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover::before': {
                  left: '100%',
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'row', xl: 'column' },
                alignItems: 'center', 
                gap: { xs: 2, md: 3, xl: 2 }, 
                position: 'relative', 
                zIndex: 1,
                textAlign: { xs: 'left', xl: 'center' }
              }}>
                <CheckCircleIcon sx={{ fontSize: { xs: 32, md: 40, xl: 48 } }} />
                <Box sx={{ textAlign: { xs: 'left', xl: 'center' }, flex: { xs: 1, xl: 'unset' } }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.5rem', xl: '1.3rem' } }}>
                    TASKMASTER
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '1rem', md: '1.1rem', xl: '1rem' } }}>
                    Manage projects & daily tasks
                  </Typography>
                </Box>
                <ArrowForward sx={{ fontSize: { xs: 24, md: 28 }, opacity: 0.8, display: { xl: 'none' } }} />
              </Box>
            </Box>

            <Box
              onClick={() => navigate('/habitmaster')}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: { xs: 4, md: 5 },
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: { xs: 'auto', md: '80px', xl: '140px' },
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: '0 12px 48px rgba(79, 172, 254, 0.4)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover::before': {
                  left: '100%',
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'row', xl: 'column' },
                alignItems: 'center', 
                gap: { xs: 2, md: 3, xl: 2 }, 
                position: 'relative', 
                zIndex: 1,
                textAlign: { xs: 'left', xl: 'center' }
              }}>
                <AutoAwesome sx={{ fontSize: { xs: 32, md: 40, xl: 48 } }} />
                <Box sx={{ textAlign: { xs: 'left', xl: 'center' }, flex: { xs: 1, xl: 'unset' } }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.5rem', xl: '1.3rem' } }}>
                    HABITMASTER
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '1rem', md: '1.1rem', xl: '1rem' } }}>
                    Build lasting positive habits
                  </Typography>
                </Box>
                <ArrowForward sx={{ fontSize: { xs: 24, md: 28 }, opacity: 0.8, display: { xl: 'none' } }} />
              </Box>
            </Box>
          </Box>

          {/* User Info & Logout */}
          <Box sx={{ 
            mt: 3, 
            pt: 3, 
            borderTop: '1px solid rgba(100, 116, 139, 0.2)',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              {user?.email}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={() => signOut(auth)}
              sx={{
                borderRadius: 3,
                fontWeight: 600,
                color: '#64748b',
                borderColor: '#d1d5db',
                fontSize: '0.9rem',
                px: 2,
                py: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.05)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Box>
    )
  }



  if (mode === 'chores') {
    // Render ChoresMaster with Home button inside sidebar
    return (
      <Box sx={{bgcolor:'linear-gradient(120deg, #f5f7fa 60%, #e3f0ff 100%)', minHeight:'100vh', fontFamily:'Inter, system-ui, sans-serif', display:'flex'}}>
        {/* Checklist Sidebar */}
        <Drawer variant="permanent" open anchor="left" PaperProps={{sx:{width:320, bgcolor:'#f8fafc', borderRight:'1px solid #e0e7ef', p:2}}}>
          <Box sx={{p:2, pb:0}}>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              sx={{borderRadius:99, fontWeight:600, bgcolor:'#fff', boxShadow:'0 2px 8px #2563eb22', mb:2, width:'100%', '&:hover':{bgcolor:'#f1f5fa'}}}
              onClick={()=>setMode(null)}
            >
              Home
            </Button>
            <Typography variant="h6" sx={{mb:2, fontWeight:700}}>Today's Checklist</Typography>
            <List>
              {todayTasks.length === 0 && <ListItem><ListItemText primary="No tasks for today." /></ListItem>}
              {todayTasks.map((task, idx) => {
                const isOverdue = isPast(new Date(task.occurrenceDate)) && !(task.doneDates||[]).includes(task.occurrenceDate)
                const isDone = (task.doneDates||[]).includes(task.occurrenceDate)
                return (
                  <ListItem key={idx} sx={{borderRadius:2, mb:1, bgcolor: isDone ? '#e6ffed' : (isOverdue ? '#ffeaea' : '#fff')}}
                    secondaryAction={
                      <IconButton edge="end" onClick={()=>{setEditIdx(task.taskIdx); setModalInitial(task); setModalOpen(true);}}>
                        <EditIcon/>
                      </IconButton>
                    }
                  >
                    <Checkbox checked={isDone} onChange={()=>handleToggleDone(task.taskIdx, task.occurrenceDate)} icon={<RadioButtonUncheckedIcon/>} checkedIcon={<CheckCircleIcon/>} />
                    <ListItemText
                      primary={<span style={{textDecoration: isDone ? 'line-through' : undefined, color: isOverdue ? '#d32f2f' : undefined}}>{task.name}</span>}
                      secondary={format(new Date(task.occurrenceDate), 'HH:mm') + (task.section ? ` • ${task.section}` : '')}
                    />
                  </ListItem>
                )
              })}
            </List>
          </Box>
          <Divider sx={{my:2}}/>
          <Button variant="contained" color="primary" startIcon={<SettingsIcon/>} onClick={()=>setSectionModalOpen(true)} sx={{borderRadius:99, fontWeight:600, mx:2}}>Manage Sections</Button>
          <Button variant="outlined" color="primary" startIcon={<ContentCopyIcon/>} onClick={()=>setShareOpen(true)} sx={{borderRadius:99, fontWeight:600, mx:2, mt:1}}>Share Calendar</Button>
          <Button variant="outlined" color="error" startIcon={<LogoutIcon/>} onClick={()=>signOut(auth)} sx={{borderRadius:99, fontWeight:600, mx:2, mt:1}}>Logout</Button>
        </Drawer>
        {/* Main Content */}
        <Box sx={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', minHeight:'100vh', p:{xs:1,sm:4}}}>
          <Paper elevation={4} sx={{maxWidth: 900, width:'100%', mx:'auto', my:6, p:{xs:2,sm:4}, borderRadius:5, boxShadow: '0 8px 32px #2563eb22'}}>
            <Box sx={{display:'flex', flexDirection:{xs:'column',sm:'row'}, alignItems:{sm:'center'}, justifyContent:'space-between', gap:2, mb:3}}>
              <FormControl sx={{minWidth:180}} size="small">
                <InputLabel>Filter by section</InputLabel>
                <Select value={filterSection} label="Filter by section" onChange={e=>setFilterSection(e.target.value)}>
                  <MenuItem value="All">All</MenuItem>
                  {sections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <Fab color="primary" aria-label="add" sx={{ml:2}} onClick={()=>{setEditIdx(null); setModalInitial(null); setModalOpen(true);}}>
                <AddIcon />
              </Fab>
            </Box>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale="en"
                events={events}
                height="auto"
                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                nowIndicator={true}
                eventClick={info => {
                  // If click is on the checkbox, mark as done/undone
                  const box = info.jsEvent.target.closest('.fc-checkbox')
                  if (box) {
                    const { choreIdx, dateTime } = info.event.extendedProps
                    handleToggleDone(choreIdx, dateTime)
                    return
                  }
                  setEditIdx(info.event.extendedProps.choreIdx)
                  setModalInitial(filteredChores[info.event.extendedProps.choreIdx])
                  setModalOpen(true)
                }}
                dateClick={info => {
                  setEditIdx(null)
                  setModalInitial({ dateTime: info.dateStr })
                  setModalOpen(true)
                }}
                eventContent={renderEventContent}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              />
            </LocalizationProvider>
            <TaskModal
              open={modalOpen}
              onClose={()=>{setModalOpen(false); setEditIdx(null); setModalInitial(null); setQuickAddDate(null);}}
              onSave={editIdx==null?handleAddTask:handleEditChore}
              initial={modalInitial}
              occurrenceDate={modalInitial?.occurrenceDate || modalInitial?.dateTime}
              sections={sections}
              onDelete={editIdx!=null?handleDeleteChore:undefined}
            />
            <SectionModal
              open={sectionModalOpen}
              onClose={()=>setSectionModalOpen(false)}
              sections={sections}
              onAdd={handleAddSection}
              onDelete={handleDeleteSection}
            />
            <Dialog open={shareOpen} onClose={()=>setShareOpen(false)}>
              <DialogTitle>Share Calendar</DialogTitle>
              <DialogContent>
                <Typography>Anyone with this link can view your calendar (read-only):</Typography>
                <Box sx={{display:'flex', alignItems:'center', mt:2}}>
                  <TextField value={shareUrl} fullWidth InputProps={{readOnly:true}} size="small" />
                  <IconButton onClick={()=>{navigator.clipboard.writeText(shareUrl)}}><ContentCopyIcon/></IconButton>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={()=>setShareOpen(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{bgcolor:'linear-gradient(120deg, #f5f7fa 60%, #e3f0ff 100%)', minHeight:'100vh', fontFamily:'Inter, system-ui, sans-serif', display:'flex'}}>
      {/* Checklist Sidebar */}
      <Drawer variant="permanent" open anchor="left" PaperProps={{sx:{width:320, bgcolor:'#f8fafc', borderRight:'1px solid #e0e7ef', p:2}}}>
        <Box sx={{p:2}}>
          <Typography variant="h6" sx={{mb:2, fontWeight:700}}>Today's Checklist</Typography>
          <List>
            {todayTasks.length === 0 && <ListItem><ListItemText primary="No tasks for today." /></ListItem>}
            {todayTasks.map((task, idx) => {
              const isOverdue = isPast(new Date(task.occurrenceDate)) && !(task.doneDates||[]).includes(task.occurrenceDate)
              const isDone = (task.doneDates||[]).includes(task.occurrenceDate)
              return (
                <ListItem key={idx} sx={{borderRadius:2, mb:1, bgcolor: isDone ? '#e6ffed' : (isOverdue ? '#ffeaea' : '#fff')}}
                  secondaryAction={
                    <IconButton edge="end" onClick={()=>{setEditIdx(task.taskIdx); setModalInitial(task); setModalOpen(true);}}>
                      <EditIcon/>
                    </IconButton>
                  }
                >
                  <Checkbox checked={isDone} onChange={()=>handleToggleDone(task.taskIdx, task.occurrenceDate)} icon={<RadioButtonUncheckedIcon/>} checkedIcon={<CheckCircleIcon/>} />
                  <ListItemText
                    primary={<span style={{textDecoration: isDone ? 'line-through' : undefined, color: isOverdue ? '#d32f2f' : undefined}}>{task.name}</span>}
                    secondary={format(new Date(task.occurrenceDate), 'HH:mm') + (task.section ? ` • ${task.section}` : '')}
                  />
                </ListItem>
              )
            })}
          </List>
        </Box>
        <Divider sx={{my:2}}/>
        <Button variant="contained" color="primary" startIcon={<SettingsIcon/>} onClick={()=>setSectionModalOpen(true)} sx={{borderRadius:99, fontWeight:600, mx:2}}>Manage Sections</Button>
        <Button variant="outlined" color="primary" startIcon={<ContentCopyIcon/>} onClick={()=>setShareOpen(true)} sx={{borderRadius:99, fontWeight:600, mx:2, mt:1}}>Share Calendar</Button>
        <Button variant="outlined" color="error" startIcon={<LogoutIcon/>} onClick={()=>signOut(auth)} sx={{borderRadius:99, fontWeight:600, mx:2, mt:1}}>Logout</Button>
      </Drawer>
      {/* Main Content */}
      <Box sx={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', minHeight:'100vh', p:{xs:1,sm:4}}}>
        <Paper elevation={4} sx={{maxWidth: 900, width:'100%', mx:'auto', my:6, p:{xs:2,sm:4}, borderRadius:5, boxShadow: '0 8px 32px #2563eb22'}}>
          <Box sx={{display:'flex', flexDirection:{xs:'column',sm:'row'}, alignItems:{sm:'center'}, justifyContent:'space-between', gap:2, mb:3}}>
            <FormControl sx={{minWidth:180}} size="small">
              <InputLabel>Filter by section</InputLabel>
              <Select value={filterSection} label="Filter by section" onChange={e=>setFilterSection(e.target.value)}>
                <MenuItem value="All">All</MenuItem>
                {sections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <Fab color="primary" aria-label="add" sx={{ml:2}} onClick={()=>{setEditIdx(null); setModalInitial(null); setModalOpen(true);}}>
              <AddIcon />
            </Fab>
          </Box>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale="en"
              events={events}
              height="auto"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              nowIndicator={true}
              eventClick={info => {
                // If click is on the checkbox, mark as done/undone
                const box = info.jsEvent.target.closest('.fc-checkbox')
                if (box) {
                  const { choreIdx, dateTime } = info.event.extendedProps
                  handleToggleDone(choreIdx, dateTime)
                  return
                }
                setEditIdx(info.event.extendedProps.choreIdx)
                setModalInitial(filteredChores[info.event.extendedProps.choreIdx])
                setModalOpen(true)
              }}
              dateClick={info => {
                setEditIdx(null)
                setModalInitial({ dateTime: info.dateStr })
                setModalOpen(true)
              }}
              eventContent={renderEventContent}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            />
          </LocalizationProvider>
          <TaskModal
            open={modalOpen}
            onClose={()=>{setModalOpen(false); setEditIdx(null); setModalInitial(null); setQuickAddDate(null);}}
            onSave={editIdx==null?handleAddTask:handleEditTask}
            initial={modalInitial}
            occurrenceDate={modalInitial?.occurrenceDate || modalInitial?.dateTime}
            sections={sections}
            onDelete={editIdx!=null?handleDeleteTask:undefined}
          />
          <SectionModal
            open={sectionModalOpen}
            onClose={()=>setSectionModalOpen(false)}
            sections={sections}
            onAdd={handleAddSection}
            onDelete={handleDeleteSection}
          />
          <Dialog open={shareOpen} onClose={()=>setShareOpen(false)}>
            <DialogTitle>Share Calendar</DialogTitle>
            <DialogContent>
              <Typography>Anyone with this link can view your calendar (read-only):</Typography>
              <Box sx={{display:'flex', alignItems:'center', mt:2}}>
                <TextField value={shareUrl} fullWidth InputProps={{readOnly:true}} size="small" />
                <IconButton onClick={()=>{navigator.clipboard.writeText(shareUrl)}}><ContentCopyIcon/></IconButton>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setShareOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Box>
  )
}

// Custom event content for calendar: show done/overdue, 24h, truncate text, show description as tooltip
function renderEventContent(arg) {
  const isDone = arg.event.extendedProps.isDone
  const isOverdue = isPast(new Date(arg.event.start)) && !isDone
  const description = arg.event.extendedProps.description
  // Truncate long text, show full on hover
  const maxLen = 18
  const title = arg.event.title.length > maxLen ? arg.event.title.slice(0, maxLen) + '…' : arg.event.title
  const tooltip = description ? `${arg.event.title}\n${description}` : arg.event.title
  return (
    <Tooltip title={tooltip} arrow>
      <Box sx={{display:'flex', alignItems:'center', gap:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: '100%'}}>
        <span className="fc-checkbox" style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
          <Checkbox checked={isDone} icon={<RadioButtonUncheckedIcon fontSize="small"/>} checkedIcon={<CheckCircleIcon fontSize="small"/>} sx={{p:0, mr:0.5}} disabled />
        </span>
        <span style={{textDecoration: isDone ? 'line-through' : undefined, color: isOverdue ? '#d32f2f' : undefined, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: 120}}>{title}</span>
      </Box>
    </Tooltip>
  )
}
