
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
  const [dataLoading, setDataLoading] = useState(false);

  const handleAuthChange = (supabaseUser: User | null) => {
    setState(prev => {
      if (!supabaseUser) {
        return { ...prev, user: null };
      }

      const newUser = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
        role: 'Administrator' // Defaulting to admin
      } as const;

      return {
        ...prev,
        user: newUser,
        group: prev.group ? { ...prev.group, members: [newUser as any] } : null
      };
    });
  };

  // Load local state on mount (only if not authenticated initially later)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only load local items if we determine we aren't logged in yet, or as initial state
        // But auth check happens async. So we load local first.
        setState(prev => ({ ...prev, ...parsed, isInitialized: true }));
      } else {
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    } catch (e) {
      console.error("Local storage read failed", e);
    }
  }, []);

  // Set up Supabase auth listener and Data Subscription
  useEffect(() => {
    let subscription: any = null;

    const setupDataSubscription = async (userId: string) => {
      setDataLoading(true);

      // 1. Fetch initial data
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching items:', error);
      } else if (data) {
        const mappedItems: GroceryItem[] = data.map(row => ({
          id: row.id,
          name: row.name,
          category: row.category,
          icon: row.icon,
          qtyValue: row.qty_value,
          qtyUnit: row.qty_unit,
          isBought: row.is_bought,
          notes: row.notes,
          addedBy: row.user_id,
          createdAt: new Date(row.created_at).getTime()
        }));

        setState(prev => ({ ...prev, items: mappedItems }));
      }
      setDataLoading(false);

      // 2. Subscribe to changes
      subscription = supabase
        .channel('grocery_items_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'grocery_items', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const row = payload.new;
              const newItem: GroceryItem = {
                id: row.id,
                name: row.name,
                category: row.category,
                icon: row.icon,
                qtyValue: row.qty_value,
                qtyUnit: row.qty_unit,
                isBought: row.is_bought,
                notes: row.notes,
                addedBy: row.user_id,
                createdAt: new Date(row.created_at).getTime()
              };
              setState(prev => ({
                ...prev,
                items: [newItem, ...prev.items.filter(i => i.id !== newItem.id)]
              }));
            } else if (payload.eventType === 'UPDATE') {
              const row = payload.new;
              setState(prev => ({
                ...prev,
                items: prev.items.map(i => i.id === row.id ? {
                  ...i,
                  name: row.name,
                  category: row.category,
                  icon: row.icon,
                  qtyValue: row.qty_value,
                  qtyUnit: row.qty_unit,
                  isBought: row.is_bought,
                  notes: row.notes,
                } : i)
              }));
            } else if (payload.eventType === 'DELETE') {
              const row = payload.old;
              setState(prev => ({
                ...prev,
                items: prev.items.filter(i => i.id !== row.id)
              }));
            }
          }
        )
        .subscribe();
    };

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange(session.user);
        setupDataSubscription(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session?.user ?? null);

      if (session?.user) {
        setupDataSubscription(session.user.id);
      } else {
        // User logged out
        if (subscription) subscription.unsubscribe();
        // Optionally clear items or revert to local storage?
        // For now, let's clear items to avoid showing previous user's data
        setState(prev => ({ ...prev, items: [] }));
      }
    });

    return () => {
      authListener.unsubscribe();
      if (subscription) subscription.unsubscribe();
    };
  }, []);



  // Sync state to local storage (Only if user is NULL, i.e., Guest Mode)
  useEffect(() => {
    if (state.isInitialized && !state.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error", error);
  };

  const addItem = async (item: GroceryItem) => {
    if (state.user) {
      // Supabase
      const { error } = await supabase.from('grocery_items').insert({
        // id autogenerated
        name: item.name,
        category: item.category,
        icon: item.icon,
        qty_value: item.qtyValue,
        qty_unit: item.qtyUnit,
        is_bought: item.isBought,
        notes: item.notes,
        user_id: state.user.id
      });
      if (error) console.error("Add item failed", error);
      // Realtime subscription will update state
    } else {
      // Local
      setState(prev => ({ ...prev, items: [item, ...prev.items] }));
    }
  };

  const toggleItem = async (id: string) => {
    if (state.user) {
      const item = state.items.find(i => i.id === id);
      if (!item) return;
      const { error } = await supabase.from('grocery_items').update({ is_bought: !item.isBought }).eq('id', id);
      if (error) console.error("Toggle item failed", error);
    } else {
      setState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === id ? { ...i, isBought: !i.isBought } : i)
      }));
    }
  };

  const updateItem = async (id: string, updates: Partial<GroceryItem>) => {
    if (state.user) {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.icon) dbUpdates.icon = updates.icon;
      if (updates.qtyValue !== undefined) dbUpdates.qty_value = updates.qtyValue;
      if (updates.qtyUnit !== undefined) dbUpdates.qty_unit = updates.qtyUnit;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.isBought !== undefined) dbUpdates.is_bought = updates.isBought;

      const { error } = await supabase.from('grocery_items').update(dbUpdates).eq('id', id);
      if (error) console.error("Update item failed", error);
    } else {
      setState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i)
      }));
    }
  };

  const removeItem = async (id: string) => {
    if (state.user) {
      const { error } = await supabase.from('grocery_items').delete().eq('id', id);
      if (error) console.error("Delete item failed", error);
    } else {
      setState(prev => ({
        ...prev,
        items: prev.items.filter(i => i.id !== id)
      }));
    }
  };

  const clearBought = async () => {
    if (state.user) {
      const { error } = await supabase.from('grocery_items').delete().eq('is_bought', true).eq('user_id', state.user.id);
      if (error) console.error("Clear bought failed", error);
    } else {
      setState(prev => ({
        ...prev,
        items: prev.items.filter(i => !i.isBought)
      }));
    }
  };

  return {
    state,
    loading: loading || dataLoading,
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
