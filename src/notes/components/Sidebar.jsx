import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Stack
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  Filter as FilterIcon,
  Notes as NotesIcon,
  Dashboard as DashboardIcon,
  AccountTree as GraphIcon,
  ArrowBack as ArrowBackIcon,
  Clear as ClearIcon
} from '@mui/icons-material'

import { formatDate } from '../utils/noteUtils'

export default function Sidebar({
  currentView,
  onViewChange,
  onCreateNote,
  onBack,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  selectedTags,
  onTagsChange,
  allTags,
  notes,
  currentNote,
  onNoteSelect,
  onToggleStar,
  onDeleteNote
}) {
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={onBack} size="small" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            📝 NotesMaster
          </Typography>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
          {[
            { key: 'notes', label: 'Notes', icon: <NotesIcon /> },
            { key: 'graph', label: 'Graph', icon: <GraphIcon /> },
            { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> }
          ].map(({ key, label, icon }) => (
            <Button
              key={key}
              variant={currentView === key ? 'contained' : 'outlined'}
              size="small"
              startIcon={icon}
              onClick={() => onViewChange(key)}
              sx={{ 
                minWidth: 'auto',
                flex: 1,
                fontSize: '0.75rem',
                py: 0.5
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* Create Note Button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNote}
          sx={{ mb: 2 }}
        >
          New Note
        </Button>

        {/* Search Bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* Sort Controls */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Tooltip title="Sort options">
            <IconButton 
              size="small" 
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
            >
              <SortIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Notes List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {notes.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: '#64748b' }}>
            <Typography variant="body2">
              {searchQuery ? 'No notes match your search' : 'No notes yet'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notes.map((note) => (
              <ListItem key={note.id} disablePadding>
                <ListItemButton
                  selected={currentNote?.id === note.id}
                  onClick={() => onNoteSelect(note)}
                  sx={{ 
                    py: 1.5,
                    borderBottom: '1px solid #f0f0f0',
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      borderLeft: '3px solid #1976d2'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 'medium',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {note.title}
                        </Typography>
                        {note.starred && (
                          <StarIcon fontSize="small" sx={{ color: '#ffc107' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(note.updatedAt)}
                        </Typography>
                        {note.content && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mt: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem'
                            }}
                          >
                            {note.content.substring(0, 60)}...
                          </Typography>
                        )}
                        {note.tags.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {note.tags.slice(0, 2).map(tag => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, fontSize: '0.7rem', height: 20 }}
                              />
                            ))}
                            {note.tags.length > 2 && (
                              <Typography variant="caption" color="text.secondary">
                                +{note.tags.length - 2} more
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleStar(note.id)
                      }}
                    >
                      {note.starred ? 
                        <StarIcon fontSize="small" sx={{ color: '#ffc107' }} /> : 
                        <StarBorderIcon fontSize="small" />
                      }
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNote(note.id)
                      }}
                      sx={{ color: '#f44336' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        {[
          { value: 'updated_desc', label: 'Last Modified' },
          { value: 'created_desc', label: 'Newest First' },
          { value: 'created_asc', label: 'Oldest First' },
          { value: 'title_asc', label: 'Title A-Z' },
          { value: 'title_desc', label: 'Title Z-A' }
        ].map(option => (
          <MenuItem
            key={option.value}
            selected={sortOption === option.value}
            onClick={() => {
              onSortChange(option.value)
              setSortMenuAnchor(null)
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
} 