// Search utilities for NotesMaster

export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm.trim()) return text
  
  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

export const fuzzySearch = (items, searchTerm, getSearchText) => {
  if (!searchTerm.trim()) return items
  
  const term = searchTerm.toLowerCase()
  
  return items.filter(item => {
    const searchText = getSearchText(item).toLowerCase()
    return searchText.includes(term)
  })
}

export const getSearchSuggestions = (notes, query) => {
  if (!query.trim()) return []
  
  const suggestions = new Set()
  const queryLower = query.toLowerCase()
  
  notes.forEach(note => {
    // Add title suggestions
    if (note.title.toLowerCase().includes(queryLower)) {
      suggestions.add(note.title)
    }
    
    // Add tag suggestions  
    note.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.add(`#${tag}`)
      }
    })
  })
  
  return Array.from(suggestions).slice(0, 10)
} 