import React from 'react';

export type Role = 'admin' | 'client';
export type Theme = 'dark' | 'light';

export type NotificationType = 'message' | 'project' | 'application' | 'invoice' | 'system' | 'success' | 'alert';

export interface AppNotification {
  id: string;
  userId: string; // Recipient ID
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: any; // Firestore Timestamp or string
  link?: string; // Direct URL to navigate to
  sender?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    projectId?: string;
    applicationId?: string;
    invoiceId?: string;
    freelancerId?: string;
  };
}

export interface PortfolioItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  role?: string;
  technologies: string[];
  imageUrl: string | null;
  liveUrl?: string | null;
  githubUrl?: string | null;
  createdAt: any;
  updatedAt?: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  company?: string;
  bio?: string;
  phone?: string;
  location?: string;
  password?: string;
  
  // Profile Fields
  headline?: string;
  skills?: string[];
  hourlyRate?: number;
  profileRole?: 'client' | 'freelancer' | 'both';
  
  // New "God Mode" Fields
  available?: boolean;
  website?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  
  // Presence
  isOnline?: boolean;
  lastSeen?: any;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  client: string; // Client Name (for display)
  clientId: string; // User ID (Mapped from ownerId)
  ownerId?: string; // New: owner of the project
  freelancerId?: string | null; // New: assigned freelancer
  status: 'Requested' | 'In Progress' | 'Completed' | 'Pending' | 'Assigned' | 'Hired' | 'Submitted' | 'Cancelled';
  progress: number;
  dueDate: string; // Mapped from endDate for UI compat
  endDate?: string; // New schema field
  startDate?: string; // New schema field
  budget: string;
  image?: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string; // New schema field
}

export interface Application {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  message: string;
  price: string;
  status: 'applied' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  status: 'Todo' | 'In Progress' | 'Done';
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  date: string;
  dueDate: string;
  items: { description: string; amount: string }[];
}

export interface Service {
  title: string;
  description: string;
  price: string;
  features: string[];
  icon: React.ReactNode;
}