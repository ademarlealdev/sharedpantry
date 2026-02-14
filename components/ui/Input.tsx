import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
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
            <input
                ref={ref}
                className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-lg font-black text-slate-800 focus:ring-4 outline-none transition-all placeholder:text-slate-300 ${error
                        ? 'border-red-100 focus:ring-red-500/10'
                        : 'border-transparent focus:ring-emerald-500/10'
                    } ${className}`}
                {...props}
            />
            {error && (
                <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter animate-in fade-in slide-in-from-right-2 block ml-1">
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
