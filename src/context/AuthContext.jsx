import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  const signup        = (e, p) => createUserWithEmailAndPassword(auth, e, p);
  const login         = (e, p) => signInWithEmailAndPassword(auth, e, p);
  const loginGoogle   = ()     => signInWithPopup(auth, new GoogleAuthProvider());
  const logout        = ()     => signOut(auth);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, signup, login, loginGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
