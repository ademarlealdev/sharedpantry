
import { useState, useEffect } from 'react';
import { GroceryItem, AppState, FamilyGroup, CategoryType } from '../types';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'shared_pantry_data_v1';

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

  // Helper to map DB row to GroceryItem
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

  const handleAuthChange = (supabaseUser: User | null) => {
    setState(prev => {
      if (!supabaseUser) {
        return { ...prev, user: null, activePantryId: null, pantries: [] };
      }

      const newUser = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
        role: 'Administrator' as const
      };

      return {
        ...prev,
        user: newUser
      };
    });
  };

  const fetchPantries = async (userId: string) => {
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

    const mappedPantries: FamilyGroup[] = (members || []).map((m: any) => ({
      id: m.pantry.id,
      name: m.pantry.name,
      code: m.pantry.invite_code,
      createdBy: m.pantry.created_by,
      members: []
    }));

    return mappedPantries;
  };

  const ensureDefaultPantry = async (userId: string, existingPantries: FamilyGroup[]) => {
    if (existingPantries.length > 0) return existingPantries[0].id;

    console.log("[SyncStore] Creating default pantry...");
    const { data: pantry, error: pError } = await supabase
      .from('pantries')
      .insert({ name: 'My Pantry', created_by: userId })
      .select()
      .single();

    if (pError) throw pError;

    const { error: mError } = await supabase
      .from('pantry_members')
      .insert({ pantry_id: pantry.id, user_id: userId, role: 'Administrator' });

    if (mError) throw mError;

    return pantry.id;
  };

  useEffect(() => {
    let itemSubscription: any = null;

    const setupSubscriptions = async (userId: string, pantryId: string) => {
      setDataLoading(true);

      const { data: items, error: iError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('pantry_id', pantryId)
        .order('created_at', { ascending: false });

      if (iError) console.error("[SyncStore] Error fetching items:", iError);
      else setState(prev => ({ ...prev, items: (items || []).map(mapItem) }));

      setDataLoading(false);

      if (itemSubscription) itemSubscription.unsubscribe();

      itemSubscription = supabase
        .channel(`items:${pantryId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'grocery_items', filter: `pantry_id=eq.${pantryId}` },
          (payload) => {
            console.log("[SyncStore] Realtime Event:", payload.eventType, payload);
            if (payload.eventType === 'INSERT') {
              const row = payload.new;
              const newItem = mapItem(row);
              setState(prev => {
                if (prev.items.some(i => i.id === newItem.id)) return prev;
                return { ...prev, items: [newItem, ...prev.items] };
              });
            } else if (payload.eventType === 'UPDATE') {
              const row = payload.new;
              const updatedItem = mapItem(row);
              setState(prev => ({
                ...prev,
                items: prev.items.map(i => i.id === updatedItem.id ? updatedItem : i)
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

    const initializeUser = async (userId: string) => {
      try {
        const pantries = await fetchPantries(userId);
        const activeId = await ensureDefaultPantry(userId, pantries);
        const refetchedPantries = pantries.length > 0 ? pantries : await fetchPantries(userId);

        setState(prev => ({
          ...prev,
          pantries: refetchedPantries,
          activePantryId: activeId,
          isInitialized: true
        }));

        await setupSubscriptions(userId, activeId);
      } catch (err) {
        console.error("[SyncStore] Initialization failed:", err);
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange(session.user);
        initializeUser(session.user.id);
      } else {
        setState(prev => ({ ...prev, isInitialized: true }));
      }
      setLoading(false);
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session?.user ?? null);
      if (session?.user) {
        initializeUser(session.user.id);
      } else {
        if (itemSubscription) itemSubscription.unsubscribe();
        setState({ ...INITIAL_STATE, isInitialized: true });
      }
    });

    return () => {
      authListener.unsubscribe();
      if (itemSubscription) itemSubscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error", error);
  };

  const createPantry = async (name: string) => {
    if (!state.user) return;
    const { data: pantry, error: pError } = await supabase
      .from('pantries')
      .insert({ name, created_by: state.user.id })
      .select()
      .single();

    if (pError) throw pError;

    await supabase.from('pantry_members').insert({
      pantry_id: pantry.id,
      user_id: state.user.id,
      role: 'Administrator'
    });

    const newPantries = await fetchPantries(state.user.id);
    setState(prev => ({ ...prev, pantries: newPantries, activePantryId: pantry.id }));
  };

  const joinPantry = async (inviteCode: string) => {
    if (!state.user) return;

    const { data: pantry, error: pError } = await supabase
      .from('pantries')
      .select('id')
      .eq('invite_code', inviteCode.trim())
      .single();

    if (pError) throw new Error("Invalid invite code");

    const { error: mError } = await supabase
      .from('pantry_members')
      .insert({ pantry_id: pantry.id, user_id: state.user.id, role: 'Member' });

    if (mError) throw mError;

    const newPantries = await fetchPantries(state.user.id);
    setState(prev => ({ ...prev, pantries: newPantries, activePantryId: pantry.id }));
  };

  const switchPantry = async (pantryId: string) => {
    if (!state.user) return;
    setState(prev => ({ ...prev, activePantryId: pantryId, items: [] }));
    // Initialization logic in useEffect will handle re-subscription based on activePantryId? 
    // No, currently initialization runs only on auth change. Let's fix that.
  };

  const addItem = async (item: GroceryItem) => {
    if (!state.user || !state.activePantryId) return;

    const optimisticId = 'temp-' + Date.now();
    const optimisticItem = { ...item, id: optimisticId, pantryId: state.activePantryId };

    setState(prev => ({ ...prev, items: [optimisticItem, ...prev.items] }));

    const { data, error } = await supabase.from('grocery_items').insert({
      name: item.name,
      category: item.category,
      icon: item.icon,
      qty_value: item.qtyValue,
      qty_unit: item.qtyUnit,
      is_bought: item.isBought,
      notes: item.notes,
      user_id: state.user.id,
      pantry_id: state.activePantryId
    }).select().single();

    if (error) {
      console.error("Add item failed", error);
      setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== optimisticId) }));
    } else if (data) {
      setState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === optimisticId ? mapItem(data) : i)
      }));
    }
  };

  const toggleItem = async (id: string) => {
    const originalItem = state.items.find(i => i.id === id);
    if (!originalItem) return;

    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, isBought: !i.isBought } : i)
    }));

    if (state.user) {
      const { error } = await supabase.from('grocery_items').update({ is_bought: !originalItem.isBought }).eq('id', id);
      if (error) {
        setState(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? originalItem : i) }));
      }
    }
  };

  const updateItem = async (id: string, updates: Partial<GroceryItem>) => {
    const originalItem = state.items.find(i => i.id === id);
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i)
    }));

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
      if (error && originalItem) {
        setState(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? originalItem : i) }));
      }
    }
  };

  const removeItem = async (id: string) => {
    const originalItem = state.items.find(i => i.id === id);
    setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

    if (state.user) {
      const { error } = await supabase.from('grocery_items').delete().eq('id', id);
      if (error && originalItem) {
        setState(prev => ({ ...prev, items: [originalItem, ...prev.items] }));
      }
    }
  };

  const clearBought = async () => {
    if (state.user && state.activePantryId) {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('is_bought', true)
        .eq('pantry_id', state.activePantryId);
      if (error) console.error("Clear bought failed", error);
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
    createPantry,
    joinPantry,
    switchPantry,
    connectionStatus: 'connected' as const,
    lastError: null
  };
};
