import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import './App.css'
import AuthPage from './AuthPage'
import { auth, db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemText, Button, Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

const SECTIONS = ['All', 'Kitchen', 'Closet', 'Bathroom', 'Living Room', 'Bedroom', 'Other']

function addRecurringEvents(chore, choreIdx) {
  const events = []
  const { name, startDate, repeat, section } = chore
  if (!startDate) return events
  const repeatNum = parseInt(repeat)
  let date = new Date(startDate)
  const today = new Date()
  // 1 yıl ileriye kadar göster
  while (date <= new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())) {
    events.push({ title: name, date: date.toISOString().slice(0, 10), extendedProps: { choreIdx, section } })
    if (!repeatNum) break
    date.setDate(date.getDate() + repeatNum)
  }
  return events
}

function TaskModal({ open, onClose, onSave, initial, sections, onDelete }) {
  const [name, setName] = useState(initial?.name || '')
  const [startDate, setStartDate] = useState(initial?.startDate || '')
  const [repeat, setRepeat] = useState(initial?.repeat || '')
  const [section, setSection] = useState(initial?.section || (sections[0] || 'Other'))

  useEffect(() => {
    setName(initial?.name || '')
    setStartDate(initial?.startDate || '')
    setRepeat(initial?.repeat || '')
    setSection(initial?.section || (sections[0] || 'Other'))
  }, [initial, sections])

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initial ? 'Edit Task' : 'Add Task'}</DialogTitle>
      <DialogContent sx={{display:'flex', flexDirection:'column', gap:2, minWidth:300}}>
        <TextField label="Task name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
        <TextField label="Start date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{shrink:true}} required />
        <TextField label="Repeat (days)" type="number" value={repeat} onChange={e => setRepeat(e.target.value)} />
        <FormControl fullWidth>
          <InputLabel>Section</InputLabel>
          <Select value={section} label="Section" onChange={e => setSection(e.target.value)}>
            {sections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        {onDelete && <Button color="error" startIcon={<DeleteIcon />} onClick={onDelete}>Delete</Button>}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ name, startDate, repeat, section })}>{initial ? 'Save' : 'Add'}</Button>
      </DialogActions>
    </Dialog>
  )
}

function SectionDrawer({ open, onClose, sections, onAdd, onDelete }) {
  const [newSection, setNewSection] = useState('')
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{width:300, p:2}}>
        <Typography variant="h6" sx={{mb:2}}>Manage Sections</Typography>
        <List>
          {sections.map(s => (
            <ListItem key={s} secondaryAction={s!=='Other'&&<IconButton edge="end" color="error" onClick={()=>onDelete(s)}><DeleteIcon/></IconButton>}>
              <ListItemText primary={s} />
            </ListItem>
          ))}
        </List>
        <Box sx={{display:'flex', gap:1, mt:2}}>
          <TextField label="New section" value={newSection} onChange={e=>setNewSection(e.target.value)} fullWidth />
          <Button variant="contained" onClick={()=>{if(newSection) {onAdd(newSection); setNewSection('')}}}>Add</Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [chores, setChores] = useState([])
  const [sections, setSections] = useState(['Other'])
  const [modalOpen, setModalOpen] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterSection, setFilterSection] = useState('All')

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

  if (!user) return <AuthPage onAuth={setUser} />

  return (
    <Box sx={{bgcolor:'#f5f7fa', minHeight:'100vh'}}>
      <AppBar position="static" color="primary" sx={{mb:3}}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={()=>setDrawerOpen(true)}><MenuIcon/></IconButton>
          <Typography variant="h6" sx={{flexGrow:1}}>Home Chores</Typography>
          <Button color="inherit" startIcon={<LogoutIcon/>} onClick={()=>signOut(auth)}>Logout</Button>
        </Toolbar>
      </AppBar>
      <SectionDrawer open={drawerOpen} onClose={()=>setDrawerOpen(false)} sections={sections} onAdd={handleAddSection} onDelete={handleDeleteSection} />
      <Box sx={{maxWidth:900, mx:'auto', p:2}}>
        <Box sx={{display:'flex', alignItems:'center', gap:2, mb:2}}>
          <FormControl>
            <InputLabel>Filter by section</InputLabel>
            <Select value={filterSection} label="Filter by section" onChange={e=>setFilterSection(e.target.value)} sx={{minWidth:160}}>
              <MenuItem value="All">All</MenuItem>
              {sections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<SettingsIcon/>} onClick={()=>setDrawerOpen(true)}>Manage Sections</Button>
        </Box>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridWeek"
          locale="en"
          events={events}
          height="auto"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' }}
          eventClick={info => { setEditIdx(info.event.extendedProps.choreIdx); setModalOpen(true); }}
        />
        <Box sx={{mt:3}}>
          <Typography variant="h5" sx={{mb:1}}>Tasks</Typography>
          <List>
            {filteredChores.length === 0 && <ListItem><ListItemText primary="No tasks added yet." /></ListItem>}
            {filteredChores.map((chore, i) => (
              <ListItem key={i} secondaryAction={<IconButton edge="end" onClick={()=>{setEditIdx(i); setModalOpen(true);}}><EditIcon/></IconButton>}>
                <ListItemText primary={`${chore.name} - ${chore.startDate} ${chore.repeat ? `- Every ${chore.repeat} days` : ''} [${chore.section}]`} />
              </ListItem>
            ))}
          </List>
        </Box>
        <Fab color="primary" aria-label="add" sx={{position:'fixed', bottom:32, right:32}} onClick={()=>{setEditIdx(null); setModalOpen(true);}}>
          <AddIcon />
        </Fab>
        <TaskModal
          open={modalOpen}
          onClose={()=>{setModalOpen(false); setEditIdx(null);}}
          onSave={editIdx==null?handleAddTask:handleEditTask}
          initial={editIdx==null?null:filteredChores[editIdx]}
          sections={sections}
          onDelete={editIdx!=null?handleDeleteTask:undefined}
        />
      </Box>
    </Box>
  )
}
