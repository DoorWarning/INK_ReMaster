import React from 'react';
import { IoMenu } from 'react-icons/io5';
import inkLogo from '../assets/ink.svg';

const Header = ({ onMenuClick, onLogoClick, user, isAuthenticated, navigate }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-ink px-4 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-1 hover:bg-gray-100 rounded">
          <IoMenu size={32} className="text-ink" />
        </button>
        
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onLogoClick}>
          <img src={inkLogo} alt="INK" className="w-8 h-8 transition-transform group-hover:rotate-12" />
          <h1 className="text-2xl font-display text-ink tracking-tight">INK</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* 🔥 [수정] hidden sm:block 제거 (모바일에서도 보임) + 기수(generation) 표시 */}
            <button 
              onClick={() => navigate('/mypage')} 
              className="font-bold text-ink hover:underline text-sm flex items-center gap-1"
            >
              <span>{user?.name}</span>
              {/* 기수 정보가 있으면 (N기) 형태로 표시 */}
              {user?.generation && (
                <span className="text-xs text-gray-500 font-normal">
                  ({user.generation}기)
                </span>
              )}
            </button>

            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="px-2 py-1 bg-yellow-400 border-2 border-ink font-bold text-xs shadow-sm">ADMIN</button>
            )}
          </>
        ) : (
          <button onClick={() => navigate('/login')} className="font-bold text-sm border-2 border-ink px-3 py-1 bg-white hover:bg-gray-50">로그인</button>
        )}
      </div>
    </header>
  );
};

export default Header;