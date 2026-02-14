import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    interactive = false
}) => {
    return (
        <div
            className={`bg-white p-5 rounded-3xl border border-slate-100 ${interactive
                    ? 'cursor-pointer hover:shadow-md transition-all active:scale-[0.98]'
                    : ''
                } ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
