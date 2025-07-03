import React from 'react'
import { Box, Typography } from '@mui/material'

export default function NoteList({ notes, onNoteSelect }) {
  return (
    <Box>
      <Typography variant="h6">Note List Component</Typography>
      <Typography variant="body2" color="text.secondary">
        This component is imported but not actively used in the current layout
      </Typography>
    </Box>
  )
} 