import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { useToast } from './ToastContext';
import { auth, googleProvider, firestore, timestamp } from '../services/firebase';

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

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    // This listener handles the initial load and any auth changes
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // ALWAYS use the real Firebase UID to ensure permissions match security rules
        const uid = firebaseUser.uid;
        const userRef = firestore.collection("users").doc(uid);

        try {
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            // Document exists, use its data
            setUser(userDoc.data() as User);
          } else {
            // Document missing? Create it automatically.
            const newUser: User = {
              id: uid, // CRITICAL: Must use firebaseUser.uid
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              role: 'client', // Default to client if unknown
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
              company: '',
            };

            // Save to Firestore with server timestamp
            // Note: If permissions denied here, the catch block will handle it
            await userRef.set({
              ...newUser,
              createdAt: timestamp()
            });

            setUser(newUser);
          }
        } catch (error: any) {
          // If we get a permission error, it means the user exists in Auth but rules block Firestore.
          // We fallback to basic Auth info so the app is still usable.
          console.warn("Could not fetch full user profile (likely permissions):", error.code);
          
          setUser({
            id: uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: 'client',
            avatar: firebaseUser.photoURL || '',
          } as User);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Presence System
  useEffect(() => {
    if (!user?.id) return;

    const userRef = firestore.collection('users').doc(user.id);

    // 1. Set Online
    const setOnline = () => {
        userRef.update({
            isOnline: true,
            lastSeen: timestamp()
        }).catch(err => {
            // Ignore errors (e.g., permissions during logout)
        });
    };

    setOnline();

    // 2. Heartbeat (every 30s)
    const heartbeat = setInterval(() => {
        userRef.update({
            lastSeen: timestamp()
        }).catch(console.error);
    }, 30000);

    // 3. Set Offline on cleanup
    const setOffline = () => {
        userRef.update({
            isOnline: false,
            lastSeen: timestamp()
        }).catch(console.error);
    };

    // Handle tab close specifically
    const handleTabClose = () => {
        setOffline();
    };
    window.addEventListener('beforeunload', handleTabClose);

    return () => {
        clearInterval(heartbeat);
        window.removeEventListener('beforeunload', handleTabClose);
        setOffline();
    };
  }, [user?.id]);

  const login = async (email: string, role: Role, password?: string): Promise<boolean> => {
    if (!password) {
      showToast("Password is required", 'error');
      return false;
    }
    
    setIsLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      showToast("Logged in successfully!", 'success');
      return true;
    } catch (error: any) {
      console.error("Login Error:", error.code);
      
      if (error.code === 'auth/invalid-credential') {
          showToast("User not found or wrong password. Please Sign Up if you don't have an account.", 'error');
      } else {
          showToast(error.message || "Failed to login.", 'error');
      }
      
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (data: Partial<User>): Promise<boolean> => {
    if (!data.email || !data.password) return false;
    
    setIsLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password);
      const uid = userCredential.user.uid;
      
      const newUser: User = {
        id: uid,
        name: data.name || 'New User',
        email: data.email,
        role: data.role || 'client',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
        company: data.company || '',
        ...data
      };
      
      delete newUser.password;

      // 2. Save to Firestore (users/{uid})
      // We do this immediately so when the onAuthStateChanged fires, data might be ready
      await firestore.collection("users").doc(uid).set({
        ...newUser,
        createdAt: timestamp()
      });

      // Update state immediately to avoid race condition flicker
      setUser(newUser);
      
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
      const result = await auth.signInWithPopup(googleProvider);
      const firebaseUser = result.user;
      const uid = firebaseUser.uid;
      
      // Check Firestore to see if we need to initialize this user with the chosen Role
      const userDocRef = firestore.collection("users").doc(uid);
      
      try {
          const userDocSnap = await userDocRef.get();

          if (!userDocSnap.exists) {
            const newUser: User = {
               id: uid,
               name: firebaseUser.displayName || 'New User',
               email: firebaseUser.email || '',
               role: role, // Use the role selected in the UI
               avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
               company: '',
            };
            await userDocRef.set({
              ...newUser,
              createdAt: timestamp()
            });
            setUser(newUser);
          }
      } catch (e) {
          // Ignore permission errors on google sign in fetch, handled by onAuthStateChanged fallback
          console.warn("Google Sign In: Firestore check failed, proceeding with auth only.");
      }
      
      showToast("Logged in with Google!", 'success');
      return true;
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        showToast("Sign in cancelled.", 'info');
      } else {
        showToast(error.message || "Google sign in failed.", 'error');
      }
      setIsLoading(false);
      return false;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    const updatedUser = { ...user, ...data };
    
    try {
       // Always write to the user's document based on their current ID
       await firestore.collection("users").doc(user.id).set(updatedUser, { merge: true });
       setUser(updatedUser);
       showToast("Profile updated successfully.", 'success');
       return true;
    } catch (e: any) {
       console.error("Error updating Firestore:", e);
       showToast("Failed to update profile.", 'error');
       return false;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
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