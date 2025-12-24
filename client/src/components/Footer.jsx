// client/src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t-2 border-ink py-8 mt-auto z-10 relative">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-display text-ink text-lg tracking-wider mb-2">
          INK
        </p>
        <p className="text-xs text-gray-500 font-bold mb-1">
          Ajou University, Department of Digital Media, Cartoon Club
        </p>
        <p className="text-[10px] text-gray-400">
          COPYRIGHT © 2000-2025 INK. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
};

export default Footer;