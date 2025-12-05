export type Role = 'admin' | 'client';

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
  password?: string; // stored for mock auth purposes only
}

export interface Project {
  id: string;
  title: string;
  client: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  progress: number;
  dueDate: string;
  budget: string;
  image: string;
  tags: string[];
}

export interface Task {
  id: string;
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