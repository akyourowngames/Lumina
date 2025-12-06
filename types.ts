import React from 'react';

export type Role = 'admin' | 'client';
export type Theme = 'dark' | 'light';

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
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  client: string; // Client Name (for display)
  clientId: string; // User ID (Mapped from ownerId)
  ownerId?: string; // New: owner of the project
  freelancerId?: string | null; // New: assigned freelancer
  status: 'Requested' | 'In Progress' | 'Completed' | 'Pending' | 'Assigned';
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