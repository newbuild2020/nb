"use client";
import React from "react";

interface OutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const OutlineButton: React.FC<OutlineButtonProps> = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`px-6 py-2 rounded border font-medium transition-colors
        border-black text-black hover:bg-black/5
        dark:border-white dark:text-white dark:hover:bg-white/10
        focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default OutlineButton; 