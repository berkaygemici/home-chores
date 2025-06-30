import { useState } from 'react';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Link,
  IconButton,
  InputAdornment,
  Fade,
  Slide,
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  ArrowForward,
  ArrowBack,
  AutoAwesome,
  Security,
  RocketLaunch as RocketLaunchIcon
} from '@mui/icons-material';

export default function AuthPage({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const validatePasswords = () => {
    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (isRegister && !validatePasswords()) return;
    
    setLoading(true);
    try {
      let userCred;
      if (isRegister) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          createdAt: new Date().toISOString()
        });
        setSuccess('Account created successfully! Welcome aboard! 🎉');
        setTimeout(() => onAuth(userCred.user), 1500);
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
        onAuth(userCred.user);
      }
    } catch (err) {
      const friendlyErrors = {
        'auth/user-not-found': 'No account found with this email address',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address'
      };
      setError(friendlyErrors[err.code] || err.message);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Check your inbox 📧');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (mode) => {
    resetForm();
    if (mode === 'login') {
      setIsRegister(false);
      setIsForgotPassword(false);
    } else if (mode === 'register') {
      setIsRegister(true);
      setIsForgotPassword(false);
    } else if (mode === 'forgot') {
      setIsForgotPassword(true);
      setIsRegister(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      p: { xs: 2, sm: 3, md: 4 },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        zIndex: 0
      }
    }}>
      {/* Animated background elements */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: 100,
        height: 100,
        background: alpha('#ffffff', 0.1),
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite',
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        }
      }} />
      <Box sx={{
        position: 'absolute',
        top: '60%',
        right: '15%',
        width: 60,
        height: 60,
        background: alpha('#ffffff', 0.08),
        borderRadius: '50%',
        animation: 'float 4s ease-in-out infinite reverse',
      }} />

      <Fade in timeout={800}>
        <Box sx={{
          display: 'flex',
          width: '100%',
          maxWidth: { xs: '480px', sm: '600px', md: '900px', lg: '1200px' },
          minHeight: { md: '600px' },
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 32px 64px rgba(0, 0, 0, 0.15), 0 16px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.2), 0 20px 40px rgba(0, 0, 0, 0.15)'
          }
        }}>
          {/* Left side - Decorative panel (hidden on mobile) */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' },
            flex: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
              zIndex: 1
            }
          }}>
            <Box sx={{ 
              textAlign: 'center', 
              color: '#fff', 
              zIndex: 2, 
              position: 'relative',
              p: 4
            }}>
              <Box sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: 120,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 32px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-20px)' }
                }
              }}>
                <RocketLaunchIcon sx={{ fontSize: 60 }} />
              </Box>
              
              <Typography variant="h3" sx={{
                fontWeight: 900,
                mb: 3,
                fontSize: '2.5rem',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}>
                Your Productivity Journey
              </Typography>
              
              <Typography variant="h6" sx={{
                opacity: 0.9,
                fontSize: '1.2rem',
                lineHeight: 1.6,
                fontWeight: 500
              }}>
                Join thousands of users who have transformed their daily routines into powerful productivity systems
              </Typography>

              {/* Floating elements */}
              <Box sx={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                width: 60,
                height: 60,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: '20%',
                right: '15%',
                width: 40,
                height: 40,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                animation: 'float 10s ease-in-out infinite'
              }} />
            </Box>
          </Box>

          {/* Right side - Form */}
          <Paper elevation={0} sx={{
            flex: { xs: 1, md: '0 0 480px' },
            width: { xs: '100%', md: '480px' },
            p: { xs: 3, sm: 5, md: 6 },
            background: 'transparent',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              width: { xs: 80, md: 100 },
              height: { xs: 80, md: 100 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: { xs: '0 auto 16px', md: '0 auto 24px' },
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' }
              }
            }}>
              {isForgotPassword ? (
                <Security sx={{ color: '#fff', fontSize: { xs: 40, md: 50 } }} />
              ) : isRegister ? (
                <Person sx={{ color: '#fff', fontSize: { xs: 40, md: 50 } }} />
              ) : (
                <AutoAwesome sx={{ color: '#fff', fontSize: { xs: 40, md: 50 } }} />
              )}
            </Box>
            
            <Slide direction={isRegister ? 'left' : 'right'} in timeout={300}>
              <Typography variant="h4" sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
                mb: { xs: 1, md: 2 },
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}>
                {isForgotPassword ? 'Reset Password' : isRegister ? 'Join Us Today' : 'Welcome Back'}
              </Typography>
            </Slide>
            
            <Typography variant="body1" sx={{
              color: '#64748b',
              fontWeight: 500,
              fontSize: { xs: '1.1rem', md: '1.2rem' },
              maxWidth: { xs: '100%', md: '400px' },
              mx: 'auto'
            }}>
              {isForgotPassword 
                ? 'Enter your email to receive reset instructions'
                : isRegister 
                  ? 'Create your account and start your journey'
                  : 'Sign in to continue your productivity journey'
              }
            </Typography>
          </Box>

            {/* Form */}
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 3, md: 3.5 },
                maxWidth: '100%'
              }}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
                    }
                  }
                }}
              />

              {!isForgotPassword && (
                <>
                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#667eea' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
                        }
                      }
                    }}
                  />

                  {isRegister && (
                    <TextField
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      fullWidth
                      error={isRegister && confirmPassword && password !== confirmPassword}
                      helperText={
                        isRegister && confirmPassword && password !== confirmPassword 
                          ? 'Passwords do not match' 
                          : ''
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              size="small"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
                          },
                          '&.Mui-focused': {
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
                          }
                        }
                      }}
                    />
                  )}
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                sx={{
                  mt: 2,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)',
                    transform: 'translateY(-2px)'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                    boxShadow: 'none'
                  }
                }}
              >
                {loading 
                  ? 'Processing...' 
                  : isForgotPassword 
                    ? 'Send Reset Email'
                    : isRegister 
                      ? 'Create Account'
                      : 'Sign In'
                }
              </Button>
            </Box>
          </form>

          {/* Navigation Links */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            {isForgotPassword ? (
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => switchMode('login')}
                startIcon={<ArrowBack />}
                sx={{
                  fontWeight: 600,
                  color: '#667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#5a6fd8',
                    transform: 'translateX(-2px)'
                  }
                }}
              >
                <ArrowBack fontSize="small" />
                Back to Sign In
              </Link>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => switchMode(isRegister ? 'login' : 'register')}
                  sx={{
                    fontWeight: 600,
                    color: '#667eea',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#5a6fd8',
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  {isRegister 
                    ? 'Already have an account? Sign in' 
                    : 'New here? Create an account'
                  }
                </Link>
                
                {!isRegister && (
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => switchMode('forgot')}
                    sx={{
                      fontWeight: 500,
                      color: '#64748b',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: '#667eea',
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    Forgot your password?
                  </Link>
                )}
              </Box>
            )}
          </Box>

            {/* Alerts */}
            {error && (
              <Fade in>
                <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              </Fade>
            )}
            {success && (
              <Fade in>
                <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
                  {success}
                </Alert>
              </Fade>
            )}
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
} 