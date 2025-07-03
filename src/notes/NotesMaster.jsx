import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Container,
  Paper,
  Grid,
  Snackbar,
  Alert,
  Backdrop,
  CircularProgress
} from '@mui/material'

import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

import Sidebar from './components/Sidebar'
import NoteEditor from './components/NoteEditor'
import NoteList from './components/NoteList'
import SearchBar from './components/SearchBar'
import GraphView from './components/GraphView'
import Dashboard from './components/Dashboard'

import { 
  generateNoteId, 
  searchNotes, 
  sortNotes, 
  getAllTags,
  calculateWordCount 
} from './utils/noteUtils'

import { 
  DEFAULT_NOTE, 
  NOTE_STATUS, 
  VIEW_MODES, 
  AUTOSAVE_DELAY, 
  SORT_OPTIONS 
} from './constants/notesConstants'

export default function NotesMaster({ user, onBack }) {
  const [notes, setNotes] = useState([])
  const [currentNote, setCurrentNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.UPDATED_DESC)
  const [viewMode, setViewMode] = useState(VIEW_MODES.SPLIT)
  const [showSidebar, setShowSidebar] = useState(true)
  const [currentView, setCurrentView] = useState('notes') // notes, graph, dashboard
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Load notes from Firebase
  useEffect(() => {
    if (!user) {
      setNotes([])
      setLoading(false)
      return
    }

    const loadNotes = async () => {
      try {
        const notesDoc = await getDoc(doc(db, 'notesmaster_notes', user.uid))
        if (notesDoc.exists()) {
          const data = notesDoc.data()
          setNotes(data.notes || [])
          
          // Auto-select most recent note if none selected
          if (data.notes && data.notes.length > 0 && !currentNote) {
            const sortedNotes = sortNotes(data.notes.filter(n => n.status === NOTE_STATUS.ACTIVE), SORT_OPTIONS.UPDATED_DESC)
            if (sortedNotes.length > 0) {
              setCurrentNote(sortedNotes[0])
            }
          }
        }
      } catch (error) {
        console.error('Failed to load notes:', error)
        showSnackbar('Failed to load notes', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [user])

  // Auto-save functionality
  useEffect(() => {
    if (!currentNote || !user) return

    const timeoutId = setTimeout(async () => {
      await saveNotes(notes)
    }, AUTOSAVE_DELAY)

    return () => clearTimeout(timeoutId)
  }, [currentNote, notes, user])

  // Save notes to Firebase
  const saveNotes = async (notesToSave) => {
    if (!user) return

    setSaving(true)
    try {
      await setDoc(doc(db, 'notesmaster_notes', user.uid), { 
        notes: notesToSave,
        lastUpdated: new Date().toISOString()
      }, { merge: true })
    } catch (error) {
      console.error('Failed to save notes:', error)
      showSnackbar('Failed to save notes', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Create new note
  const handleCreateNote = useCallback(() => {
    const newNote = {
      ...DEFAULT_NOTE,
      id: generateNoteId(),
      title: `Note ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedNotes = [newNote, ...notes]
    setNotes(updatedNotes)
    setCurrentNote(newNote)
    showSnackbar('New note created! ✨')
  }, [notes])

  // Update current note
  const handleUpdateNote = useCallback((updates) => {
    if (!currentNote) return

    const updatedNote = {
      ...currentNote,
      ...updates,
      updatedAt: new Date().toISOString(),
      wordCount: calculateWordCount(updates.content || currentNote.content)
    }

    const updatedNotes = notes.map(note =>
      note.id === currentNote.id ? updatedNote : note
    )

    setNotes(updatedNotes)
    setCurrentNote(updatedNote)
  }, [currentNote, notes])

  // Delete note (move to trash)
  const handleDeleteNote = useCallback((noteId) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId 
        ? { ...note, status: NOTE_STATUS.DELETED, updatedAt: new Date().toISOString() }
        : note
    )

    setNotes(updatedNotes)
    
    // If current note was deleted, select another note
    if (currentNote?.id === noteId) {
      const activeNotes = updatedNotes.filter(n => n.status === NOTE_STATUS.ACTIVE)
      setCurrentNote(activeNotes.length > 0 ? activeNotes[0] : null)
    }

    showSnackbar('Note moved to trash')
  }, [currentNote, notes])

  // Toggle note star
  const handleToggleStar = useCallback((noteId) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId 
        ? { ...note, starred: !note.starred, updatedAt: new Date().toISOString() }
        : note
    )

    setNotes(updatedNotes)
    
    if (currentNote?.id === noteId) {
      setCurrentNote(prev => ({ ...prev, starred: !prev.starred }))
    }
  }, [currentNote, notes])

  // Get filtered and sorted notes
  const getFilteredNotes = () => {
    let filtered = notes.filter(note => note.status === NOTE_STATUS.ACTIVE)
    
    if (searchQuery) {
      filtered = searchNotes(filtered, searchQuery)
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.some(tag => note.tags.includes(tag))
      )
    }
    
    return sortNotes(filtered, sortOption)
  }

  const filteredNotes = getFilteredNotes()
  const allTags = getAllTags(notes)

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Box sx={{ color: '#64748b', fontSize: '18px' }}>
            Loading NotesMaster...
          </Box>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', p: 0 }}>
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Sidebar */}
        {showSidebar && (
          <Paper 
            elevation={1} 
            sx={{ 
              width: 300, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 0
            }}
          >
            <Sidebar
              currentView={currentView}
              onViewChange={setCurrentView}
              onCreateNote={handleCreateNote}
              onBack={onBack}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOption={sortOption}
              onSortChange={setSortOption}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              allTags={allTags}
              notes={filteredNotes}
              currentNote={currentNote}
              onNoteSelect={setCurrentNote}
              onToggleStar={handleToggleStar}
              onDeleteNote={handleDeleteNote}
            />
          </Paper>
        )}

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentView === 'notes' && (
            <>
              {currentNote ? (
                <NoteEditor
                  note={currentNote}
                  onUpdateNote={handleUpdateNote}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  notes={notes}
                  onNoteSelect={setCurrentNote}
                  saving={saving}
                />
              ) : (
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '18px'
                }}>
                  Select a note to start editing, or create a new one
                </Box>
              )}
            </>
          )}

          {currentView === 'graph' && (
            <GraphView
              notes={notes.filter(n => n.status === NOTE_STATUS.ACTIVE)}
              onNoteSelect={setCurrentNote}
              selectedNote={currentNote}
            />
          )}

          {currentView === 'dashboard' && (
            <Dashboard
              notes={notes}
              onNoteSelect={setCurrentNote}
              onCreateNote={handleCreateNote}
            />
          )}
        </Box>
      </Box>

      {/* Loading/Saving Indicator */}
      <Backdrop open={saving} sx={{ zIndex: 1500 }}>
        <CircularProgress size={30} sx={{ color: 'white' }} />
      </Backdrop>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
} 