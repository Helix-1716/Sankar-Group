import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userProfile = await api.getMe();
          setProfile(userProfile);
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    // Create Firestore user doc
    const userProfile = await api.register({
      uid: userCredential.user.uid,
      name,
      email,
    });

    setProfile(userProfile);
    return userCredential.user;
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);

    try {
      const userProfile = await api.getMe();
      setProfile(userProfile);
    } catch (err) {
      console.error('Failed to fetch profile after login:', err);
    }

    return userCredential.user;
  };

  const logout = async () => {
    await signOut(firebaseAuth);
    setUser(null);
    setProfile(null);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(firebaseAuth, provider);

    try {
      const userProfile = await api.getMe();
      setProfile(userProfile);
    } catch (err) {
      // If profile not found, register them
      const userProfile = await api.register({
        uid: userCredential.user.uid,
        name: userCredential.user.displayName,
        email: userCredential.user.email,
      });
      setProfile(userProfile);
    }
    return userCredential.user;
  };

  const value = {
    user,
    profile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
