
import { useState, useEffect, useCallback } from 'react';
import { GroceryItem, AppState, FamilyGroup, CategoryType } from '../types';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

const INITIAL_STATE: AppState = {
  user: null,
  pantries: [],
  activePantryId: null,
  items: [],
  isInitialized: false
};

export const useSyncStore = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const mapItem = (row: any): GroceryItem => ({
    id: row.id,
    name: row.name,
    category: row.category as CategoryType,
    icon: row.icon,
    qtyValue: row.qty_value,
    qtyUnit: row.qty_unit,
    isBought: row.is_bought,
    notes: row.notes,
    addedBy: row.user_id,
    createdAt: new Date(row.created_at).getTime(),
    pantryId: row.pantry_id
  });

  const fetchPantries = useCallback(async (userId: string) => {
    const { data: members, error: memError } = await supabase
      .from('pantry_members')
      .select(`
        role,
        pantry:pantries (*)
      `)
      .eq('user_id', userId);

    if (memError) {
      console.error("[SyncStore] Error fetching pantries:", memError);
      return [];
    }

    return (members || [])
      .filter((m: any) => m.pantry)
      .map((m: any) => ({
        id: m.pantry.id,
        name: m.pantry.name,
        code: m.pantry.invite_code,
        createdBy: m.pantry.created_by,
        members: []
      }));
  }, []);

  const ensureDefaultPantry = async (userId: string, existingPantries: FamilyGroup[]) => {
    if (existingPantries.length > 0) return existingPantries[0].id;

    console.log("[SyncStore] Creating default pantry...");
    const { data: pantry, error: pError } = await supabase
      .from('pantries')
      .insert({ name: 'My Pantry', created_by: userId })
      .select()
      .single();

    if (pError) throw pError;

    await supabase.from('pantry_members').insert({
      pantry_id: pantry.id,
      user_id: userId,
      role: 'Administrator'
    });

    return pantry.id;
  };

  // Auth Effect
  useEffect(() => {
    // Keep track of the last processed user ID to avoid redundant pantry fetches
    let lastProcessedUserId: string | null = null;

    const handleSession = async (session: any) => {
      try {
        if (session?.user) {
          const userId = session.user.id;

          // Update user state immediately if it changed
          setState(prev => {
            if (prev.user?.id === userId) return prev;
            return {
              ...prev,
              user: {
                id: userId,
                name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
                role: 'Administrator'
              }
            };
          });

          // Only fetch pantries if this is a new session for this user
          if (lastProcessedUserId !== userId) {
            lastProcessedUserId = userId;
            try {
              let userPantries = await fetchPantries(userId);
              let activeId = userPantries.length > 0 ? userPantries[0].id : null;

              if (!activeId) {
                activeId = await ensureDefaultPantry(userId, userPantries);
                userPantries = await fetchPantries(userId);
              }

              const uniquePantries = Array.from(new Map(
                (userPantries as FamilyGroup[])
                  .filter(p => p && p.id)
                  .map(p => [p.id, p])
              ).values());

              setState(prev => ({
                ...prev,
                pantries: uniquePantries,
                activePantryId: activeId || (uniquePantries.length > 0 ? uniquePantries[0].id : null),
                isInitialized: true
              }));
            } catch (pantryErr) {
              console.error("[SyncStore] Background pantry fetch failed:", pantryErr);
              setState(prev => ({ ...prev, isInitialized: true }));
            }
          }
        } else {
          lastProcessedUserId = null;
          setState({ ...INITIAL_STATE, isInitialized: true });
        }
      } catch (err) {
        console.error("[SyncStore] Session handling failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[SyncStore] Auth Event:", event);
      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        lastProcessedUserId = null;
        setState({ ...INITIAL_STATE, isInitialized: true });
        setLoading(false);
      }
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    }).catch(() => setLoading(false));

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchPantries]);

  // Data Sync Effect
  useEffect(() => {
    if (!state.user || !state.activePantryId) return;

    let itemSubscription: any = null;
    let isActive = true;

    const setupItems = async () => {
      setDataLoading(true);
      const { data: items, error: iError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('pantry_id', state.activePantryId)
        .order('created_at', { ascending: false });

      if (!isActive) return;

      if (iError) console.error("[SyncStore] Fetch items failed:", iError);
      else setState(prev => ({ ...prev, items: (items || []).map(mapItem) }));
      setDataLoading(false);

      if (itemSubscription) itemSubscription.unsubscribe();

      itemSubscription = supabase
        .channel(`items:${state.activePantryId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'grocery_items', filter: `pantry_id=eq.${state.activePantryId}` },
          (payload) => {
            if (!isActive) return;
            if (payload.eventType === 'INSERT') {
              const newItem = mapItem(payload.new);
              setState(prev => prev.items.some(i => i.id === newItem.id) ? prev : { ...prev, items: [newItem, ...prev.items] });
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapItem(payload.new);
              setState(prev => ({ ...prev, items: prev.items.map(i => i.id === updated.id ? updated : i) }));
            } else if (payload.eventType === 'DELETE') {
              setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== payload.old.id) }));
            }
          }
        )
        .subscribe();
    };

    setupItems();

    return () => {
      isActive = false;
      if (itemSubscription) itemSubscription.unsubscribe();
    };
  }, [state.user?.id, state.activePantryId]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const createPantry = async (name: string) => {
    if (!state.user) return;
    const { data: pantry, error } = await supabase.from('pantries').insert({ name, created_by: state.user.id }).select().single();
    if (error) throw error;
    await supabase.from('pantry_members').insert({ pantry_id: pantry.id, user_id: state.user.id, role: 'Administrator' });
    const userPantries = await fetchPantries(state.user.id);
    setState(prev => ({ ...prev, pantries: userPantries, activePantryId: pantry.id }));
  };

  const joinPantry = async (code: string) => {
    if (!state.user) return;
    const { data: pantry, error: pError } = await supabase.from('pantries').select('id').eq('invite_code', code.trim()).single();
    if (pError) throw new Error("Invalid code");
    await supabase.from('pantry_members').insert({ pantry_id: pantry.id, user_id: state.user.id, role: 'Member' });
    const userPantries = await fetchPantries(state.user.id);
    setState(prev => ({ ...prev, pantries: userPantries, activePantryId: pantry.id }));
  };

  const leavePantry = async (id: string) => {
    if (!state.user) return;
    const { error } = await supabase.from('pantry_members').delete().eq('pantry_id', id).eq('user_id', state.user.id);
    if (error) throw error;

    const userPantries = await fetchPantries(state.user.id);
    const fallbackId = userPantries.length > 0 ? userPantries[0].id : null;
    setState(prev => ({ ...prev, pantries: userPantries, activePantryId: fallbackId, items: [] }));
  };

  const deletePantry = async (id: string) => {
    if (!state.user) return;
    // Database will cascade delete items and members due to foreign keys (if configured)
    // For safety with current Supabase setup, we'll delete the pantry row
    const { error } = await supabase.from('pantries').delete().eq('id', id).eq('created_by', state.user.id);
    if (error) throw error;

    const userPantries = await fetchPantries(state.user.id);
    const fallbackId = userPantries.length > 0 ? userPantries[0].id : null;
    setState(prev => ({ ...prev, pantries: userPantries, activePantryId: fallbackId, items: [] }));
  };

  const switchPantry = (id: string) => {
    setState(prev => ({ ...prev, activePantryId: id, items: [] }));
  };

  const addItem = async (item: GroceryItem) => {
    if (!state.user || !state.activePantryId) return;
    const tempId = 'temp-' + Date.now();
    setState(prev => ({ ...prev, items: [{ ...item, id: tempId, pantryId: state.activePantryId! }, ...prev.items] }));

    const { data, error } = await supabase.from('grocery_items').insert({
      name: item.name, category: item.category, icon: item.icon,
      qty_value: item.qtyValue, qty_unit: item.qtyUnit,
      is_bought: item.isBought, notes: item.notes,
      user_id: state.user.id, pantry_id: state.activePantryId
    }).select().single();

    if (error) {
      setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== tempId) }));
    } else {
      setState(prev => ({ ...prev, items: prev.items.map(i => i.id === tempId ? mapItem(data) : i) }));
    }
  };

  const toggleItem = async (id: string) => {
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    setState(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, isBought: !i.isBought } : i) }));
    const { error } = await supabase.from('grocery_items').update({ is_bought: !item.isBought }).eq('id', id);
    if (error) setState(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? item : i) }));
  };

  const removeItem = async (id: string) => {
    const item = state.items.find(i => i.id === id);
    setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    const { error } = await supabase.from('grocery_items').delete().eq('id', id);
    if (error && item) setState(prev => ({ ...prev, items: [item, ...prev.items] }));
  };

  const updateItem = async (id: string, updates: Partial<GroceryItem>) => {
    const item = state.items.find(i => i.id === id);
    setState(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i) }));
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.icon) dbUpdates.icon = updates.icon;
    if (updates.qtyValue) dbUpdates.qty_value = updates.qtyValue;
    if (updates.isBought !== undefined) dbUpdates.is_bought = updates.isBought;

    const { error } = await supabase.from('grocery_items').update(dbUpdates).eq('id', id);
    if (error && item) setState(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? item : i) }));
  };

  const clearBought = async () => {
    if (!state.activePantryId) return;
    await supabase.from('grocery_items').delete().eq('is_bought', true).eq('pantry_id', state.activePantryId);
  };

  return {
    state, loading, dataLoading, login, logout,
    addItem, toggleItem, removeItem, updateItem, clearBought,
    createPantry, joinPantry, switchPantry, leavePantry, deletePantry
  };
};
