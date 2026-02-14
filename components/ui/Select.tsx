import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    label,
    error,
    options,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    className={`w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-base font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none transition-all ${className}`}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && (
                <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter animate-in fade-in slide-in-from-right-2 block ml-1">
                    {error}
                </span>
            )}
        </div>
    );
});

Select.displayName = 'Select';
