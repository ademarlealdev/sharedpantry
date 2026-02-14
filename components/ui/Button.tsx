import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  children, 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-black transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-600",
    secondary: "bg-slate-100 text-slate-500 hover:bg-slate-200",
    danger: "text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20",
    ghost: "text-slate-500 hover:bg-slate-50",
    icon: "bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200"
  };

  const sizes = {
    sm: "text-xs py-2 px-3 rounded-xl",
    md: "text-sm py-3 px-5 rounded-2xl",
    lg: "text-base py-4 px-6 rounded-2xl",
    icon: "w-11 h-11 rounded-2xl p-0"
  };

  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && loadingSpinner}
      {children}
    </button>
  );
};
