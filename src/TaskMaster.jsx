import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Typography, Paper, IconButton, Chip, Grid, Card, CardContent, Stack, Avatar,
  Menu, MenuItem, Divider, Container, useTheme, useMediaQuery, FormControl,
  InputLabel, Select, ListItemIcon, ListItemText, Tab, Tabs, Badge, Autocomplete,
  List, ListItem, ListItemAvatar, ListItemButton, Snackbar, Alert, Tooltip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RestoreIcon from '@mui/icons-material/Restore'
import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import FlagIcon from '@mui/icons-material/Flag'
import CommentIcon from '@mui/icons-material/Comment'
import SendIcon from '@mui/icons-material/Send'
import BacklogIcon from '@mui/icons-material/Inventory'
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EmailIcon from '@mui/icons-material/Email'
import LinkIcon from '@mui/icons-material/Link'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { format } from 'date-fns'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981', bgcolor: '#f0fdf4' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', bgcolor: '#fffbeb' },
  { value: 'high', label: 'High', color: '#ef4444', bgcolor: '#fef2f2' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626', bgcolor: '#fef2f2' }
]

// Default project members (can be extended to load from Firebase)
const DEFAULT_MEMBERS = [
  { id: 'user1', name: 'John Doe', email: 'john@example.com', avatar: 'JD' },
  { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'JS' },
  { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ' },
  { id: 'user4', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'SW' }
]

// User roles
const USER_ROLES = [
  { value: 'admin', label: 'Admin', color: '#dc2626' },
  { value: 'member', label: 'Member', color: '#2563eb' },
  { value: 'viewer', label: 'Viewer', color: '#64748b' }
]

// Project Modal Component
function ProjectModal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
    }
  }, [open])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim() })
    setName('')
    setDescription('')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.35rem', color: '#2563eb' }}>
        Create New Project
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          fullWidth
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 99, fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim()}
          sx={{ borderRadius: 99, fontWeight: 600 }}
        >
          Create Project
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Project Settings Modal Component
function ProjectSettingsModal({ open, onClose, project, onUpdateProject, currentUser }) {
  const [activeTab, setActiveTab] = useState(0)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [members, setMembers] = useState([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    if (project) {
      setProjectName(project.name || '')
      setProjectDescription(project.description || '')
      setMembers(project.members || [currentUser])
    }
  }, [project, currentUser])

  const handleSaveProject = () => {
    const updatedProject = {
      ...project,
      name: projectName.trim(),
      description: projectDescription.trim(),
      members,
      updatedAt: new Date().toISOString()
    }
    onUpdateProject(updatedProject)
    setSnackbar({ open: true, message: 'Project updated successfully!', severity: 'success' })
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return

    // Check if user already exists in project
    if (members.find(m => m.email === inviteEmail.trim())) {
      setSnackbar({ open: true, message: 'User is already a member of this project!', severity: 'warning' })
      return
    }

    // Create invitation
    const invitation = {
      id: Date.now().toString(),
      email: inviteEmail.trim(),
      role: inviteRole,
      invitedBy: currentUser,
      invitedAt: new Date().toISOString(),
      status: 'pending'
    }

    // Generate invitation link
    const inviteLink = `${window.location.origin}/invite/${project.id}/${invitation.id}`
    
    try {
      // Send invitation email
      await sendInvitationEmail(inviteEmail.trim(), project.name, inviteLink, currentUser.name)
      
      // Add to project invitations
      const updatedProject = {
        ...project,
        invitations: [...(project.invitations || []), invitation],
        updatedAt: new Date().toISOString()
      }
      
      onUpdateProject(updatedProject)
      setInviteEmail('')
      setSnackbar({ open: true, message: 'Invitation sent successfully!', severity: 'success' })
    } catch (error) {
      console.error('Failed to send invitation:', error)
      setSnackbar({ open: true, message: 'Failed to send invitation. Please try again.', severity: 'error' })
    }
  }

  const handleRemoveMember = (memberId) => {
    if (memberId === currentUser.id) {
      setSnackbar({ open: true, message: 'You cannot remove yourself from the project!', severity: 'warning' })
      return
    }

    const updatedMembers = members.filter(m => m.id !== memberId)
    setMembers(updatedMembers)
    
    const updatedProject = {
      ...project,
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    }
    onUpdateProject(updatedProject)
    setSnackbar({ open: true, message: 'Member removed successfully!', severity: 'success' })
  }

  const copyInviteLink = (invitationId) => {
    const inviteLink = `${window.location.origin}/invite/${project.id}/${invitationId}`
    navigator.clipboard.writeText(inviteLink)
    setSnackbar({ open: true, message: 'Invitation link copied to clipboard!', severity: 'success' })
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.35rem', color: '#2563eb', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon />
            Project Settings
          </Box>
        </DialogTitle>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="General" />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Members
                <Badge badgeContent={members.length} color="primary" />
              </Box>
            } />
            <Tab label="Invitations" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 3, minHeight: 400 }}>
          {/* General Tab */}
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Project Description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                multiline
                rows={4}
                fullWidth
                variant="outlined"
              />
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                  Project Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Created: ${format(new Date(project?.createdAt || Date.now()), 'MMM dd, yyyy')}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Tasks: ${project?.tasks?.length || 0}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Members: ${members.length}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Members Tab */}
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Project Members ({members.length})
              </Typography>
              
              <List sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}>
                {members.map((member) => (
                  <ListItem key={member.id} sx={{ py: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#2563eb' }}>
                        {member.avatar}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.name}
                      secondary={member.email}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={member.role || 'Member'}
                        size="small"
                        sx={{ 
                          bgcolor: member.id === currentUser.id ? '#dcfce7' : '#e0e7ff',
                          color: member.id === currentUser.id ? '#166534' : '#1e40af'
                        }}
                      />
                      {member.id !== currentUser.id && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Invitations Tab */}
          {activeTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Invite New Members
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <TextField
                  label="Email Address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                  fullWidth
                  variant="outlined"
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={inviteRole}
                    label="Role"
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    {USER_ROLES.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<EmailIcon />}
                  onClick={handleInviteUser}
                  disabled={!inviteEmail.trim()}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Send Invite
                </Button>
              </Box>

              {/* Pending Invitations */}
              {project?.invitations && project.invitations.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pending Invitations ({project.invitations.filter(i => i.status === 'pending').length})
                  </Typography>
                  
                  <List sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}>
                    {project.invitations
                      .filter(invitation => invitation.status === 'pending')
                      .map((invitation) => (
                        <ListItem key={invitation.id} sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#f59e0b' }}>
                              <EmailIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={invitation.email}
                            secondary={`Invited by ${invitation.invitedBy?.name} • ${format(new Date(invitation.invitedAt), 'MMM dd, yyyy')}`}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={invitation.role}
                              size="small"
                              sx={{ bgcolor: '#fef3c7', color: '#92400e' }}
                            />
                            <Tooltip title="Copy invitation link">
                              <IconButton
                                size="small"
                                onClick={() => copyInviteLink(invitation.id)}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                      ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={onClose} sx={{ borderRadius: 99, fontWeight: 600 }}>
            Cancel
          </Button>
          {activeTab === 0 && (
            <Button
              variant="contained"
              onClick={handleSaveProject}
              sx={{ borderRadius: 99, fontWeight: 600 }}
            >
              Save Changes
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

async function sendInvitationEmail(email, projectName, inviteLink, inviterName) {
  const response = await fetch('https://us-central1-home-chores-217b8.cloudfunctions.net/sendInvitation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: email,
      projectName,
      inviteLink,
      inviterName
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to send invitation email')
  }
  
  return response.json()
}

// Task Modal Component
function TaskModal({ open, onClose, onSave, initial, currentUser }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState(null)
  const [priority, setPriority] = useState('medium')

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDescription(initial?.description || '')
      setAssignee(initial?.assignee || null)
      setPriority(initial?.priority || 'medium')
    }
  }, [open, initial])

  const handleSave = () => {
    if (!title.trim()) return
    
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      assignee,
      priority,
      reporter: currentUser || DEFAULT_MEMBERS[0], // Current user as reporter
      comments: initial?.comments || [],
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    onSave(taskData)
    setTitle('')
    setDescription('')
    setAssignee(null)
    setPriority('medium')
  }

  const getPriorityConfig = (priorityValue) => {
    return PRIORITY_OPTIONS.find(p => p.value === priorityValue) || PRIORITY_OPTIONS[1]
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.35rem', color: '#2563eb' }}>
        {initial ? 'Edit Task' : 'Create New Task'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
        <TextField
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          fullWidth
          variant="outlined"
        />
        
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          placeholder="Describe what needs to be done..."
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Autocomplete
            options={DEFAULT_MEMBERS}
            getOptionLabel={(option) => option.name}
            value={assignee}
            onChange={(event, newValue) => setAssignee(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Assignee" 
                placeholder="Choose assignee..."
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#2563eb' }}>
                  {option.avatar}
                </Avatar>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>{option.email}</Typography>
                </Box>
              </Box>
            )}
          />

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlagIcon sx={{ color: option.color, fontSize: 16 }} />
                    <Typography>{option.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {initial && (
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
              Task Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<PersonIcon />}
                label={`Reporter: ${initial.reporter?.name || 'Unknown'}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Created: ${format(new Date(initial.createdAt), 'MMM dd, yyyy')}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 99, fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!title.trim()}
          sx={{ borderRadius: 99, fontWeight: 600 }}
        >
          {initial ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Task Detail Modal Component (Jira-inspired)
function TaskDetailModal({ task, open, onClose, onUpdate, onDelete, onStatusChange, currentUser }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState(null)
  const [priority, setPriority] = useState('medium')
  const [newComment, setNewComment] = useState('')
  const [anchorEl, setAnchorEl] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setAssignee(task.assignee || null)
      setPriority(task.priority || 'medium')
    }
  }, [task])

  const handleSave = () => {
    onUpdate({ 
      title: title.trim(), 
      description: description.trim(),
      assignee,
      priority,
      updatedAt: new Date().toISOString()
    })
    setEditing(false)
  }

  const handleStatusChange = (newStatus) => {
    onStatusChange(task.id, newStatus)
    setAnchorEl(null)
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    
    const comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: currentUser || DEFAULT_MEMBERS[0],
      createdAt: new Date().toISOString()
    }
    
    const updatedComments = [...(task.comments || []), comment]
    onUpdate({ comments: updatedComments })
    setNewComment('')
  }

  const getPriorityConfig = (priorityValue) => {
    return PRIORITY_OPTIONS.find(p => p.value === priorityValue) || PRIORITY_OPTIONS[1]
  }

  if (!task) return null

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e7ff',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32 }}>
            {task.title?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Task Details
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Details" />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Comments
                  <Badge badgeContent={task.comments?.length || 0} color="primary" />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Details Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Title Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                  Title
                </Typography>
                {editing ? (
                  <TextField
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    variant="outlined"
                    autoFocus
                  />
                ) : (
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      p: 1.5,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#f8fafc' }
                    }}
                    onClick={() => setEditing(true)}
                  >
                    {task.title}
                  </Typography>
                )}
              </Box>

              {/* Status and Priority Section */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                    Status
                  </Typography>
                  <Chip
                    label={task.status === 'todo' ? 'TO DO' : task.status === 'inprogress' ? 'IN PROGRESS' : task.status === 'done' ? 'DONE' : 'BACKLOG'}
                    sx={{
                      bgcolor: task.status === 'todo' ? '#fef3c7' : task.status === 'inprogress' ? '#dbeafe' : task.status === 'done' ? '#d1fae5' : '#f3f4f6',
                      color: task.status === 'todo' ? '#92400e' : task.status === 'inprogress' ? '#1e40af' : task.status === 'done' ? '#065f46' : '#374151',
                      fontWeight: 600
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                    Priority
                  </Typography>
                  {editing ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        {PRIORITY_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FlagIcon sx={{ color: option.color, fontSize: 16 }} />
                              <Typography>{option.label}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      icon={<FlagIcon />}
                      label={getPriorityConfig(task.priority).label}
                      sx={{
                        bgcolor: getPriorityConfig(task.priority).bgcolor,
                        color: getPriorityConfig(task.priority).color,
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Assignee and Reporter Section */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                    Assignee
                  </Typography>
                  {editing ? (
                    <Autocomplete
                      options={DEFAULT_MEMBERS}
                      getOptionLabel={(option) => option.name}
                      value={assignee}
                      onChange={(event, newValue) => setAssignee(newValue)}
                      size="small"
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          placeholder="Choose assignee..."
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#2563eb' }}>
                            {option.avatar}
                          </Avatar>
                          <Typography variant="body2">{option.name}</Typography>
                        </Box>
                      )}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {task.assignee ? (
                        <>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#2563eb' }}>
                            {task.assignee.avatar}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {task.assignee.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {task.assignee.email}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Typography sx={{ color: '#94a3b8' }}>Unassigned</Typography>
                      )}
                    </Box>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                    Reporter
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#10b981' }}>
                      {task.reporter?.avatar || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {task.reporter?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {task.reporter?.email || 'No email'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Description Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                  Description
                </Typography>
                {editing ? (
                  <TextField
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Add a description..."
                  />
                ) : (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      cursor: 'pointer',
                      minHeight: 80,
                      '&:hover': { bgcolor: '#f1f5f9' }
                    }}
                    onClick={() => setEditing(true)}
                  >
                    <Typography sx={{ color: description ? '#334155' : '#94a3b8' }}>
                      {description || 'Click to add a description...'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Timestamps */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                    Created
                  </Typography>
                  <Typography sx={{ color: '#64748b' }}>
                    {format(new Date(task.createdAt), 'MMM dd, yyyy • HH:mm')}
                  </Typography>
                </Box>
                {task.updatedAt && task.updatedAt !== task.createdAt && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                      Updated
                    </Typography>
                    <Typography sx={{ color: '#64748b' }}>
                      {format(new Date(task.updatedAt), 'MMM dd, yyyy • HH:mm')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* Comments Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Add Comment */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#2563eb' }}>
                  {currentUser?.avatar || DEFAULT_MEMBERS[0].avatar}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    variant="outlined"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleAddComment()
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Press Ctrl+Enter to send
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SendIcon />}
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      sx={{ borderRadius: 2 }}
                    >
                      Comment
                    </Button>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Comments List */}
              {task.comments && task.comments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {task.comments.map((comment) => (
                    <Box key={comment.id} sx={{ display: 'flex', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#10b981' }}>
                        {comment.author?.avatar || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {comment.author?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {format(new Date(comment.createdAt), 'MMM dd, yyyy • HH:mm')}
                          </Typography>
                        </Box>
                        <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {comment.text}
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CommentIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                    No comments yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Be the first to add a comment to this task
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        {editing ? (
          <>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save Changes</Button>
          </>
        ) : (
          <>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => {
                if (window.confirm('Delete this task?')) {
                  onDelete(task.id)
                  onClose()
                }
              }}
            >
              Delete
            </Button>
            <Button variant="outlined" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </>
        )}
      </DialogActions>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleStatusChange('todo')}>
          <RestoreIcon sx={{ mr: 1 }} />
          Move to TO DO
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('inprogress')}>
          <PlayArrowIcon sx={{ mr: 1 }} />
          Move to IN PROGRESS
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('done')}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Move to DONE
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (window.confirm('Delete this task?')) {
              onDelete(task.id)
              onClose()
            }
            setAnchorEl(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Task
        </MenuItem>
      </Menu>
    </Dialog>
  )
}

// Draggable Task Card Component
function TaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const getPriorityConfig = (priorityValue) => {
    return PRIORITY_OPTIONS.find(p => p.value === priorityValue) || PRIORITY_OPTIONS[1]
  }

  const handleCardClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  }

      return (
      <Card
        ref={setNodeRef}
        style={style}
        sx={{
          mb: 1.5,
          cursor: 'pointer',
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <CardContent 
          sx={{ p: 2, '&:last-child': { pb: 2 } }}
          onClick={handleCardClick}
        >
          {/* Drag Handle - small area for dragging */}
          <Box 
            {...attributes}
            {...listeners}
            sx={{ 
              position: 'absolute',
              top: 8,
              right: 8,
              width: 20,
              height: 20,
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              '&:hover': {
                bgcolor: '#f1f5f9'
              },
              '&:active': {
                cursor: 'grabbing'
              }
            }}
          >
            <Box sx={{ 
              width: 2, 
              height: 8, 
              bgcolor: '#cbd5e1', 
              borderRadius: 1,
              mr: 0.5
            }} />
            <Box sx={{ 
              width: 2, 
              height: 8, 
              bgcolor: '#cbd5e1', 
              borderRadius: 1
            }} />
          </Box>

          {/* Priority indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, pr: 3 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600, 
                flex: 1,
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                color: task.status === 'done' ? '#64748b' : '#1e293b'
              }}
            >
              {task.title}
            </Typography>
            <FlagIcon 
              sx={{ 
                color: getPriorityConfig(task.priority).color, 
                fontSize: 16, 
                ml: 1 
              }} 
            />
          </Box>
        
        {task.description && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b', 
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {task.description}
          </Typography>
        )}
        
        {/* Assignee and metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {task.assignee ? (
              <Avatar sx={{ width: 24, height: 24, bgcolor: '#2563eb', fontSize: '0.75rem' }}>
                {task.assignee.avatar}
              </Avatar>
            ) : (
              <Avatar sx={{ width: 24, height: 24, bgcolor: '#cbd5e1', fontSize: '0.75rem' }}>
                ?
              </Avatar>
            )}
            {task.comments && task.comments.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CommentIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {task.comments.length}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {format(new Date(task.createdAt), 'MMM dd')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

// Droppable Column Component
function DroppableColumn({ id, children, isOver }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <Box 
      ref={setNodeRef}
      sx={{ 
        minHeight: 200, 
        p: 1,
        borderRadius: 2,
        backgroundColor: isOver ? '#f0f9ff' : '#fafafa',
        border: isOver ? '2px dashed #3b82f6' : '2px dashed transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </Box>
  )
}

export default function TaskMaster({ user, onBack }) {
  // TASKMASTER state
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [activeView, setActiveView] = useState('board') // 'board' or 'backlog'
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Map user to DEFAULT_MEMBERS format for consistency
  const currentUser = user ? {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email,
    avatar: user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
  } : DEFAULT_MEMBERS[0]
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Load TASKMASTER projects from Firestore
  useEffect(() => {
    if (!user) {
      setProjects([])
      return
    }
    getDoc(doc(db, 'taskmaster_projects', user.uid)).then(projectSnap => {
      setProjects(projectSnap.exists() ? projectSnap.data().projects || [] : [])
    }).catch(() => {
      setProjects([])
    })
  }, [user])

  // TASKMASTER handlers
  const saveProjects = async (newProjects) => {
    if (!user) return
    await setDoc(doc(db, 'taskmaster_projects', user.uid), { projects: newProjects }, { merge: true })
    setProjects(newProjects)
  }

  const handleCreateProject = async (projectData) => {
    const newProject = {
      id: Date.now().toString(),
      name: projectData.name,
      description: projectData.description || '',
      createdAt: new Date().toISOString(),
      tasks: []
    }
    await saveProjects([...projects, newProject])
    setProjectModalOpen(false)
  }

  const handleDeleteProject = async (projectId) => {
    const newProjects = projects.filter(p => p.id !== projectId)
    await saveProjects(newProjects)
    if (selectedProject?.id === projectId) {
      setSelectedProject(null)
    }
  }

  const handleUpdateProject = async (updatedProject) => {
    const newProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
  }

  const handleCreateTask = async (taskData) => {
    if (!selectedProject) return
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description || '',
      status: activeView === 'backlog' ? 'backlog' : 'todo',
      assignee: taskData.assignee,
      reporter: taskData.reporter || currentUser,
      priority: taskData.priority || 'medium',
      comments: taskData.comments || [],
      createdAt: taskData.createdAt || new Date().toISOString(),
      updatedAt: taskData.updatedAt || new Date().toISOString()
    }
    const updatedProject = {
      ...selectedProject,
      tasks: [...selectedProject.tasks, newTask]
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
    setTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (!selectedProject) return
    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
  }

  const handleEditProjectTask = async (taskData) => {
    if (!selectedProject || !editingTask) return
    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.map(task => 
        task.id === editingTask.id ? { 
          ...task, 
          title: taskData.title, 
          description: taskData.description || '',
          assignee: taskData.assignee,
          priority: taskData.priority,
          updatedAt: taskData.updatedAt || new Date().toISOString()
        } : task
      )
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
    setTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleDeleteProjectTask = async (taskId) => {
    if (!selectedProject) return
    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.filter(task => task.id !== taskId)
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
  }

  // Drag and drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !selectedProject) return

    const taskId = active.id
    const newStatus = over.id

    if (newStatus === 'backlog' || newStatus === 'todo' || newStatus === 'inprogress' || newStatus === 'done') {
      handleUpdateTaskStatus(taskId, newStatus)
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }

  const handleTaskUpdate = async (taskData) => {
    if (!selectedProject || !selectedTask) return
    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.map(task => 
        task.id === selectedTask.id ? { ...task, ...taskData } : task
      )
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
    setSelectedTask({ ...selectedTask, ...taskData })
  }

  // TASKMASTER Implementation - Project list view
  if (!selectedProject) {
    return (
      <Container maxWidth={false} sx={{ 
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        py: 3,
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          mb: 4,
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2, fontWeight: 600 }}
              onClick={onBack}
            >
              Back to App
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ViewKanbanIcon sx={{ fontSize: 36, color: '#2563eb' }} />
              <Box>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, color: '#1e293b' }}>
                  TASKMASTER
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Manage your projects and track progress
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }
            }}
            onClick={() => setProjectModalOpen(true)}
          >
            Create Project
          </Button>
        </Box>

        {projects.length === 0 ? (
          <Paper sx={{ 
            textAlign: 'center', 
            py: 8, 
            px: 4,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            bgcolor: '#fff'
          }}>
            <ViewKanbanIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 3 }} />
            <Typography variant="h5" sx={{ color: '#1e293b', mb: 2, fontWeight: 600 }}>
              No projects yet
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: 400, mx: 'auto' }}>
              Create your first project to start organizing tasks and tracking progress with our kanban-style board
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: 2, 
                fontWeight: 600,
                py: 1.5,
                px: 4,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
              onClick={() => setProjectModalOpen(true)}
            >
              Create Your First Project
            </Button>
          </Paper>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 3
          }}>
            {projects.map((project) => (
              <Card 
                key={project.id}
                sx={{ 
                  borderRadius: 3, 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                  transition: 'all 0.2s ease', 
                  '&:hover': { 
                    transform: 'translateY(-2px)', 
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)' 
                  },
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#2563eb', width: 40, height: 40 }}>
                      {project.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {project.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('Delete this project and all its tasks?')) {
                          handleDeleteProject(project.id)
                        }
                      }}
                      sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  {project.description && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#64748b', 
                        mb: 3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 40
                      }}
                    >
                      {project.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
                    <Chip 
                      size="small" 
                      label={`${project.tasks?.filter(t => t.status === 'todo').length || 0} To Do`} 
                      sx={{ 
                        bgcolor: '#fef2f2', 
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        height: 24
                      }} 
                    />
                    <Chip 
                      size="small" 
                      label={`${project.tasks?.filter(t => t.status === 'inprogress').length || 0} In Progress`} 
                      sx={{ 
                        bgcolor: '#fffbeb', 
                        color: '#f59e0b',
                        fontSize: '0.75rem',
                        height: 24
                      }} 
                    />
                    <Chip 
                      size="small" 
                      label={`${project.tasks?.filter(t => t.status === 'done').length || 0} Done`} 
                      sx={{ 
                        bgcolor: '#f0fdf4', 
                        color: '#10b981',
                        fontSize: '0.75rem',
                        height: 24
                      }} 
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ 
                      borderRadius: 2, 
                      fontWeight: 600,
                      bgcolor: '#2563eb',
                      '&:hover': { bgcolor: '#1d4ed8' }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProject(project)
                    }}
                  >
                    Open Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <ProjectModal
          open={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          onSave={handleCreateProject}
        />
      </Container>
    )
  }

  // Project board view for selected project
  const backlogTasks = selectedProject.tasks.filter(task => task.status === 'backlog')
  const todoTasks = selectedProject.tasks.filter(task => task.status === 'todo')
  const inProgressTasks = selectedProject.tasks.filter(task => task.status === 'inprogress')
  const doneTasks = selectedProject.tasks.filter(task => task.status === 'done')

  const activeTask = activeId ? selectedProject.tasks.find(task => task.id === activeId) : null

  return (
    <Container maxWidth={false} sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      py: 3,
      px: { xs: 2, sm: 3, md: 4 }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        mb: 3,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
            onClick={() => setSelectedProject(null)}
          >
            Back to Projects
          </Button>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: '#1e293b' }}>
              {selectedProject.name}
            </Typography>
            {selectedProject.description && (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {selectedProject.description}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
            onClick={() => setSettingsModalOpen(true)}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }
            }}
            onClick={() => {
              setEditingTask(null)
              setTaskModalOpen(true)
            }}
          >
            Create Task
          </Button>
        </Box>
      </Box>

      {/* View Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Tabs 
          value={activeView} 
          onChange={(e, newValue) => setActiveView(newValue)}
          sx={{ minHeight: 'auto' }}
        >
          <Tab 
            value="board" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ViewKanbanIcon sx={{ fontSize: 20 }} />
                Board
              </Box>
            }
          />
          <Tab 
            value="backlog" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BacklogIcon sx={{ fontSize: 20 }} />
                Backlog
                <Badge badgeContent={backlogTasks.length} color="primary" />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Content Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {activeView === 'board' ? (
          /* Kanban Board View */
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 3,
            minHeight: 'calc(100vh - 250px)'
          }}>
            {/* TO DO Column */}
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: '#fff',
                borderRadius: 3, 
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444' }}>
                  TO DO
                </Typography>
                <Chip 
                  label={todoTasks.length} 
                  size="small"
                  sx={{ 
                    bgcolor: '#fef2f2', 
                    color: '#ef4444',
                    fontWeight: 600,
                    minWidth: 24
                  }}
                />
              </Box>
              
              <DroppableColumn id="todo" isOver={false}>
                <SortableContext items={todoTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {todoTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            </Paper>

            {/* IN PROGRESS Column */}
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: '#fff',
                borderRadius: 3, 
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                  IN PROGRESS
                </Typography>
                <Chip 
                  label={inProgressTasks.length} 
                  size="small"
                  sx={{ 
                    bgcolor: '#fffbeb', 
                    color: '#f59e0b',
                    fontWeight: 600,
                    minWidth: 24
                  }}
                />
              </Box>
              
              <DroppableColumn id="inprogress" isOver={false}>
                <SortableContext items={inProgressTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {inProgressTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            </Paper>

            {/* DONE Column */}
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: '#fff',
                borderRadius: 3, 
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                  DONE
                </Typography>
                <Chip 
                  label={doneTasks.length} 
                  size="small"
                  sx={{ 
                    bgcolor: '#f0fdf4', 
                    color: '#10b981',
                    fontWeight: 600,
                    minWidth: 24
                  }}
                />
              </Box>
              
              <DroppableColumn id="done" isOver={false}>
                <SortableContext items={doneTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {doneTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            </Paper>
          </Box>
        ) : (
          /* Backlog View */
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
            gap: 3,
            minHeight: 'calc(100vh - 250px)'
          }}>
            {/* Backlog Column */}
            <Paper 
              sx={{ 
                p: 3, 
                bgcolor: '#fff',
                borderRadius: 3, 
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#374151' }}>
                  <BacklogIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Backlog
                </Typography>
                <Chip 
                  label={`${backlogTasks.length} items`} 
                  sx={{ 
                    bgcolor: '#f3f4f6', 
                    color: '#374151',
                    fontWeight: 600
                  }}
                />
              </Box>
              
              <DroppableColumn id="backlog" isOver={false}>
                <SortableContext items={backlogTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {backlogTasks.length > 0 ? (
                    backlogTasks.map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onClick={() => handleTaskClick(task)}
                      />
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <BacklogIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                        Your backlog is empty
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                        Add tasks to the backlog and move them to the board when ready
                      </Typography>
                    </Box>
                  )}
                </SortableContext>
              </DroppableColumn>
            </Paper>

            {/* Move to Board Panel */}
            {!isMobile && (
              <Paper 
                sx={{ 
                  p: 3, 
                  bgcolor: '#fff',
                  borderRadius: 3, 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  height: 'fit-content'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<MoveToInboxIcon />}
                    fullWidth
                    sx={{ borderRadius: 2 }}
                    onClick={() => setActiveView('board')}
                  >
                    Go to Board
                  </Button>
                  <Divider />
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    <strong>Tip:</strong> Drag tasks from backlog to board columns, or click a task to view details and change status.
                  </Typography>
                </Stack>
              </Paper>
            )}
          </Box>
        )}

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setEditingTask(null)
        }}
        onSave={editingTask ? handleEditProjectTask : handleCreateTask}
        initial={editingTask}
        currentUser={currentUser}
      />

      <TaskDetailModal
        task={selectedTask}
        open={taskDetailOpen}
        onClose={() => {
          setTaskDetailOpen(false)
          setSelectedTask(null)
        }}
        onUpdate={handleTaskUpdate}
        onDelete={handleDeleteProjectTask}
        onStatusChange={handleUpdateTaskStatus}
        currentUser={currentUser}
      />

      <ProjectSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        project={selectedProject}
        onUpdateProject={handleUpdateProject}
        currentUser={currentUser}
      />
    </Container>
  )
} 