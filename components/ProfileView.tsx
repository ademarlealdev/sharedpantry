import React from 'react';
import { AppState } from '../types';
import { Button } from './ui/Button';
import { PantryManager } from './PantryManager';

interface ProfileViewProps {
    user: NonNullable<AppState['user']>;
    onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
    user,
    onLogout
}) => {
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/30 animate-in slide-in-from-bottom-4 duration-300 pb-20">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

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
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-6">
                        <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border-2 border-emerald-100">
                            👑
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user.name}</h2>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                                    {user.role}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold italic">Primary Owner</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pantry Management */}
                <section className="space-y-4">
                    <div className="px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage Shared Spaces</h3>
                    </div>
                    <PantryManager />
                </section>
            </div>
        </div>
    );
};
