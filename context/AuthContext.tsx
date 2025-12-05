import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { db } from '../services/mockDb';
import { useToast } from './ToastContext';
import { auth, googleProvider, firestore } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role, password?: string) => Promise<boolean>;
  signup: (data: Partial<User>) => Promise<boolean>;
  loginWithGoogle: (role: Role) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // First try to get from Firestore to get the correct Role
        try {
          const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
            
            // Sync to local mockDB for compatibility
            if (!db.getUsers().find(u => u.id === firebaseUser.uid)) {
               db.createUser(userDoc.data() as User);
            }
          } else {
            // Fallback to local DB or basic info if not in Firestore yet
            // This happens if creation is laggy or failed
            let localUser = db.getUsers().find(u => u.email === firebaseUser.email);
            if (localUser) {
               setUser(localUser);
            } else {
               const newUser: User = {
                 id: firebaseUser.uid,
                 name: firebaseUser.displayName || 'New User',
                 email: firebaseUser.email || '',
                 role: 'client', // Default fallback
                 avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
                 company: '',
                 bio: ''
               };
               setUser(newUser);
            }
          }
        } catch (e) {
          console.error("Error fetching user from Firestore", e);
          // Fallback
          let localUser = db.getUsers().find(u => u.email === firebaseUser.email);
          setUser(localUser || null);
        }
      } else {
        // Only clear user if we are not in a forced demo session (checked via ID)
        setUser(prev => prev && prev.id.startsWith('demo-') ? prev : null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, role: Role, password?: string): Promise<boolean> => {
    if (!password) {
      showToast("Password is required", 'error');
      return false;
    }
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Logged in successfully!", 'success');
      return true;
    } catch (error: any) {
      console.error("Login Error:", error);
      showToast(error.message || "Failed to login.", 'error');
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (data: Partial<User>): Promise<boolean> => {
    if (!data.email || !data.password) return false;
    
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      const newUser: User = {
        id: userCredential.user.uid,
        name: data.name || 'New User',
        email: data.email,
        role: data.role || 'client',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
        company: data.company || '',
        ...data
      };
      
      // Remove password before saving to DB
      delete newUser.password;

      // 1. Save to Firestore
      try {
        await setDoc(doc(firestore, "users", newUser.id), newUser);
      } catch (firestoreError) {
        console.error("Error saving to Firestore:", firestoreError);
      }

      // 2. Save to Mock DB (for app compatibility)
      db.createUser(newUser);
      
      showToast("Account created successfully!", 'success');
      return true;
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        showToast("Email already in use.", 'error');
      } else {
        showToast(error.message || "Failed to sign up.", 'error');
      }
      setIsLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async (role: Role): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check Firestore if user exists
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create new user in Firestore
        const newUser: User = {
           id: firebaseUser.uid,
           name: firebaseUser.displayName || 'New User',
           email: firebaseUser.email || '',
           role: role, // Use the role selected in the UI for first time signup
           avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
           company: '',
        };
        await setDoc(userDocRef, newUser);

        // Also add to MockDB
        db.createUser(newUser);
      }
      
      showToast("Logged in with Google!", 'success');
      return true;
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      
      const errorCode = error.code;
      const errorMessage = error.message || '';

      // Fallback for unauthorized domains (Preview Environments)
      if (
        errorCode === 'auth/unauthorized-domain' || 
        errorCode === 'auth/operation-not-allowed' ||
        errorMessage.includes('unauthorized-domain')
      ) {
        const mockUser: User = {
          id: 'demo-user-google',
          name: 'Demo User',
          email: 'demo@lumina.app',
          role: role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=demo`,
          company: 'Demo Company',
          bio: 'This is a demo account because the preview domain is not authorized in Firebase.'
        };
        
        // Ensure user is in local DB so we can persist their edits in this session
        const existing = db.getUsers().find(u => u.id === mockUser.id);
        if (!existing) {
           db.createUser(mockUser);
        }
        
        setUser(mockUser);
        showToast(`Demo Mode: Domain not authorized in Firebase. Logged in as ${role}.`, 'info');
        setIsLoading(false);
        return true;
      }

      if (errorCode === 'auth/popup-closed-by-user') {
        showToast("Sign in cancelled.", 'info');
      } else {
        showToast(errorMessage || "Google sign in failed.", 'error');
      }
      setIsLoading(false);
      return false;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    const updatedUser = { ...user, ...data };
    
    // Update Firestore
    if (!user.id.startsWith('demo-')) {
       try {
         await setDoc(doc(firestore, "users", user.id), updatedUser, { merge: true });
       } catch (e) {
         console.error("Error updating Firestore:", e);
       }
    }

    db.updateUser(updatedUser);
    setUser(updatedUser);
    showToast("Profile updated successfully.", 'success');
    return true;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Force clear user in case we were in mock mode
      setUser(null); 
      showToast("Logged out successfully.", 'info');
    } catch (error) {
      console.error(error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, updateProfile, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};