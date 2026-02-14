import React from 'react';
import { AppState } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ProfileViewProps {
    user: NonNullable<AppState['user']>;
    group: AppState['group'];
    onLogout: () => void;
    onInvite?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
    user,
    group,
    onLogout,
    onInvite
}) => {
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/30 animate-in slide-in-from-bottom-4 duration-300">
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

                {/* Members List */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared With</h3>
                        <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-md font-black text-slate-500">
                            {group?.members.length} MEMBERS
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group?.members.map((member) => (
                            <Card key={member.id} className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                    {member.role === 'Administrator' ? '👑' : '👤'}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-800">{member.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{member.role}</p>
                                </div>
                                {member.role !== 'Administrator' && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                )}
                            </Card>
                        ))}

                        <button
                            onClick={onInvite}
                            className="bg-emerald-50 border-2 border-emerald-100 border-dashed p-5 rounded-3xl flex items-center justify-center space-x-3 text-emerald-600 hover:bg-emerald-100/50 transition-all group"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-xs font-black uppercase tracking-widest">Invite Member</span>
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
};
