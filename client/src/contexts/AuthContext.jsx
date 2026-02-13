import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get custom claims from the token
        const tokenResult = await firebaseUser.getIdTokenResult();
        setUser({
          uid: firebaseUser.uid,
          username: tokenResult.claims.username || firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.uid,
          role: tokenResult.claims.role || 'user',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username, pin) => {
    const data = await authApi.login(username, pin);

    // Sign in to Firebase with the custom token
    await signInWithCustomToken(auth, data.customToken);

    // Force token refresh to get custom claims
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const userData = {
        uid: firebaseUser.uid,
        username: data.user.username,
        displayName: data.user.displayName,
        role: tokenResult.claims.role || data.user.role,
      };
      setUser(userData);
      return userData;
    }

    return data.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
