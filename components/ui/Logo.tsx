
import React from 'react';

export const PantryLogo: React.FC<{ className?: string }> = ({ className = "w-11 h-11" }) => (
    <div className={`${className} flex-shrink-0 flex items-center justify-center bg-[#F8F5EE] rounded-2xl shadow-inner border border-[#E9E4D9]`}>
        <svg width="30" height="30" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shelf Outer */}
            <rect x="4" y="10" width="36" height="24" rx="4" stroke="#4C6B51" strokeWidth="2.5" fill="white" />
            {/* Middle Line */}
            <line x1="4" y1="22" x2="40" y2="22" stroke="#4C6B51" strokeWidth="2.5" />
            {/* Top items */}
            <ellipse cx="11" cy="17" rx="3" ry="4" fill="#D4A373" stroke="#4C6B51" strokeWidth="1.5" />
            <rect x="19" y="14" width="6" height="7" rx="1" fill="#E9EDC9" stroke="#4C6B51" strokeWidth="1.5" />
            <path d="M29 14L34 18V21H29V14Z" fill="#FAEDCD" stroke="#4C6B51" strokeWidth="1.5" />
            {/* Bottom items */}
            <rect x="11" y="26" width="5" height="7" rx="1" fill="#FEFAE0" stroke="#4C6B51" strokeWidth="1.5" />
            <circle cx="22" cy="29" r="4" fill="#CCD5AE" stroke="#4C6B51" strokeWidth="1.5" />
            <rect x="31" y="25" width="7" height="8" rx="1" fill="#E76F51" stroke="#4C6B51" strokeWidth="1.5" />
        </svg>
    </div>
);
