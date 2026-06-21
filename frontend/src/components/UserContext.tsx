import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  token: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (name: string, token?: string) => Promise<{ success: boolean; requiresPin?: boolean; error?: string }>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('shelf_life_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (name: string, token?: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      if (data.error === 'username_taken') {
        return { success: false, requiresPin: true, error: data.message };
      }

      const authenticatedUser: User = {
        id: data.id,
        name: data.name,
        token: data.token,
      };

      localStorage.setItem('shelf_life_user', JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      return { success: true };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: 'Could not connect to the server. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('shelf_life_user');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
