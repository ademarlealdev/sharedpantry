
import React, { useState, useEffect } from 'react';
import { MobileContainer } from './components/Layout';
import { useSyncStore } from './store/useSyncStore';
import { GroceryList } from './components/GroceryList';
import { AddBar } from './components/AddBar';
import { Login } from './components/Login';
import { ProfileView } from './components/ProfileView';
import { Button } from './components/ui/Button';

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
    logout
  } = useSyncStore();

  const [view, setView] = useState<'list' | 'profile'>('list');

  // Reset view to 'list' when user state changes (login/logout)
  useEffect(() => {
    setView('list');
  }, [state.user?.id]);

  if (loading) {
    return (
      <MobileContainer>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Checking Pantry Access...</p>
        </div>
      </MobileContainer>
    );
  }

  if (!state.user) {
    return (
      <MobileContainer>
        <Login onLogin={login} />
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <header className="w-full bg-white/80 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-100/50">
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-6 flex justify-between items-center">
          <div className="flex items-center space-x-3.5">
            {view === 'profile' ? (
              <Button
                variant="icon"
                onClick={() => setView('list')}
                aria-label="Back to list"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            ) : (
              <div className="w-11 h-11 flex items-center justify-center">
                <span className="text-3xl">🏠</span>
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl font-[900] text-slate-900 tracking-tighter leading-none">
                {view === 'profile' ? 'Settings' : 'SharedPantry'}
              </h1>
              <p className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-1">
                {view === 'profile' ? 'Pantry Management' : 'Local Storage Sync'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setView(view === 'list' ? 'profile' : 'list')}
            className={`w-11 h-11 flex items-center justify-center rounded-full border-2 transition-all active:scale-90 overflow-hidden ${view === 'profile'
              ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
              : 'border-slate-100 bg-slate-50 hover:border-emerald-200'
              }`}
          >
            {view === 'profile' ? (
              <span className="text-xl">👤</span>
            ) : (
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 relative">
        {view === 'list' ? (
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
              userName={state.user?.name || 'User'}
              items={state.items}
            />
          </div>
        ) : (
          <ProfileView
            user={state.user}
            group={state.group}
            onLogout={logout}
          />
        )}
      </div>
    </MobileContainer>
  );
};

export default App;
