
import React, { useState } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const PantryManager: React.FC = () => {
    const { state, createPantry, joinPantry, switchPantry } = useSyncStore();
    const [pantryName, setPantryName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const activePantry = state.pantries.find(p => p.id === state.activePantryId);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pantryName.trim()) return;
        setIsCreating(true);
        try {
            await createPantry(pantryName);
            setPantryName('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;
        setIsJoining(true);
        try {
            await joinPantry(inviteCode);
            setInviteCode('');
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to join");
        } finally {
            setIsJoining(false);
        }
    };

    const copyInviteCode = () => {
        if (activePantry?.code) {
            navigator.clipboard.writeText(activePantry.code);
            alert("Invite code copied to clipboard!");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Active Pantry & Switcher */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Pantry</h3>
                    <span className="text-[9px] bg-emerald-100 px-2 py-0.5 rounded-md font-black text-emerald-600">
                        {state.pantries.length} TOTAL
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.pantries.map((pantry) => (
                        <button
                            key={pantry.id}
                            onClick={() => switchPantry(pantry.id)}
                            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between group ${state.activePantryId === pantry.id
                                    ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10'
                                    : 'bg-slate-50 border-transparent hover:border-slate-200'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${state.activePantryId === pantry.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                                    } shadow-sm`}>
                                    🏠
                                </div>
                                <div>
                                    <p className={`font-black tracking-tight ${state.activePantryId === pantry.id ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {pantry.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        {pantry.createdBy === state.user?.id ? 'Owner' : 'Member'}
                                    </p>
                                </div>
                            </div>
                            {state.activePantryId === pantry.id && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            )}
                        </button>
                    ))}
                </div>
            </section>

            {/* Invitation Details for Active Pantry */}
            {activePantry && (
                <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4 shadow-xl shadow-slate-900/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xl font-black tracking-tight">Invite Others</h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Shared code for {activePantry.name}</p>
                        </div>
                        <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 font-mono text-emerald-400 font-black text-lg tracking-widest">
                            {activePantry.code}
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={copyInviteCode}
                        className="bg-emerald-500 hover:bg-emerald-400 border-none text-[11px] font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem]"
                    >
                        Copy Shareable Link
                    </Button>
                </section>
            )}

            {/* Actions: Create or Join */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-8 space-y-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Create New</h4>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <Input
                            placeholder="e.g. Beach House"
                            value={pantryName}
                            onChange={(e) => setPantryName(e.target.value)}
                        />
                        <Button variant="secondary" fullWidth disabled={isCreating}>
                            {isCreating ? 'Creating...' : 'Create Pantry'}
                        </Button>
                    </form>
                </Card>

                <Card className="p-8 space-y-4 border-dashed border-2">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Join Shared</h4>
                    <form onSubmit={handleJoin} className="space-y-3">
                        <Input
                            placeholder="Paste 8-digit code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                        />
                        <Button variant="ghost" fullWidth disabled={isJoining} className="bg-slate-50 border-slate-200">
                            {isJoining ? 'Joining...' : 'Join with Code'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};
