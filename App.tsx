
import React, { useState, useEffect } from 'react';
import { MobileContainer } from './components/Layout';
import { PantryLogo } from './components/ui/Logo';
import { useSyncStore } from './store/useSyncStore';
import { GroceryList } from './components/GroceryList';
import { AddBar } from './components/AddBar';
import { Login } from './components/Login';
import { ProfileView } from './components/ProfileView';
import { Button } from './components/ui/Button';
import { PantrySwitcher } from './components/PantrySwitcher';

const App: React.FC = () => {
  const {
    state,
    loading,
    login,
    addItem,
    toggleItem,
    removeItem,
    updateItem,
    clearBought,
    logout,
    deleteAccount
  } = useSyncStore();

  const [view, setView] = useState<'list' | 'profile'>('list');

  // Reset view to 'list' when user state changes (login/logout)
  useEffect(() => {
    setView('list');
  }, [state.user?.id]);

  if (loading || !state.isInitialized) {
    return (
      <MobileContainer>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Checking Pantry Access...</p>
        </div>
      </MobileContainer>
    );
  }

  // Show login page if not authenticated OR in recovery mode
  if (!state.user || state.isRecoveryMode) {
    return (
      <MobileContainer>
        <Login onLogin={login} />
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <header className="w-full bg-[#FDFBF7]/90 backdrop-blur-xl sticky top-0 z-30 border-b border-[#E9E4D9]/50 shadow-sm">
        {/* Elegant top brand label */}
        <div className="w-full flex justify-center pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-[#E9E4D9]/30 bg-[#FDFBF7]/50">
          <span className="text-[11px] font-black text-[#4C6B51] uppercase tracking-[0.4em]">SharedPantry</span>
        </div>
        <div className="w-full px-6 pt-8 pb-6 flex justify-between items-center min-h-[110px]">
          <div className="flex items-center space-x-3.5 text-left min-w-0">
            {view === 'profile' ? (
              <div className="flex items-center space-x-3.5">
                <Button
                  variant="icon"
                  onClick={() => setView('list')}
                  aria-label="Back to list"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <div className="flex flex-col">
                  <h1 className="text-xl font-[900] text-slate-900 tracking-tighter leading-none">Settings</h1>
                  <p className="text-[9px] text-[#4C6B51] font-black uppercase tracking-[0.2em] mt-1">Manage Shared Pantries</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3.5 min-w-0">
                <PantryLogo />
                <PantrySwitcher />
              </div>
            )}
          </div>

          <button
            onClick={() => setView(view === 'list' ? 'profile' : 'list')}
            className={`flex items-center transition-all active:scale-95 rounded-full border ${view === 'profile'
              ? 'border-[#4C6B51] bg-[#F8F5EE] shadow-lg shadow-[#4C6B51]/10'
              : 'border-[#E9E4D9] bg-white hover:border-[#4C6B51]/30'
              } p-1 sm:pl-4 sm:pr-1.5 sm:py-1.5 sm:space-x-3`}
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">
              {state.user.name}
            </span>
            <div className="w-9 h-9 bg-[#4C6B51] flex items-center justify-center text-white font-black text-xs rounded-full shadow-sm shrink-0">
              {state.user.name[0]}
            </div>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 relative">
        {view === 'list' ? (
          state.pantries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-24 h-24 flex items-center justify-center">
                <PantryLogo className="w-20 h-20 soft-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">No Pantry Found</h2>
                <p className="text-slate-500 text-sm max-w-[240px] font-medium leading-relaxed">Create your first pantry or join one with a code to start adding items.</p>
              </div>
              <Button onClick={() => setView('profile')} variant="primary" className="px-8 py-4 rounded-3xl">
                Go to Settings
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              <GroceryList
                items={state.items}
                onToggle={toggleItem}
                onRemove={removeItem}
                onUpdate={updateItem}
                onClearBought={clearBought}
              />
              <AddBar
                onAdd={addItem}
                onUpdate={updateItem}
                userName={state.user.name}
                items={state.items}
              />
            </div>
          )
        ) : (
          <ProfileView
            user={state.user}
            pantries={state.pantries}
            activePantryId={state.activePantryId}
            onLogout={logout}
            onDeleteAccount={deleteAccount}
          />
        )}
      </div>
    </MobileContainer >
  );
};

export default App;
