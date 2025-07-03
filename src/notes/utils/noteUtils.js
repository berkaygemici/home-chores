import { BACKLINK_REGEX, NOTE_STATUS } from '../constants/notesConstants'

// Generate unique note ID
export const generateNoteId = () => {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Extract backlinks from note content
export const extractBacklinks = (content) => {
  const matches = content.match(BACKLINK_REGEX)
  return matches ? matches.map(match => match.slice(2, -2).trim()) : []
}

// Find notes that link to a specific note
export const findBacklinkedNotes = (notes, targetNoteTitle) => {
  return notes.filter(note => {
    const backlinks = extractBacklinks(note.content)
    return backlinks.some(link => 
      link.toLowerCase() === targetNoteTitle.toLowerCase()
    )
  })
}

// Process markdown content to convert backlinks to links
export const processBacklinks = (content, notes, onNoteClick) => {
  return content.replace(BACKLINK_REGEX, (match, linkText) => {
    const targetNote = notes.find(note => 
      note.title.toLowerCase() === linkText.toLowerCase()
    )
    
    if (targetNote) {
      return `[${linkText}](#note-${targetNote.id})`
    } else {
      return `<span class="broken-link">${linkText}</span>`
    }
  })
}

// Calculate word count
export const calculateWordCount = (content) => {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length
}

// Search notes
export const searchNotes = (notes, query, filter = 'all') => {
  if (!query.trim()) return notes.filter(note => note.status === NOTE_STATUS.ACTIVE)
  
  const searchQuery = query.toLowerCase()
  
  return notes.filter(note => {
    if (note.status !== NOTE_STATUS.ACTIVE) return false
    
    const titleMatch = note.title.toLowerCase().includes(searchQuery)
    const contentMatch = note.content.toLowerCase().includes(searchQuery)
    const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    
    switch (filter) {
      case 'title':
        return titleMatch
      case 'content':
        return contentMatch
      case 'tags':
        return tagMatch
      default:
        return titleMatch || contentMatch || tagMatch
    }
  })
}

// Sort notes
export const sortNotes = (notes, sortOption) => {
  const sorted = [...notes]
  
  switch (sortOption) {
    case 'created_desc':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    case 'created_asc':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    case 'updated_desc':
      return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    case 'updated_asc':
      return sorted.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
    case 'title_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'title_desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
    default:
      return sorted
  }
}

// Filter notes by tag
export const filterNotesByTag = (notes, tag) => {
  return notes.filter(note => 
    note.status === NOTE_STATUS.ACTIVE && 
    note.tags.some(noteTag => noteTag.toLowerCase() === tag.toLowerCase())
  )
}

// Get all unique tags from notes
export const getAllTags = (notes) => {
  const tags = new Set()
  notes.forEach(note => {
    if (note.status === NOTE_STATUS.ACTIVE) {
      note.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
}

// Extract tags from content (looking for #tag format)
export const extractTagsFromContent = (content) => {
  const tagRegex = /#([a-zA-Z0-9_-]+)/g
  const matches = content.match(tagRegex)
  return matches ? matches.map(match => match.slice(1)) : []
}

// Format date for display
export const formatDate = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const noteDate = new Date(date)
  const diffInMinutes = Math.floor((now - noteDate) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return noteDate.toLocaleDateString()
}

// Create note graph data for visualization
export const createGraphData = (notes) => {
  const nodes = notes
    .filter(note => note.status === NOTE_STATUS.ACTIVE)
    .map(note => ({
      id: note.id,
      title: note.title,
      group: note.tags.length > 0 ? note.tags[0] : 'untagged',
      value: extractBacklinks(note.content).length + 
             findBacklinkedNotes(notes, note.title).length
    }))
  
  const links = []
  
  notes.forEach(note => {
    if (note.status !== NOTE_STATUS.ACTIVE) return
    
    const backlinks = extractBacklinks(note.content)
    backlinks.forEach(linkText => {
      const targetNote = notes.find(n => 
        n.title.toLowerCase() === linkText.toLowerCase() && 
        n.status === NOTE_STATUS.ACTIVE
      )
      
      if (targetNote) {
        links.push({
          source: note.id,
          target: targetNote.id,
          value: 1
        })
      }
    })
  })
  
  return { nodes, links }
}

// Get recently edited notes
export const getRecentNotes = (notes, limit = 10) => {
  return notes
    .filter(note => note.status === NOTE_STATUS.ACTIVE)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit)
}

// Get starred notes
export const getStarredNotes = (notes) => {
  return notes
    .filter(note => note.status === NOTE_STATUS.ACTIVE && note.starred)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

// Validate note title
export const validateNoteTitle = (title, notes, currentNoteId = null) => {
  if (!title.trim()) {
    return { valid: false, error: 'Title cannot be empty' }
  }
  
  const duplicate = notes.find(note => 
    note.title.toLowerCase() === title.toLowerCase() && 
    note.id !== currentNoteId &&
    note.status === NOTE_STATUS.ACTIVE
  )
  
  if (duplicate) {
    return { valid: false, error: 'A note with this title already exists' }
  }
  
  return { valid: true }
} 