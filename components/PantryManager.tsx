
import React, { useState } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

export const PantryManager: React.FC = () => {
    const {
        state,
        createPantry,
        joinPantry,
        switchPantry,
        deletePantry,
        leavePantry,
        fetchMembers,
        removeMember
    } = useSyncStore();
    const [pantryName, setPantryName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);

    // Custom Modal States
    const [pendingDelete, setPendingDelete] = useState<{ id: string, name: string } | null>(null);
    const [pendingLeave, setPendingLeave] = useState<{ id: string, name: string } | null>(null);
    const [viewingMembers, setViewingMembers] = useState<{ id: string, name: string, ownerId: string } | null>(null);
    const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
    const [isFetchingMembers, setIsFetchingMembers] = useState(false);

    const activePantry = state.pantries.find(p => p.id === state.activePantryId);

    const onConfirmDelete = async () => {
        if (!pendingDelete) return;
        const { id } = pendingDelete;
        setIsDeleting(id);
        try {
            await deletePantry(id);
            setPendingDelete(null); // Success! Close modal
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Failed to delete pantry.");
        } finally {
            setIsDeleting(null);
        }
    };

    const onConfirmLeave = async () => {
        if (!pendingLeave) return;
        const { id } = pendingLeave;
        setIsDeleting(id);
        try {
            await leavePantry(id);
            setPendingLeave(null); // Success!
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Failed to leave pantry.");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleShowMembers = async (pantry: any) => {
        setViewingMembers({ id: pantry.id, name: pantry.name, ownerId: pantry.createdBy });
        setIsFetchingMembers(true);
        try {
            await fetchMembers(pantry.id);
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetchingMembers(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!viewingMembers) return;
        setIsRemovingMember(userId);
        try {
            await removeMember(viewingMembers.id, userId);
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Failed to remove member.");
        } finally {
            setIsRemovingMember(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        if (!pantryName.trim()) return;
        setIsCreating(true);
        try {
            await createPantry(pantryName);
            setPantryName('');
        } catch (err) {
            console.error(err);
            setCreateError(err instanceof Error ? err.message : "Failed to create pantry.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError(null);
        if (!inviteCode.trim()) return;
        setIsJoining(true);
        try {
            await joinPantry(inviteCode);
            setInviteCode('');
        } catch (err) {
            console.error(err);
            setJoinError(err instanceof Error ? err.message : "Failed to join");
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
            {/* Custom Delete Modal */}
            <Modal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                title="Delete Space?"
                actions={
                    <>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setPendingDelete(null)}
                            disabled={!!isDeleting}
                            className="rounded-2xl py-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={onConfirmDelete}
                            isLoading={!!isDeleting}
                            className="bg-red-500 hover:bg-red-600 border-none rounded-2xl py-4"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 py-2">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2">
                        {isDeleting ? (
                            <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                        ) : '🗑️'}
                    </div>
                    <p className="text-center text-slate-500 text-sm font-medium leading-relaxed">
                        {isDeleting
                            ? "Cleaning up items and members..."
                            : <>Are you sure you want to delete <span className="text-slate-900 font-black">"{pendingDelete?.name}"</span>? This action cannot be undone.</>
                        }
                    </p>
                </div>
            </Modal>

            {/* Custom Leave Modal */}
            <Modal
                isOpen={!!pendingLeave}
                onClose={() => setPendingLeave(null)}
                title="Leave Space?"
                actions={
                    <>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setPendingLeave(null)}
                            disabled={!!isDeleting}
                            className="rounded-2xl py-4"
                        >
                            Stay
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={onConfirmLeave}
                            isLoading={!!isDeleting}
                            className="bg-slate-900 hover:bg-slate-800 border-none rounded-2xl py-4"
                        >
                            {isDeleting ? 'Leaving...' : 'Leave'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 py-2">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2">
                        {isDeleting ? (
                            <div className="w-8 h-8 border-4 border-slate-400/20 border-t-slate-900 rounded-full animate-spin"></div>
                        ) : '🚪'}
                    </div>
                    <p className="text-center text-slate-500 text-sm font-medium leading-relaxed">
                        {isDeleting
                            ? "Updating workspace access..."
                            : <>You will lose access to <span className="text-slate-900 font-black">"{pendingLeave?.name}"</span>. You'll need a new invite code to come back.</>
                        }
                    </p>
                </div>
            </Modal>

            {/* Active Pantry & Switcher */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Pantries</h3>
                    <span className="text-[9px] bg-emerald-100 px-2 py-0.5 rounded-md font-black text-emerald-600">
                        {state.pantries.length} TOTAL
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.pantries.map((pantry) => (
                        <div
                            key={pantry.id}
                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col space-y-4 group cursor-pointer ${state.activePantryId === pantry.id
                                ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10'
                                : 'bg-slate-50 border-transparent hover:border-slate-200'
                                }`}
                            onClick={() => switchPantry(pantry.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1 text-left">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${state.activePantryId === pantry.id ? 'bg-[#4C6B51] text-white shadow-xl shadow-[#4C6B51]/20' : 'bg-white text-slate-400'} shadow-sm border border-slate-100`}>
                                        <span>{state.activePantryId === pantry.id ? '📍' : '🏠'}</span>
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className={`font-black tracking-tight truncate ${state.activePantryId === pantry.id ? 'text-slate-800' : 'text-slate-500'}`}>
                                            {pantry.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            {pantry.createdBy === state.user?.id ? 'Owner' : 'Member'}
                                        </p>
                                    </div>
                                </div>
                                {state.activePantryId === pantry.id && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></div>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100/50">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShowMembers(pantry);
                                    }}
                                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl transition-all active:scale-95 group/members"
                                    aria-label="View Members"
                                >
                                    <svg className="w-4 h-4 transition-transform group-hover/members:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Members</span>
                                </button>

                                {pantry.createdBy === state.user?.id ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPendingDelete({ id: pantry.id, name: pantry.name });
                                        }}
                                        disabled={isDeleting === pantry.id}
                                        className="flex-[0.6] flex items-center justify-center space-x-2 py-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all active:scale-95 group/del"
                                        aria-label="Delete Pantry"
                                    >
                                        <svg className="w-4 h-4 transition-transform group-hover/del:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPendingLeave({ id: pantry.id, name: pantry.name });
                                        }}
                                        disabled={isDeleting === pantry.id}
                                        className="flex-[0.6] flex items-center justify-center space-x-2 py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl transition-all active:scale-95 group/leave"
                                        aria-label="Leave Pantry"
                                    >
                                        <svg className="w-4 h-4 transition-transform group-hover/leave:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Invitation Details - ONLY for Administrators */}
            {activePantry && activePantry.userRole === 'Administrator' && (
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
                        <div className="space-y-1">
                            <Input
                                placeholder="e.g. Beach House"
                                value={pantryName}
                                onChange={(e) => setPantryName(e.target.value)}
                            />
                            {createError && (
                                <p className="text-[10px] text-red-500 font-black uppercase tracking-wider px-1">
                                    {createError}
                                </p>
                            )}
                        </div>
                        <Button variant="secondary" fullWidth disabled={isCreating}>
                            {isCreating ? 'Creating...' : 'Create Pantry'}
                        </Button>
                    </form>
                </Card>

                <Card className="p-8 space-y-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Join Shared</h4>
                    <form onSubmit={handleJoin} className="space-y-3">
                        <div className="space-y-1">
                            <Input
                                placeholder="Paste 8-digit code"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                            />
                            {joinError && (
                                <p className="text-[10px] text-red-500 font-black uppercase tracking-wider px-1">
                                    {joinError}
                                </p>
                            )}
                        </div>
                        <Button variant="ghost" fullWidth disabled={isJoining} className="bg-slate-50 border-slate-200">
                            {isJoining ? 'Joining...' : 'Join with Code'}
                        </Button>
                    </form>
                </Card>
            </div>

            {/* Modal: View Members */}
            <Modal
                isOpen={!!viewingMembers}
                onClose={() => setViewingMembers(null)}
                title={viewingMembers ? `Participants: ${viewingMembers.name}` : 'Participants'}
            >
                <div className="space-y-6">
                    {isFetchingMembers ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching Pantry Crew...</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {state.currentMembers.map((member) => {
                                const isMe = member.id === state.user?.id;
                                const isPantryOwner = viewingMembers?.ownerId === state.user?.id;
                                const isThisMemberOwner = member.role === 'Administrator';

                                return (
                                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 transition-all hover:bg-white hover:shadow-sm group/mbr">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-11 h-11 rounded-2xl shadow-inner flex items-center justify-center text-xl border ${isThisMemberOwner ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                                                {isThisMemberOwner ? '👑' : '🧑‍🍳'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-[900] text-slate-800 tracking-tight leading-none">
                                                    {member.name} {isMe && <span className="text-emerald-500 ml-1">(You)</span>}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-1.5">
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${isThisMemberOwner ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                        {member.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {isPantryOwner && !isMe && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={isRemovingMember === member.id}
                                                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors px-2"
                                            >
                                                {isRemovingMember === member.id ? '...' : 'Remove'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <Button variant="secondary" fullWidth onClick={() => setViewingMembers(null)} className="rounded-2xl py-4 font-black uppercase tracking-widest text-[10px]">
                        Close
                    </Button>
                </div>
            </Modal>

            {/* Modal: Confirm Delete */}
            <Modal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                title="Delete Pantry Permanently?"
            >
                <div className="space-y-6">
                    <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-3">
                        <p className="text-red-800 text-sm font-bold leading-relaxed">
                            You are about to delete <span className="font-black underline italic">"{pendingDelete?.name}"</span>.
                            This will remove all items and shared access for everyone. This cannot be undone.
                        </p>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <Button
                            variant="danger"
                            fullWidth
                            onClick={onConfirmDelete}
                            disabled={!!isDeleting}
                            className="py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]"
                        >
                            {isDeleting ? 'Deleting Pantry...' : 'Yes, Delete Everything'}
                        </Button>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setPendingDelete(null)}
                            disabled={!!isDeleting}
                            className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Confirm Leave */}
            <Modal
                isOpen={!!pendingLeave}
                onClose={() => setPendingLeave(null)}
                title="Leave this Pantry?"
            >
                <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                        <p className="text-slate-600 text-sm font-bold leading-relaxed">
                            You will lose access to <span className="font-black underline italic">"{pendingLeave?.name}"</span> and all its items.
                            You'll need a new invite code to come back.
                        </p>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={onConfirmLeave}
                            disabled={!!isDeleting}
                            className="py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] bg-slate-900"
                        >
                            {isDeleting ? 'Leaving Pantry...' : 'Confirm Leave'}
                        </Button>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setPendingLeave(null)}
                            disabled={!!isDeleting}
                            className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                            Stay Here
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
