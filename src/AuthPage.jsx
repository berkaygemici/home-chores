import { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Box, Paper, Typography, TextField, Button, CircularProgress, Alert, Link } from '@mui/material';

export default function AuthPage({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let userCred;
      if (isRegister) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          createdAt: new Date().toISOString()
        });
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      }
      onAuth(userCred.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Box sx={{minHeight:'100vh', bgcolor:'linear-gradient(120deg, #f5f7fa 60%, #e3f0ff 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, system-ui, sans-serif'}}>
      <Paper elevation={4} sx={{p:4, borderRadius:5, minWidth:340, maxWidth:380, width:'100%', boxShadow:'0 8px 32px #2563eb22'}}>
        <Typography variant="h5" sx={{mb:2, fontWeight:700, textAlign:'center', color:'#2563eb'}}>
          {isRegister ? 'Create an Account' : 'Sign In'}
        </Typography>
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:20}}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" color="primary" size="large" disabled={loading} sx={{fontWeight:600, borderRadius:99, py:1.2}}>
            {loading ? <CircularProgress size={24} color="inherit" /> : (isRegister ? 'Register' : 'Login')}
          </Button>
        </form>
        <Box sx={{mt:2, textAlign:'center'}}>
          <Link component="button" underline="hover" onClick={()=>setIsRegister(r=>!r)} sx={{fontWeight:600, color:'#2563eb'}}>
            {isRegister ? 'Already have an account? Sign in' : 'No account? Register'}
          </Link>
        </Box>
        {error && <Alert severity="error" sx={{mt:2}}>{error}</Alert>}
      </Paper>
    </Box>
  );
} 