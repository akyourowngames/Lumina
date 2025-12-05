import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { db } from '../services/mockDb';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role) => Promise<boolean>;
  signup: (data: Partial<User>) => Promise<boolean>;
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
    const storedUser = localStorage.getItem('lumina_active_session');
    if (storedUser) {
      // Re-fetch fresh data from DB using the ID in session
      const sessionData = JSON.parse(storedUser);
      const freshUser = db.getUsers().find(u => u.id === sessionData.id);
      if (freshUser) {
        setUser(freshUser);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, role: Role): Promise<boolean> => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundUser = db.findUser(email);
        
        if (foundUser) {
          if (foundUser.role !== role) {
             showToast(`This email is registered as a ${foundUser.role}, not a ${role}.`, 'error');
             setIsLoading(false);
             resolve(false);
             return;
          }
          setUser(foundUser);
          localStorage.setItem('lumina_active_session', JSON.stringify(foundUser));
          showToast(`Welcome back, ${foundUser.name}!`, 'success');
          resolve(true);
        } else {
          showToast("User not found. Please sign up.", 'error');
          resolve(false);
        }
        setIsLoading(false);
      }, 800);
    });
  };

  const signup = async (data: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!data.email) {
          setIsLoading(false);
          return resolve(false);
        }
        
        const existing = db.findUser(data.email);
        if (existing) {
          showToast("Account already exists with this email.", 'error');
          setIsLoading(false);
          resolve(false);
          return;
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: data.name || 'New User',
          email: data.email,
          role: data.role || 'client',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
          company: data.company || '',
          ...data
        };

        db.createUser(newUser);
        setUser(newUser);
        localStorage.setItem('lumina_active_session', JSON.stringify(newUser));
        showToast("Account created successfully!", 'success');
        resolve(true);
        setIsLoading(false);
      }, 1000);
    });
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedUser = { ...user, ...data };
        db.updateUser(updatedUser);
        setUser(updatedUser);
        localStorage.setItem('lumina_active_session', JSON.stringify(updatedUser));
        showToast("Profile updated successfully.", 'success');
        resolve(true);
      }, 600);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lumina_active_session');
    showToast("Logged out successfully.", 'info');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateProfile, logout, isLoading }}>
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