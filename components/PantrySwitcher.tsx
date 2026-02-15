
import React, { useState, useRef, useEffect } from 'react';
import { useSyncStore } from '../store/useSyncStore';

export const PantrySwitcher: React.FC = () => {
    const { state, switchPantry } = useSyncStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activePantry = state.pantries.find(p => p.id === state.activePantryId);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitch = (id: string) => {
        switchPantry(id);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex flex-col items-start transition-all active:scale-95 text-left"
            >
                <div className="flex items-center space-x-1">
                    <h1 className="text-xl font-[900] text-slate-900 tracking-tighter leading-none group-hover:text-[#4C6B51] transition-colors">
                        {activePantry?.name || 'My Pantry'}
                    </h1>
                    <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                <p className="text-[9px] text-[#4C6B51] font-black uppercase tracking-[0.2em] mt-1">
                    Tap to switch pantries
                </p>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-4 w-72 origin-top-left bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-2 mb-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Pantry</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto px-2 space-y-1">
                        {state.pantries.map((pantry) => (
                            <button
                                key={pantry.id}
                                onClick={() => handleSwitch(pantry.id)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${state.activePantryId === pantry.id
                                    ? 'bg-[#F8F5EE] text-[#4C6B51]'
                                    : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">{state.activePantryId === pantry.id ? '📍' : '🏠'}</span>
                                    <span className="font-bold text-sm tracking-tight">{pantry.name}</span>
                                </div>
                                {state.activePantryId === pantry.id && (
                                    <div className="w-2 h-2 rounded-full bg-[#4C6B51] shadow-sm animate-pulse"></div>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-slate-50 mt-2 pt-2 px-2">
                        <button
                            disabled
                            className="w-full text-left px-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest"
                        >
                            + Manage in Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
