import { User, Project } from '../types';

const DB_USERS_KEY = 'lumina_db_users_v1';
const DB_PROJECTS_KEY = 'lumina_db_projects_v1';

const SEED_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Alex Developer',
    email: 'admin@lumina.com',
    password: 'password',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    company: 'Lumina Studio',
    bio: 'Senior Full Stack Developer with a passion for clean UI and scalable architecture.',
    location: 'San Francisco, CA',
    phone: '+1 (555) 012-3456'
  },
  {
    id: 'client-1',
    name: 'Jordan Client',
    email: 'client@acme.com',
    password: 'password',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    company: 'Acme Corp',
    bio: 'Product Manager at Acme Corp looking for high-quality development partners.',
    location: 'New York, NY',
    phone: '+1 (555) 987-6543'
  }
];

const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'E-Commerce Platform Redesign',
    description: 'Complete overhaul of the existing Shopify store with headless architecture.',
    client: 'Acme Corp',
    clientId: 'client-1',
    status: 'In Progress',
    progress: 65,
    dueDate: '2024-12-01',
    budget: '$15,000',
    tags: ['Next.js', 'Shopify'],
    createdAt: '2024-10-01'
  },
  {
    id: 'proj-2',
    title: 'Internal Analytics Dashboard',
    description: 'Real-time dashboard for tracking internal KPIs.',
    client: 'Stark Industries',
    clientId: 'client-2', // Imaginary client
    status: 'Requested',
    progress: 0,
    dueDate: '2025-01-15',
    budget: '$8,000',
    tags: ['React', 'D3'],
    createdAt: '2024-10-25'
  }
];

export const db = {
  // Users
  getUsers: (): User[] => {
    const data = localStorage.getItem(DB_USERS_KEY);
    if (!data) {
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(data);
  },

  findUser: (email: string): User | undefined => {
    const users = db.getUsers();
    return users.find(u => u.email === email);
  },

  createUser: (user: User): void => {
    const users = db.getUsers();
    users.push(user);
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
  },

  updateUser: (user: User): void => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    }
  },

  // Projects
  getProjects: (): Project[] => {
    const data = localStorage.getItem(DB_PROJECTS_KEY);
    if (!data) {
      localStorage.setItem(DB_PROJECTS_KEY, JSON.stringify(SEED_PROJECTS));
      return SEED_PROJECTS;
    }
    return JSON.parse(data);
  },

  createProject: (project: Project): void => {
    const projects = db.getProjects();
    projects.push(project);
    localStorage.setItem(DB_PROJECTS_KEY, JSON.stringify(projects));
  },

  updateProject: (project: Project): void => {
    const projects = db.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      projects[index] = project;
      localStorage.setItem(DB_PROJECTS_KEY, JSON.stringify(projects));
    }
  }
};