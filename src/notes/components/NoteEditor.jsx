import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Toolbar,
  Typography,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Divider
} from '@mui/material'
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  ViewColumn as SplitIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

import { VIEW_MODES, BACKLINK_REGEX } from '../constants/notesConstants'
import { calculateWordCount, extractBacklinks, formatDate } from '../utils/noteUtils'

export default function NoteEditor({
  note,
  onUpdateNote,
  viewMode,
  onViewModeChange,
  notes,
  onNoteSelect,
  saving
}) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [tags, setTags] = useState(note?.tags || [])
  const [newTag, setNewTag] = useState('')
  const editorRef = useRef(null)

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
      setContent(note.content || '')
      setTags(note.tags || [])
    }
  }, [note?.id])

  // Auto-save functionality
  useEffect(() => {
    if (!note) return

    const timeoutId = setTimeout(() => {
      if (title !== note.title || content !== note.content || JSON.stringify(tags) !== JSON.stringify(note.tags)) {
        onUpdateNote({ title, content, tags })
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [title, content, tags, note, onUpdateNote])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()])
      }
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const toggleStar = () => {
    onUpdateNote({ starred: !note.starred })
  }

  // Process backlinks in content
  const processedContent = content.replace(BACKLINK_REGEX, (match, linkText) => {
    const targetNote = notes.find(n => 
      n.title.toLowerCase() === linkText.toLowerCase()
    )
    return targetNote ? `[${linkText}](/note/${targetNote.id})` : match
  })

  const backlinks = extractBacklinks(content)
  const wordCount = calculateWordCount(content)

  if (!note) {
    return (
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#64748b'
      }}>
        Select a note to edit
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header Toolbar */}
      <Paper 
        elevation={1} 
        sx={{ 
          borderRadius: 0, 
          borderBottom: '1px solid #e0e0e0',
          p: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && onViewModeChange(newMode)}
              size="small"
            >
              <ToggleButton value={VIEW_MODES.EDIT}>
                <EditIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value={VIEW_MODES.SPLIT}>
                <SplitIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value={VIEW_MODES.PREVIEW}>
                <PreviewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Save Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {saving ? (
                <Typography variant="caption" color="text.secondary">
                  Saving...
                </Typography>
              ) : (
                <Typography variant="caption" color="success.main">
                  Saved
                </Typography>
              )}
              <SaveIcon fontSize="small" color={saving ? 'action' : 'success'} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Word Count */}
            <Typography variant="caption" color="text.secondary">
              {wordCount} words
            </Typography>

            {/* Star Toggle */}
            <IconButton onClick={toggleStar} size="small">
              {note.starred ? 
                <StarIcon sx={{ color: '#ffc107' }} /> : 
                <StarBorderIcon />
              }
            </IconButton>
          </Box>
        </Box>

        {/* Note Info */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Created: {formatDate(note.createdAt)} • 
            Modified: {formatDate(note.updatedAt)}
          </Typography>
        </Box>
      </Paper>

      {/* Editor Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Edit View */}
        {(viewMode === VIEW_MODES.EDIT || viewMode === VIEW_MODES.SPLIT) && (
          <Box sx={{ 
            flex: viewMode === VIEW_MODES.SPLIT ? 1 : 2, 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: viewMode === VIEW_MODES.SPLIT ? '1px solid #e0e0e0' : 'none'
          }}>
            {/* Title Input */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Note title..."
              value={title}
              onChange={handleTitleChange}
              sx={{ 
                m: 2, 
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }
              }}
            />

            {/* Tags Input */}
            <Box sx={{ mx: 2, mb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
              <TextField
                size="small"
                placeholder="Add tag... (press Enter)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleAddTag}
              />
            </Box>

            {/* Content Editor */}
            <TextField
              ref={editorRef}
              fullWidth
              multiline
              variant="outlined"
              placeholder="Start writing your note... Use [[Note Title]] for backlinks"
              value={content}
              onChange={handleContentChange}
              sx={{ 
                flex: 1,
                mx: 2,
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  height: '100%',
                  alignItems: 'flex-start',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                },
                '& .MuiInputBase-inputMultiline': {
                  height: '100% !important',
                  overflow: 'auto !important'
                }
              }}
            />

            {/* Backlinks Display */}
            {backlinks.length > 0 && (
              <Box sx={{ mx: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Linked Notes:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {backlinks.map(link => {
                    const linkedNote = notes.find(n => 
                      n.title.toLowerCase() === link.toLowerCase()
                    )
                    return (
                      <Chip
                        key={link}
                        label={link}
                        onClick={() => linkedNote && onNoteSelect(linkedNote)}
                        size="small"
                        variant="outlined"
                        color={linkedNote ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer' }}
                      />
                    )
                  })}
                </Stack>
              </Box>
            )}
          </Box>
        )}

        {/* Preview View */}
        {(viewMode === VIEW_MODES.PREVIEW || viewMode === VIEW_MODES.SPLIT) && (
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            p: 2,
            backgroundColor: '#fafafa'
          }}>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              {title || 'Untitled'}
            </Typography>

            {tags.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                {tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" color="primary" />
                ))}
              </Stack>
            )}

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {processedContent || '*Start writing to see preview...*'}
            </ReactMarkdown>
          </Box>
        )}
      </Box>
    </Box>
  )
} 