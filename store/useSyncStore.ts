
import { useState, useEffect } from 'react';
import { GroceryItem, AppState } from '../types';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'shared_pantry_data_v1';

const INITIAL_STATE: AppState = {
  user: null,
  group: {
    id: 'local-pantry',
    name: 'SharedPantry',
    code: 'HOME',
    members: []
  },
  items: [],
  isInitialized: false
};

export const useSyncStore = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  // Load local state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed, isInitialized: true }));
      } else {
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    } catch (e) {
      console.error("Local storage read failed", e);
    }
  }, []);

  // Set up Supabase auth listener
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session?.user ?? null);
      if (session === null) {
        // Clear local storage on logout if needed, or just let the user state be null
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = (supabaseUser: User | null) => {
    setState(prev => {
      if (!supabaseUser) {
        return { ...prev, user: null };
      }

      const newUser = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
        role: 'Administrator' // Defaulting to admin for now, can be sophisticated later
      } as const;

      return {
        ...prev,
        user: newUser,
        group: prev.group ? {
          ...prev.group,
          members: [newUser as any] // In a real app, this would come from a database join
        } : null
      };
    });
  };

  // Sync state to local storage
  useEffect(() => {
    if (state.isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error", error);
  };

  // Rest of the functions remain the same for now, but in a real app would sync with Supabase
  const addItem = (item: GroceryItem) => {
    setState(prev => ({
      ...prev,
      items: [item, ...prev.items]
    }));
  };

  const toggleItem = (id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, isBought: !i.isBought } : i)
    }));
  };

  const updateItem = (id: string, updates: Partial<GroceryItem>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i)
    }));
  };

  const removeItem = (id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));
  };

  const clearBought = () => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(i => !i.isBought)
    }));
  };

  return {
    state,
    loading,
    login,
    logout,
    addItem,
    toggleItem,
    removeItem,
    updateItem,
    clearBought,
    connectionStatus: 'connected' as const,
    lastError: null
  };
};
