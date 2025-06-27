import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Box, Container, Typography, Card, CardContent, Button, CircularProgress,
  Alert, Avatar, Chip, Divider
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import EmailIcon from '@mui/icons-material/Email'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import LoginIcon from '@mui/icons-material/Login'

export default function InvitationHandler({ user, onLoginRequired }) {
  const { projectId, invitationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [project, setProject] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error', 'login_required'
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleInvitation()
  }, [projectId, invitationId, user])

  const handleInvitation = async () => {
    try {
      setLoading(true)
      
      // Load project data
      const projectOwnerId = projectId.split('_')[0]
      const projectDoc = await getDoc(doc(db, 'taskmaster_projects', projectOwnerId))
      if (!projectDoc.exists()) {
        setStatus('error')
        setMessage('Project not found or you do not have access to it.')
        setLoading(false)
        return
      }

      const projectData = projectDoc.data()
      const projects = projectData.projects || []
      const targetProject = projects.find(p => p.id === projectId)

      if (!targetProject) {
        setStatus('error')
        setMessage('Project not found.')
        setLoading(false)
        return
      }

      setProject(targetProject)

      // Find the invitation
      const targetInvitation = targetProject.invitations?.find(inv => inv.id === invitationId)
      
      if (!targetInvitation) {
        setStatus('error')
        setMessage('Invitation not found or has expired.')
        setLoading(false)
        return
      }

      if (targetInvitation.status === 'accepted') {
        setStatus('error')
        setMessage('This invitation has already been accepted.')
        setLoading(false)
        return
      }

      setInvitation(targetInvitation)

      // Check if user is logged in
      if (!user) {
        // Store invitation details for after login
        localStorage.setItem('pendingInvitation', JSON.stringify({
          projectId,
          invitationId,
          email: targetInvitation.email
        }))
        setStatus('login_required')
        setLoading(false)
        return
      }

      // Check if user email matches invitation
      if (user.email !== targetInvitation.email) {
        setStatus('error')
        setMessage(`This invitation was sent to ${targetInvitation.email}, but you are logged in as ${user.email}. Please log in with the correct email address.`)
        setLoading(false)
        return
      }

      // Check if user is already a member
      if (targetProject.members?.find(m => m.email === user.email)) {
        setStatus('error')
        setMessage('You are already a member of this project.')
        setLoading(false)
        return
      }

      // Accept the invitation
      await acceptInvitation(targetProject, targetInvitation, user)

    } catch (error) {
      console.error('Error handling invitation:', error)
      setStatus('error')
      setMessage('An error occurred while processing your invitation. Please try again.')
      setLoading(false)
    }
  }

  const acceptInvitation = async (project, invitation, user) => {
    try {
      // Create new member object
      const newMember = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        avatar: user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U',
        role: invitation.role,
        joinedAt: new Date().toISOString()
      }

      // Update project with new member
      const updatedMembers = [...(project.members || []), newMember]
      
      // Update invitation status
      const updatedInvitations = project.invitations.map(inv => 
        inv.id === invitation.id 
          ? { ...inv, status: 'accepted', acceptedAt: new Date().toISOString() }
          : inv
      )

      const updatedProject = {
        ...project,
        members: updatedMembers,
        invitations: updatedInvitations,
        updatedAt: new Date().toISOString()
      }

      // Get all projects for this user (the project owner)  
      const projectOwnerId = project.id.split('_')[0]
      const ownerProjectDoc = await getDoc(doc(db, 'taskmaster_projects', projectOwnerId))
      const ownerProjectData = ownerProjectDoc.data()
      const allProjects = ownerProjectData.projects || []
      
      // Update the specific project
      const updatedProjects = allProjects.map(p => 
        p.id === project.id ? updatedProject : p
      )

      // Save back to Firestore
      await setDoc(doc(db, 'taskmaster_projects', projectOwnerId), { projects: updatedProjects }, { merge: true })

      // Also add project to the new member's project list
      const memberProjectDoc = await getDoc(doc(db, 'taskmaster_projects', user.uid))
      const memberProjects = memberProjectDoc.exists() ? memberProjectDoc.data().projects || [] : []
      
      // Add project reference for the new member
      const projectReference = {
        ...updatedProject,
        isOwner: false,
        joinedAt: new Date().toISOString()
      }

      const updatedMemberProjects = [...memberProjects, projectReference]
      await setDoc(doc(db, 'taskmaster_projects', user.uid), { projects: updatedMemberProjects }, { merge: true })

      // Clear pending invitation
      localStorage.removeItem('pendingInvitation')

      setStatus('success')
      setMessage(`Welcome to ${project.name}! You have been added as a ${invitation.role}.`)
      setLoading(false)

    } catch (error) {
      console.error('Error accepting invitation:', error)
      setStatus('error')
      setMessage('Failed to accept invitation. Please try again.')
      setLoading(false)
    }
  }

  const handleLoginRedirect = () => {
    onLoginRequired()
  }

  const handleGoToProject = () => {
    navigate('/taskmaster')
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ color: '#64748b' }}>
            Processing your invitation...
          </Typography>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: 4
    }}>
      <Card sx={{ width: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {status === 'success' ? (
              <CheckCircleIcon sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
            ) : status === 'error' ? (
              <ErrorIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
            ) : status === 'login_required' ? (
              <EmailIcon sx={{ fontSize: 64, color: '#2563eb', mb: 2 }} />
            ) : null}
            
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {status === 'success' ? 'Welcome to the Team!' :
               status === 'error' ? 'Invitation Error' :
               status === 'login_required' ? 'Login Required' : 'Processing...'}
            </Typography>
          </Box>

          {/* Project Info */}
          {project && (
            <Box sx={{ mb: 4, p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#2563eb', width: 48, height: 48 }}>
                  {project.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {project.name}
                  </Typography>
                  {project.description && (
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {project.description}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {invitation && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Role: ${invitation.role}`}
                    size="small"
                    sx={{ bgcolor: '#dbeafe', color: '#1e40af' }}
                  />
                  <Chip
                    label={`Invited by: ${invitation.invitedBy?.name}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Status Message */}
          <Alert 
            severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
            sx={{ mb: 3 }}
          >
            {message}
          </Alert>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {status === 'success' && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PersonAddIcon />}
                onClick={handleGoToProject}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Go to Project
              </Button>
            )}
            
            {status === 'login_required' && (
              <Button
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                onClick={handleLoginRedirect}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Login to Accept
              </Button>
            )}
            
            {status === 'error' && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/')}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Go to Home
              </Button>
            )}
          </Box>

          {/* Additional Info */}
          {status === 'login_required' && invitation && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: '#1e40af', textAlign: 'center' }}>
                💡 This invitation is for <strong>{invitation.email}</strong>. 
                Please login with this email address to accept the invitation.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  )
} 