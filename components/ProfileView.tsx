import React from 'react';
import { AppState } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { PantryManager } from './PantryManager';

interface ProfileViewProps {
    user: NonNullable<AppState['user']>;
    pantries: AppState['pantries'];
    activePantryId: AppState['activePantryId'];
    onLogout: () => void;
    onDeleteAccount: () => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
    user,
    pantries,
    activePantryId,
    onLogout,
    onDeleteAccount
}) => {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isConfirming, setIsConfirming] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await onDeleteAccount();
        } catch (err: any) {
            setError(err.message || "Failed to delete account");
            setIsDeleting(false);
            setIsConfirming(false);
        }
    };
    const activePantry = pantries.find(p => p.id === activePantryId);
    const displayedRole = activePantry?.userRole || user.role;
    const isOwner = displayedRole === 'Administrator';

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/30 animate-in slide-in-from-bottom-4 duration-300 pb-20">
            <div className="w-full px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">

                {/* Profile Card */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Identity</h3>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={onLogout}
                            className="text-[9px] uppercase tracking-widest px-3 py-1.5"
                        >
                            Logout
                        </Button>
                    </div>
                    <div className="bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between gap-3 flex-nowrap">
                            <div className="flex items-center space-x-3 sm:space-x-6 min-w-0 flex-1">
                                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-3xl sm:text-4xl shadow-inner border-2 shrink-0 ${isOwner ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                    {isOwner ? '👑' : '🧑‍🍳'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight truncate">{user.name}</h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className={`px-2.5 py-1 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm ${isOwner ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                            {displayedRole}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold italic">
                                            {isOwner ? 'Primary Owner' : 'Pantry Member'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setIsConfirming(true)}
                                className="text-[9px] uppercase tracking-[0.15em] px-3 py-2 rounded-xl opacity-40 hover:opacity-100 transition-opacity shrink-0 flex items-center justify-center"
                            >
                                <span className="hidden sm:inline">Delete Account</span>
                                <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </Button>
                        </div>
                    </div>

                    <Modal
                        isOpen={isConfirming}
                        onClose={() => !isDeleting && setIsConfirming(false)}
                        title="Delete Account?"
                    >
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                                ⚠️
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Are you absolutely sure?</h3>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                    This action cannot be undone. You will lose access to all your pantries and shared lists.
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                                    {error}
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsConfirming(false)}
                                    className="flex-1 py-4 rounded-2xl"
                                    disabled={isDeleting}
                                >
                                    No, Keep it
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDelete}
                                    className="flex-1 py-4 rounded-2xl"
                                    isLoading={isDeleting}
                                >
                                    Yes, Delete
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </section>

                {/* Pantry Management */}
                <section className="space-y-4">
                    <PantryManager />
                </section>
            </div>
        </div>
    );
};
