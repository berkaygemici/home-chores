import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Stack,
  Divider
} from '@mui/material'
import {
  Notes as NotesIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Create as CreateIcon,
  Schedule as ScheduleIcon,
  Tag as TagIcon
} from '@mui/icons-material'

import { formatDate, getAllTags, getRecentNotes, calculateWordCount } from '../utils/noteUtils'
import { NOTE_STATUS } from '../constants/notesConstants'

export default function Dashboard({ notes, onNoteSelect, onCreateNote }) {
  const activeNotes = notes.filter(note => note.status === NOTE_STATUS.ACTIVE)
  const starredNotes = activeNotes.filter(note => note.starred)
  const recentNotes = getRecentNotes(notes, 5)
  const allTags = getAllTags(notes)
  
  // Calculate stats
  const totalWordCount = activeNotes.reduce((total, note) => 
    total + calculateWordCount(note.content || ''), 0
  )
  
  const averageWordsPerNote = activeNotes.length > 0 ? 
    Math.round(totalWordCount / activeNotes.length) : 0

  // Get notes created this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const notesThisWeek = activeNotes.filter(note => 
    new Date(note.createdAt) > oneWeekAgo
  ).length

  // Most used tags
  const tagCounts = {}
  activeNotes.forEach(note => {
    note.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  const topTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  const stats = [
    {
      title: 'Total Notes',
      value: activeNotes.length,
      icon: <NotesIcon />,
      color: '#1976d2'
    },
    {
      title: 'Starred Notes',
      value: starredNotes.length,
      icon: <StarIcon />,
      color: '#ffc107'
    },
    {
      title: 'Total Words',
      value: totalWordCount.toLocaleString(),
      icon: <CreateIcon />,
      color: '#4caf50'
    },
    {
      title: 'This Week',
      value: notesThisWeek,
      icon: <TrendingUpIcon />,
      color: '#ff5722'
    }
  ]

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          📊 Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your note-taking overview and insights
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            startIcon={<CreateIcon />}
            onClick={onCreateNote}
          >
            New Note
          </Button>
          <Button 
            variant="outlined"
            onClick={() => onNoteSelect && starredNotes[0] && onNoteSelect(starredNotes[0])}
            disabled={starredNotes.length === 0}
          >
            Open Starred Note
          </Button>
        </Stack>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${stat.color}10 0%, ${stat.color}05 100%)`
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ 
                    color: stat.color, 
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Notes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ScheduleIcon sx={{ mr: 1, color: '#666' }} />
              <Typography variant="h6">
                Recent Notes
              </Typography>
            </Box>
            {recentNotes.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '60%',
                color: '#64748b'
              }}>
                <Typography>No notes yet. Create your first note!</Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentNotes.map((note, index) => (
                  <React.Fragment key={note.id}>
                    <ListItem 
                      button 
                      onClick={() => onNoteSelect && onNoteSelect(note)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
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
                              {formatDate(note.updatedAt)} • {calculateWordCount(note.content || '')} words
                            </Typography>
                            {note.tags.length > 0 && (
                              <Box sx={{ mt: 0.5 }}>
                                {note.tags.slice(0, 3).map(tag => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, fontSize: '0.7rem', height: 20 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentNotes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Tags & Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TagIcon sx={{ mr: 1, color: '#666' }} />
              <Typography variant="h6">
                Popular Tags
              </Typography>
            </Box>
            
            {topTags.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '40%',
                color: '#64748b'
              }}>
                <Typography>No tags yet. Add tags to your notes!</Typography>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                {topTags.map(([tag, count]) => (
                  <Box key={tag} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <Chip 
                      label={tag} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                    <Typography variant="body2" color="text.secondary">
                      {count} note{count !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />
            
            {/* Additional Stats */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Additional Stats
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Average words per note:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {averageWordsPerNote}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total tags:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {allTags.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Notes created this week:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {notesThisWeek}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
} 