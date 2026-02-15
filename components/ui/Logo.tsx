
import React from 'react';

export const PantryLogo: React.FC<{ className?: string }> = ({ className = "w-11 h-11" }) => (
    <div className={`${className} flex-shrink-0 flex items-center justify-center bg-[#FDFBF7] rounded-3xl shadow-sm border border-[#E9E4D9] p-[15%]`}>
        <svg className="w-full h-full" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* House Outline */}
            <path d="M6 16L22 6L38 16V34C38 36.2091 36.2091 38 34 38H10C7.79086 38 6 36.2091 6 34V16Z" stroke="#8B5E3C" strokeWidth="2.5" strokeLinejoin="round" fill="white" />

            {/* Tall Bottle Shape (Left) */}
            <path d="M9 25.5C9 23.5 10.5 22 12 22H14C15.5 22 17 23.5 17 25.5V34H9V25.5Z" fill="#D4A373" stroke="#8B5E3C" strokeWidth="1.5" />
            <rect x="11.5" y="20" width="3" height="2" fill="#D4A373" stroke="#8B5E3C" strokeWidth="1.5" />

            {/* Top Jar (Middle) */}
            <rect x="19" y="14" width="8" height="10" rx="2" fill="#95A54A" stroke="#8B5E3C" strokeWidth="1.5" />
            <rect x="20" y="12" width="6" height="2" fill="#8B5E3C" />

            {/* Bottom Small Jar with tag (Middle) */}
            <rect x="18" y="27" width="9" height="7" rx="1.5" fill="#7A8B42" stroke="#8B5E3C" strokeWidth="1.5" />
            <rect x="21.5" y="28" width="2" height="4" fill="#8B5E3C" opacity="0.3" />

            {/* Box (Right) */}
            <path d="M29 24H35V34H29V24Z" fill="#A37D55" stroke="#8B5E3C" strokeWidth="1.5" />
            <path d="M29 24L32 21L35 24" stroke="#8B5E3C" strokeWidth="1.5" strokeLinejoin="round" />

            {/* Detail Bubbles */}
            <circle cx="14" cy="13" r="1" stroke="#8B5E3C" strokeWidth="1" />
            <circle cx="31" cy="16" r="1.2" stroke="#8B5E3C" strokeWidth="1" />
        </svg>
    </div>
);
