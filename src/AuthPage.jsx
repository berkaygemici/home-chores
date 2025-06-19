import { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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
        // Write user info to Firestore after registration
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
    <div className="container" style={{maxWidth: 400, marginTop: 60}}>
      <h1>{isRegister ? 'Register' : 'Login'}</h1>
      <form className="chore-form" onSubmit={handleSubmit} style={{flexDirection: 'column', gap: 16}}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <button style={{marginTop: 12}} onClick={() => setIsRegister(r => !r)}>
        {isRegister ? 'Already have an account? Login' : 'No account? Register'}
      </button>
      {error && <div style={{color: 'red', marginTop: 10}}>{error}</div>}
      <div style={{marginTop: 20, color: '#888', fontSize: 13}}>
        <b>Note:</b> If you see <code>auth/configuration-not-found</code>,<br/> enable Email/Password in Firebase Console &gt; Authentication &gt; Sign-in method.
      </div>
    </div>
  );
} 