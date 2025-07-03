import React from 'react'
import { Box, Typography } from '@mui/material'

export default function SearchBar({ query, onChange, onSearch }) {
  return (
    <Box>
      <Typography variant="h6">Search Bar Component</Typography>
      <Typography variant="body2" color="text.secondary">
        This component is imported but search functionality is integrated into Sidebar
      </Typography>
    </Box>
  )
} 