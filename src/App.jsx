import { useState, useEffect, useCallback } from 'react'
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
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, isBefore, isToday, isPast } from 'date-fns'

const SECTIONS = ['All', 'Kitchen', 'Closet', 'Bathroom', 'Living Room', 'Bedroom', 'Other']

function addRecurringEvents(chore, choreIdx) {
  const events = []
  const { name, dateTime, repeat, section, doneDates = [] } = chore
  if (!dateTime) return events
  const repeatNum = parseInt(repeat)
  let date = new Date(dateTime)
  const today = new Date()
  // 1 yıl ileriye kadar göster
  while (date <= new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())) {
    const iso = date.toISOString()
    const isDone = doneDates.includes(iso)
    events.push({
      title: name,
      date: iso,
      extendedProps: { choreIdx, section, isDone, dateTime: iso },
      color: isDone ? '#b2f2bb' : (isPast(date) && !isDone ? '#ffb3b3' : undefined)
    })
    if (!repeatNum) break
    date.setDate(date.getDate() + repeatNum)
  }
  return events
}

function TaskModal({ open, onClose, onSave, initial, sections, onDelete }) {
  const [name, setName] = useState(initial?.name || '')
  const [dateTime, setDateTime] = useState(initial?.dateTime ? new Date(initial.dateTime) : new Date())
  const [repeat, setRepeat] = useState(initial?.repeat || '')
  const [section, setSection] = useState(initial?.section || (sections[0] || 'Other'))
  const [deletePrompt, setDeletePrompt] = useState(false)
  const [deleteType, setDeleteType] = useState('')

  useEffect(() => {
    setName(initial?.name || '')
    setDateTime(initial?.dateTime ? new Date(initial.dateTime) : new Date())
    setRepeat(initial?.repeat || '')
    setSection(initial?.section || (sections[0] || 'Other'))
    setDeletePrompt(false)
    setDeleteType('')
  }, [initial, sections, open])

  const handleDelete = () => setDeletePrompt(true)
  const handleDeleteConfirm = (type) => {
    setDeleteType(type)
    setDeletePrompt(false)
    onDelete(type)
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initial ? 'Edit Task' : 'Add Task'}</DialogTitle>
      <DialogContent sx={{display:'flex', flexDirection:'column', gap:2, minWidth:300}}>
        <TextField label="Task name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label="Date & Time"
            value={dateTime}
            onChange={setDateTime}
            ampm={false}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
        <TextField label="Repeat (days)" type="number" value={repeat} onChange={e => setRepeat(e.target.value)} />
        <FormControl fullWidth>
          <InputLabel>Section</InputLabel>
          <Select value={section} label="Section" onChange={e => setSection(e.target.value)}>
            {sections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        {onDelete && <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>Delete</Button>}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ name, dateTime: dateTime.toISOString(), repeat, section })}>{initial ? 'Save' : 'Add'}</Button>
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

  // Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return unsub
  }, [])

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
    await saveChores([...chores, { ...task, doneDates: [] }])
    setModalOpen(false)
    setQuickAddDate(null)
  }
  const handleEditTask = async (task) => {
    if (editIdx == null) return
    const newChores = chores.map((c, i) => i === editIdx ? { ...c, ...task } : c)
    await saveChores(newChores)
    setEditIdx(null)
    setModalOpen(false)
    setQuickAddDate(null)
  }
  const handleDeleteTask = async (type) => {
    if (editIdx == null) return
    if (type === 'all') {
      const newChores = chores.filter((_, i) => i !== editIdx)
      await saveChores(newChores)
    } else if (type === 'single' && modalInitial && modalInitial.dateTime) {
      const iso = modalInitial.dateTime
      const newChores = chores.map((c, i) => {
        if (i !== editIdx) return c
        return { ...c, doneDates: (c.doneDates || []).filter(d => d !== iso) }
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
      const repeatNum = parseInt(task.repeat)
      while (format(date, 'yyyy-MM-dd') <= todayStr) {
        if (format(date, 'yyyy-MM-dd') === todayStr) {
          occurrences.push({ ...task, occurrenceDate: date.toISOString(), taskIdx: idx })
        }
        if (!repeatNum) break
        date.setDate(date.getDate() + repeatNum)
      }
      return occurrences
    })
    .sort((a, b) => new Date(a.occurrenceDate) - new Date(b.occurrenceDate))

  if (!user) return <AuthPage onAuth={setUser} />

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
            />
          </LocalizationProvider>
          <Box sx={{mt:3}}>
            <Typography variant="h5" sx={{mb:1}}>Tasks</Typography>
            <List>
              {filteredChores.length === 0 && <ListItem><ListItemText primary="No tasks added yet." /></ListItem>}
              {filteredChores.map((chore, i) => {
                // For recurring, show the next occurrence
                const nextDate = new Date(chore.dateTime)
                const repeatNum = parseInt(chore.repeat)
                let occurrence = nextDate
                while (isPast(occurrence) && repeatNum) {
                  occurrence = new Date(occurrence)
                  occurrence.setDate(occurrence.getDate() + repeatNum)
                }
                const iso = occurrence.toISOString()
                const isDone = (chore.doneDates||[]).includes(iso)
                const isOverdue = isPast(occurrence) && !isDone
                return (
                  <ListItem key={i} sx={{borderRadius:2, mb:1, bgcolor: isDone ? '#e6ffed' : (isOverdue ? '#ffeaea' : '#fff')}}
                    secondaryAction={
                      <IconButton edge="end" onClick={()=>{setEditIdx(i); setModalInitial(chore); setModalOpen(true);}}><EditIcon/></IconButton>
                    }
                  >
                    <Checkbox checked={isDone} onChange={()=>handleToggleDone(i, iso)} icon={<RadioButtonUncheckedIcon/>} checkedIcon={<CheckCircleIcon/>} />
                    <ListItemText
                      primary={<span style={{textDecoration: isDone ? 'line-through' : undefined, color: isOverdue ? '#d32f2f' : undefined}}>{chore.name}</span>}
                      secondary={format(occurrence, 'yyyy-MM-dd HH:mm') + (chore.section ? ` • ${chore.section}` : '')}
                    />
                  </ListItem>
                )
              })}
            </List>
          </Box>
          <TaskModal
            open={modalOpen}
            onClose={()=>{setModalOpen(false); setEditIdx(null); setModalInitial(null); setQuickAddDate(null);}}
            onSave={editIdx==null?handleAddTask:handleEditTask}
            initial={modalInitial}
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
        </Paper>
      </Box>
    </Box>
  )
}

// Custom event content for calendar: show done/overdue, 24h, truncate text
function renderEventContent(arg) {
  const isDone = arg.event.extendedProps.isDone
  const isOverdue = isPast(new Date(arg.event.start)) && !isDone
  // Truncate long text, show full on hover
  const maxLen = 18
  const title = arg.event.title.length > maxLen ? arg.event.title.slice(0, maxLen) + '…' : arg.event.title
  return (
    <Tooltip title={arg.event.title} arrow>
      <Box sx={{display:'flex', alignItems:'center', gap:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: '100%'}}>
        <span className="fc-checkbox" style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
          <Checkbox checked={isDone} icon={<RadioButtonUncheckedIcon fontSize="small"/>} checkedIcon={<CheckCircleIcon fontSize="small"/>} sx={{p:0, mr:0.5}} disabled />
        </span>
        <span style={{textDecoration: isDone ? 'line-through' : undefined, color: isOverdue ? '#d32f2f' : undefined, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: 120}}>{title}</span>
      </Box>
    </Tooltip>
  )
}
