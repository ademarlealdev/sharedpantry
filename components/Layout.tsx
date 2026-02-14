
import React from 'react';

export const MobileContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center">
      {/* 
          The main container now fills the screen on all devices.
          We use internal wrappers to maintain readability on large screens.
      */}
      <div className="w-full h-[100dvh] relative flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};
