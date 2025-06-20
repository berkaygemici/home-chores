import { useState, useEffect } from 'react'
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
  Box, Button, Fab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, Typography, Paper, List, ListItem, ListItemText, IconButton, Chip, Stack, Checkbox, Drawer, Divider
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
  const { name, dateTime, repeat, section, done } = chore
  if (!dateTime) return events
  const repeatNum = parseInt(repeat)
  let date = new Date(dateTime)
  const today = new Date()
  // 1 yıl ileriye kadar göster
  while (date <= new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())) {
    events.push({
      title: name,
      date: date.toISOString(),
      extendedProps: { choreIdx, section, done, dateTime: date.toISOString() },
      color: done ? '#b2f2bb' : (isPast(date) && !done ? '#ffb3b3' : undefined)
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
  const [done, setDone] = useState(initial?.done || false)

  useEffect(() => {
    setName(initial?.name || '')
    setDateTime(initial?.dateTime ? new Date(initial.dateTime) : new Date())
    setRepeat(initial?.repeat || '')
    setSection(initial?.section || (sections[0] || 'Other'))
    setDone(initial?.done || false)
  }, [initial, sections])

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
        <FormControl>
          <Box sx={{display:'flex', alignItems:'center', gap:1}}>
            <Checkbox checked={done} onChange={e => setDone(e.target.checked)} />
            <Typography>Done</Typography>
          </Box>
        </FormControl>
      </DialogContent>
      <DialogActions>
        {onDelete && <Button color="error" startIcon={<DeleteIcon />} onClick={onDelete}>Delete</Button>}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ name, dateTime: dateTime.toISOString(), repeat, section, done })}>{initial ? 'Save' : 'Add'}</Button>
      </DialogActions>
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
    await saveChores([...chores, task])
    setModalOpen(false)
  }
  const handleEditTask = async (task) => {
    if (editIdx == null) return
    const newChores = chores.map((c, i) => i === editIdx ? { ...c, ...task } : c)
    await saveChores(newChores)
    setEditIdx(null)
    setModalOpen(false)
  }
  const handleDeleteTask = async () => {
    if (editIdx == null) return
    const newChores = chores.filter((_, i) => i !== editIdx)
    await saveChores(newChores)
    setEditIdx(null)
    setModalOpen(false)
  }
  const handleToggleDone = async (idx) => {
    const newChores = chores.map((c, i) => i === idx ? { ...c, done: !c.done } : c)
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

  const filteredChores = filterSection === 'All' ? chores : chores.filter(c => c.section === filterSection)
  const events = filteredChores.flatMap((chore, idx) => addRecurringEvents(chore, idx))

  // Checklist panel: show all tasks for today, sorted by time
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = chores
    .filter(task => task.dateTime && format(new Date(task.dateTime), 'yyyy-MM-dd') === todayStr)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))

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
              const isOverdue = isPast(new Date(task.dateTime)) && !task.done
              return (
                <ListItem key={idx} sx={{borderRadius:2, mb:1, bgcolor: task.done ? '#e6ffed' : (isOverdue ? '#ffeaea' : '#fff')}}
                  secondaryAction={
                    <IconButton edge="end" onClick={()=>{setEditIdx(chores.indexOf(task)); setModalInitial(task); setModalOpen(true);}}>
                      <EditIcon/>
                    </IconButton>
                  }
                >
                  <Checkbox checked={task.done} onChange={()=>handleToggleDone(chores.indexOf(task))} icon={<RadioButtonUncheckedIcon/>} checkedIcon={<CheckCircleIcon/>} />
                  <ListItemText
                    primary={<span style={{textDecoration: task.done ? 'line-through' : undefined, color: isOverdue ? '#d32f2f' : undefined}}>{task.name}</span>}
                    secondary={format(new Date(task.dateTime), 'HH:mm') + (task.section ? ` • ${task.section}` : '')}
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
                setEditIdx(info.event.extendedProps.choreIdx)
                setModalInitial(filteredChores[info.event.extendedProps.choreIdx])
                setModalOpen(true)
              }}
              dateClick={info => {
                setEditIdx(null)
                setModalInitial({ dateTime: info.dateStr })
                setModalOpen(true)
              }}
            />
          </LocalizationProvider>
          <Box sx={{mt:3}}>
            <Typography variant="h5" sx={{mb:1}}>Tasks</Typography>
            <List>
              {filteredChores.length === 0 && <ListItem><ListItemText primary="No tasks added yet." /></ListItem>}
              {filteredChores.map((chore, i) => {
                const isOverdue = isPast(new Date(chore.dateTime)) && !chore.done
                return (
                  <ListItem key={i} sx={{borderRadius:2, mb:1, bgcolor: chore.done ? '#e6ffed' : (isOverdue ? '#ffeaea' : '#fff')}}
                    secondaryAction={
                      <IconButton edge="end" onClick={()=>{setEditIdx(i); setModalInitial(chore); setModalOpen(true);}}><EditIcon/></IconButton>
                    }
                  >
                    <Checkbox checked={chore.done} onChange={()=>handleToggleDone(i)} icon={<RadioButtonUncheckedIcon/>} checkedIcon={<CheckCircleIcon/>} />
                    <ListItemText
                      primary={<span style={{textDecoration: chore.done ? 'line-through' : undefined, color: isOverdue ? '#d32f2f' : undefined}}>{chore.name}</span>}
                      secondary={format(new Date(chore.dateTime), 'yyyy-MM-dd HH:mm') + (chore.section ? ` • ${chore.section}` : '')}
                    />
                  </ListItem>
                )
              })}
            </List>
          </Box>
          <TaskModal
            open={modalOpen}
            onClose={()=>{setModalOpen(false); setEditIdx(null); setModalInitial(null);}}
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
