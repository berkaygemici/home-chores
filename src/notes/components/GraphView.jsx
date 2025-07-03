import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

export default function GraphView({ notes, onNoteSelect, selectedNote }) {
  if (notes.length === 0) {
    return (
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#64748b',
        gap: 2
      }}>
        <Typography variant="h6">No Notes to Display</Typography>
        <Typography variant="body2">
          Create some notes with backlinks to see the graph view
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ 
        borderRadius: 0, 
        borderBottom: '1px solid #e0e0e0',
        p: 2
      }}>
        <Typography variant="h6">
          📊 Note Connections Graph
        </Typography>
      </Paper>

      {/* Graph Placeholder */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        color: '#64748b'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            🚧 Graph View Coming Soon
          </Typography>
          <Typography variant="body2">
            This will show an interactive graph of your note connections
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Found {notes.length} notes to visualize
          </Typography>
        </Box>
      </Box>
    </Box>
  )
} 