import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
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
            <textarea
                ref={ref}
                className={`w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 outline-none resize-none transition-all placeholder:text-slate-300 ${className}`}
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

Textarea.displayName = 'Textarea';
