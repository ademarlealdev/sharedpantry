
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GroceryItem, AppState, FamilyGroup, CategoryType, FamilyMember } from '../types';
import { supabase } from '../services/supabase';

const INITIAL_STATE: AppState = {
  user: null,
  pantries: [],
  activePantryId: null,
  items: [],
  currentMembers: [],
  isInitialized: false
};

interface SyncStoreContextType {
  state: AppState;
  loading: boolean;
  dataLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addItem: (item: GroceryItem) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  clearBought: () => Promise<void>;
  createPantry: (name: string) => Promise<void>;
  joinPantry: (code: string) => Promise<void>;
  switchPantry: (id: string) => void;
  leavePantry: (id: string) => Promise<void>;
  deletePantry: (id: string) => Promise<void>;
  fetchMembers: (pantryId: string) => Promise<void>;
  removeMember: (pantryId: string, userId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const SyncStoreContext = createContext<SyncStoreContextType | undefined>(undefined);

export const SyncStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    console.log(`[SyncStore] Fetching pantries for user: ${userId}`);
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

    console.log(`[SyncStore] Raw member data fetched:`, members);

    const mapped = (members || [])
      .filter((m: any) => m.pantry)
      .map((m: any) => ({
        id: m.pantry.id,
        name: m.pantry.name,
        code: m.pantry.invite_code,
        createdBy: m.pantry.created_by,
        userRole: m.role as 'Administrator' | 'Member',
        members: []
      }))
      .sort((a, b) => {
        // 1. Administrator first
        if (a.userRole === 'Administrator' && b.userRole !== 'Administrator') return -1;
        if (a.userRole !== 'Administrator' && b.userRole === 'Administrator') return 1;

        // 2. Then alphabetical by name
        return a.name.localeCompare(b.name);
      });

    console.log(`[SyncStore] Mapped & Sorted pantries:`, mapped);
    return mapped;
  }, []);

  // Auth Effect
  useEffect(() => {
    let lastProcessedUserId: string | null = null;

    const handleSession = async (session: any) => {
      try {
        if (session?.user) {
          const userId = session.user.id;

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

          if (lastProcessedUserId !== userId) {
            lastProcessedUserId = userId;
            try {
              let userPantries = await fetchPantries(userId);

              const uniquePantries = Array.from(new Map(
                (userPantries as FamilyGroup[])
                  .filter(p => p && p.id)
                  .map(p => [p.id, p])
              ).values());

              const activeId = uniquePantries.length > 0 ? uniquePantries[0].id : null;

              setState(prev => ({
                ...prev,
                pantries: uniquePantries,
                activePantryId: activeId,
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

  // Membership Sync Effect (Real-time gain/loss of pantry access)
  useEffect(() => {
    if (!state.user?.id) return;

    console.log(`[SyncStore] Setting up membership sync for ${state.user.id}`);

    const membershipSubscription = supabase
      .channel(`membership:${state.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pantry_members',
          filter: `user_id=eq.${state.user.id}`
        },
        async (payload) => {
          console.log("[SyncStore] Membership change detected:", payload.eventType);
          // Refresh the pantry list whenever our membership changes
          const userPantries = await fetchPantries(state.user!.id);
          setState(prev => ({
            ...prev,
            pantries: userPantries,
            // If the active pantry was the one removed, switch away
            activePantryId: userPantries.some(p => p.id === prev.activePantryId)
              ? prev.activePantryId
              : (userPantries.length > 0 ? userPantries[0].id : null)
          }));
        }
      )
      .subscribe();

    return () => {
      membershipSubscription.unsubscribe();
    };
  }, [state.user?.id, fetchPantries]);

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

    const trimmedName = name.trim();
    // Local check across ALL pantries in state (owned and joined)
    const isDuplicate = state.pantries.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      throw new Error(`You already have a pantry named "${trimmedName}".`);
    }

    const { data: pantry, error } = await supabase.from('pantries').insert({ name: trimmedName, created_by: state.user.id }).select().single();
    if (error) throw error;
    await supabase.from('pantry_members').insert({ pantry_id: pantry.id, user_id: state.user.id, role: 'Administrator' });
    const userPantries = await fetchPantries(state.user.id);
    setState(prev => ({
      ...prev,
      pantries: userPantries,
      activePantryId: pantry.id,
      items: [] // Ensure fresh start
    }));
  };

  const joinPantry = async (code: string) => {
    if (!state.user) return;

    const cleanCode = code.trim();
    console.log(`[SyncStore] Attempting to join pantry with code: ${cleanCode}`);

    // Step 1: Find the pantry by code (Case-insensitive lookup)
    const { data: pantry, error: pError } = await supabase
      .from('pantries')
      .select('id, name, created_by')
      .ilike('invite_code', cleanCode)
      .single();

    if (pError) {
      console.error("[SyncStore] Pantry lookup failed for code:", cleanCode, pError);
      if (pError.code === 'PGRST116') {
        throw new Error("Invalid invite code. Codes are case-insensitive, but please double-check the spelling.");
      }
      throw new Error(`Lookup failed: ${pError.message || "Unknown error"}`);
    }

    // Step 2: Prevent owner from joining their own pantry via code
    if (pantry.created_by === state.user.id) {
      throw new Error("You already own this space.");
    }

    // Step 3: Check if already a member (locally first)
    const isAlreadyMember = state.pantries.some(p => p.id === pantry.id);
    if (isAlreadyMember) {
      throw new Error(`You are already a member of "${pantry.name}".`);
    }

    // Double check with DB to be extra safe
    const { data: existingMember } = await supabase
      .from('pantry_members')
      .select('role')
      .eq('pantry_id', pantry.id)
      .eq('user_id', state.user.id)
      .maybeSingle();

    if (existingMember) {
      throw new Error(`You are already a member of "${pantry.name}".`);
    }

    // Step 4: Insert the new membership record
    const { error: mError } = await supabase
      .from('pantry_members')
      .insert({
        pantry_id: pantry.id,
        user_id: state.user.id,
        role: 'Member'
      });

    if (mError) {
      console.error("[SyncStore] Failed to join pantry:", mError);
      throw new Error(`Failed to join: ${mError.message}`);
    }

    // Step 5: Refresh local state and switch
    const userPantries = await fetchPantries(state.user.id);
    setState(prev => ({
      ...prev,
      pantries: userPantries,
      activePantryId: pantry.id,
      items: [] // Clear items to trigger fresh fetch for the new pantry
    }));
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

    console.log(`[SyncStore] Attempting to delete pantry: ${id}`);

    try {
      // Step 1: Delete the pantry itself
      // Foreign keys (items, members) should be set to ON DELETE CASCADE in Supabase
      const { error: pError } = await supabase
        .from('pantries')
        .delete()
        .eq('id', id)
        .eq('created_by', state.user.id);

      if (pError) {
        console.error("[SyncStore] Error deleting pantry record:", pError);
        throw new Error(`Failed to delete pantry: ${pError.message}`);
      }

      console.log("[SyncStore] Pantry deleted successfully.");

      // Step 4: Refresh local state
      const userPantries = await fetchPantries(state.user.id);

      // If we deleted the active pantry, switch to another one or null
      let newActiveId = state.activePantryId;
      if (state.activePantryId === id) {
        newActiveId = userPantries.length > 0 ? userPantries[0].id : null;
      }

      setState(prev => ({
        ...prev,
        pantries: userPantries,
        activePantryId: newActiveId,
        items: state.activePantryId === id ? [] : state.items
      }));

    } catch (err) {
      console.error("[SyncStore] Deletion flow failed:", err);
      throw err;
    }
  };

  const switchPantry = (id: string) => {
    setState(prev => {
      if (prev.activePantryId === id) return prev;
      return { ...prev, activePantryId: id, items: [], currentMembers: [] };
    });
  };

  const fetchMembers = async (pantryId: string) => {
    console.log(`[SyncStore] Fetching members for: ${pantryId}`);

    // 1. Fetch base members first (This should always work if RLS is correct)
    const { data: members, error: mError } = await supabase
      .from('pantry_members')
      .select('user_id, role')
      .eq('pantry_id', pantryId);

    console.log(`[SyncStore] Raw members result:`, { members, mError });

    if (mError) {
      console.error("[SyncStore] Members fetch failed:", mError);
      throw mError;
    }

    if (!members || members.length === 0) {
      setState(prev => ({ ...prev, currentMembers: [] }));
      return;
    }

    // 2. Fetch profiles separately (Robust against join/schema issues)
    const userIds = members.map(m => m.user_id);
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (pError) {
      console.warn("[SyncStore] Profiles fetch failed (likely SQL not applied):", pError);
    }

    // 3. Map and merge
    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    const mappedMembers: FamilyMember[] = members.map(m => {
      const isMe = m.user_id === state.user?.id;
      const profileName = profileMap.get(m.user_id);

      const name = profileName || (isMe ? state.user?.name : `User ${m.user_id.slice(0, 4)}`);

      return {
        id: m.user_id,
        name,
        role: m.role as 'Administrator' | 'Member'
      };
    });

    setState(prev => ({ ...prev, currentMembers: mappedMembers }));
  };

  const removeMember = async (pantryId: string, userId: string) => {
    if (!state.user) return;

    const { error } = await supabase
      .from('pantry_members')
      .delete()
      .eq('pantry_id', pantryId)
      .eq('user_id', userId);

    if (error) throw error;

    // Refresh member list
    await fetchMembers(pantryId);
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
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.qtyValue !== undefined) dbUpdates.qty_value = updates.qtyValue;
    if (updates.qtyUnit !== undefined) dbUpdates.qty_unit = updates.qtyUnit;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isBought !== undefined) dbUpdates.is_bought = updates.isBought;

    const { error } = await supabase.from('grocery_items').update(dbUpdates).eq('id', id);
    if (error && item) setState(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? item : i) }));
  };

  const clearBought = async () => {
    if (!state.activePantryId) return;
    await supabase.from('grocery_items').delete().eq('is_bought', true).eq('pantry_id', state.activePantryId);
  };

  const deleteAccount = useCallback(async () => {
    try {
      const userId = state.user?.id;
      if (!userId) throw new Error("No user logged in");

      console.log("[SyncStore] Starting account deletion for user:", userId);

      // Step 1: Get all pantries where user is the creator
      const { data: userPantries, error: pantriesError } = await supabase
        .from('pantries')
        .select('id')
        .eq('created_by', userId);

      if (pantriesError) {
        console.error("[SyncStore] Error fetching user pantries:", pantriesError);
      } else if (userPantries && userPantries.length > 0) {
        // Delete all pantries created by this user (cascades to items and members)
        const pantryIds = userPantries.map(p => p.id);
        const { error: deletePantriesError } = await supabase
          .from('pantries')
          .delete()
          .in('id', pantryIds);

        if (deletePantriesError) {
          console.error("[SyncStore] Error deleting pantries:", deletePantriesError);
        } else {
          console.log("[SyncStore] Deleted", pantryIds.length, "pantries");
        }
      }

      // Step 2: Remove user from all other pantries
      const { error: memberError } = await supabase
        .from('pantry_members')
        .delete()
        .eq('user_id', userId);

      if (memberError) {
        console.error("[SyncStore] Error removing from pantries:", memberError);
      } else {
        console.log("[SyncStore] Removed user from all pantries");
      }

      // Step 3: Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error("[SyncStore] Error deleting profile:", profileError);
      } else {
        console.log("[SyncStore] Deleted user profile");
      }

      // Step 4: Try to delete auth user via RPC (if function exists)
      const { error: rpcError } = await supabase.rpc('delete_own_user');

      if (rpcError) {
        console.warn("[SyncStore] RPC delete failed (function may not exist):", rpcError);
        // Fallback: Use admin API to delete user
        const { error: adminError } = await supabase.auth.admin.deleteUser(userId);

        if (adminError) {
          console.error("[SyncStore] Admin delete also failed:", adminError);
          // Last resort: just sign out
          console.log("[SyncStore] Proceeding with logout only");
        } else {
          console.log("[SyncStore] User deleted via admin API");
        }
      } else {
        console.log("[SyncStore] User deleted via RPC");
      }

      // Step 5: Sign out and reset state
      await logout();
      console.log("[SyncStore] Account deletion complete, user logged out");

    } catch (err: any) {
      console.error("[SyncStore] Delete account failed:", err);
      throw err;
    }
  }, [state.user?.id, logout]);

  const value = {
    state, loading, dataLoading, login, logout,
    addItem, toggleItem, removeItem, updateItem, clearBought,
    createPantry, joinPantry, switchPantry, leavePantry, deletePantry,
    fetchMembers, removeMember, deleteAccount
  };

  return (
    <SyncStoreContext.Provider value={value} >
      {children}
    </SyncStoreContext.Provider>
  );
};

export const useSyncStore = () => {
  const context = useContext(SyncStoreContext);
  if (context === undefined) {
    throw new Error('useSyncStore must be used within a SyncStoreProvider');
  }
  return context;
};
