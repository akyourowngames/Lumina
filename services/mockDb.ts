import { User } from '../types';

const DB_KEY = 'lumina_db_users_v1';

// Seed data to ensure the app isn't empty on first load
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

export const db = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      localStorage.setItem(DB_KEY, JSON.stringify(SEED_USERS));
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
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  },

  updateUser: (user: User): void => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      localStorage.setItem(DB_KEY, JSON.stringify(users));
    }
  }
};