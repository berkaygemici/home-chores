import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import './App.css'
import AuthPage from './AuthPage'
import { auth, db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'

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

function Modal({ open, onClose, chore, onSave, onDelete }) {
  const [name, setName] = useState(chore?.name || '')
  const [startDate, setStartDate] = useState(chore?.startDate || '')
  const [repeat, setRepeat] = useState(chore?.repeat || '')
  const [section, setSection] = useState(chore?.section || 'Other')

  useEffect(() => {
    setName(chore?.name || '')
    setStartDate(chore?.startDate || '')
    setRepeat(chore?.repeat || '')
    setSection(chore?.section || 'Other')
  }, [chore])

  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Edit Task</h2>
        <form onSubmit={e => { e.preventDefault(); onSave({ name, startDate, repeat, section }) }}>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Task name" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          <input type="number" min="0" value={repeat} onChange={e => setRepeat(e.target.value)} placeholder="Repeat (days)" />
          <select value={section} onChange={e => setSection(e.target.value)}>
            {SECTIONS.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="modal-actions">
            <button type="submit">Save</button>
            <button type="button" className="delete" onClick={onDelete}>Delete</button>
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [chores, setChores] = useState([])
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [repeat, setRepeat] = useState('')
  const [section, setSection] = useState('Other')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedChoreIdx, setSelectedChoreIdx] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filterSection, setFilterSection] = useState('All')

  // Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return unsub
  }, [])

  // Load chores from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setChores([])
      setLoading(false)
      return
    }
    setLoading(true)
    getDoc(doc(db, 'chores', user.uid))
      .then(snap => {
        if (snap.exists()) setChores(snap.data().chores || [])
        else setChores([])
        setLoading(false)
      })
      .catch(() => {
        setChores([])
        setLoading(false)
      })
    // Fallback: timeout in case Firestore hangs
    const timeout = setTimeout(() => setLoading(false), 7000)
    return () => clearTimeout(timeout)
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !startDate || !user) return
    const newChores = [...chores, { name, startDate, repeat, section }]
    await setDoc(doc(db, 'chores', user.uid), { chores: newChores }, { merge: true })
    setChores(newChores)
    setName('')
    setStartDate('')
    setRepeat('')
    setSection('Other')
  }

  const events = chores
    .filter(chore => filterSection === 'All' || chore.section === filterSection)
    .flatMap((chore, idx) => addRecurringEvents(chore, idx))

  const handleEventClick = (info) => {
    setSelectedChoreIdx(info.event.extendedProps.choreIdx)
    setModalOpen(true)
  }

  const handleModalSave = async (updated) => {
    if (selectedChoreIdx == null || !user) return
    const newChores = chores.map((c, i) => i === selectedChoreIdx ? { ...c, ...updated } : c)
    await setDoc(doc(db, 'chores', user.uid), { chores: newChores }, { merge: true })
    setChores(newChores)
    setModalOpen(false)
  }
  const handleModalDelete = async () => {
    if (selectedChoreIdx == null || !user) return
    const newChores = chores.filter((_, i) => i !== selectedChoreIdx)
    await setDoc(doc(db, 'chores', user.uid), { chores: newChores }, { merge: true })
    setChores(newChores)
    setModalOpen(false)
  }

  if (!user) return <AuthPage onAuth={setUser} />

  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>Home Chores Calendar</h1>
        <button onClick={() => signOut(auth)} style={{height:36, background:'#e11d48', color:'#fff', border:'none', borderRadius:6, fontWeight:'bold', cursor:'pointer'}}>Logout</button>
      </div>
      {loading ? <div>Loading...</div> : <>
      <form className="chore-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task name (e.g. Vacuum the house)"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          placeholder="Repeat (days) - e.g. 3"
          value={repeat}
          onChange={e => setRepeat(e.target.value)}
        />
        <select value={section} onChange={e => setSection(e.target.value)}>
          {SECTIONS.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit">Add</button>
      </form>
      <div style={{marginBottom:16}}>
        <label style={{marginRight:8}}>Filter by section:</label>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridWeek"
        locale="en"
        events={events}
        height="auto"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' }}
        eventClick={handleEventClick}
      />
      <div style={{marginTop: 24}}>
        <h2>Tasks</h2>
        <ul>
          {chores.length === 0 && <li>No tasks added yet.</li>}
          {chores.filter(chore => filterSection === 'All' || chore.section === filterSection).map((chore, i) => (
            <li key={i}>
              {chore.name} - {chore.startDate} {chore.repeat ? `- Every ${chore.repeat} days` : ''} [{chore.section}]
              <button style={{marginLeft:8}} onClick={() => {
                setSelectedChoreIdx(i); setModalOpen(true);
              }}>Edit</button>
            </li>
          ))}
        </ul>
      </div>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        chore={selectedChoreIdx !== null ? chores[selectedChoreIdx] : null}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
      </>}
    </div>
  )
}
