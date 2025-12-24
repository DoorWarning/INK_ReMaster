import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoHomeOutline, IoInformationCircleOutline, IoMegaphoneOutline, IoColorPaletteOutline, IoTrophyOutline, IoImageOutline, IoWalletOutline, IoLogoDiscord, IoChatbubble, IoSettingsOutline } from 'react-icons/io5';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

const Sidebar = ({ isOpen, onClose, onCategoryChange, isAuthenticated, handleLogout, onLogin }) => {
  const { user } = useAuthStore();
  
  // 🔥 상태 관리: 두 링크 모두 state로 관리
  const [kakaoLink, setKakaoLink] = useState('');
  const [discordLink, setDiscordLink] = useState('');

  // 🔥 데이터 로드: 메뉴 열릴 때 두 링크 모두 가져오기
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.get('/config/kakao'),
        api.get('/config/discord')
      ]).then(([kakaoRes, discordRes]) => {
        setKakaoLink(kakaoRes.data.link);
        setDiscordLink(discordRes.data.link);
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  // 1. 카카오 링크 수정
  const handleEditKakao = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const newLink = prompt("새 카카오톡 오픈채팅 링크 입력:", kakaoLink);
    if (newLink === null) return;

    try {
      const res = await api.post('/config/kakao', { userId: user._id, link: newLink });
      setKakaoLink(res.data.link);
      alert("카카오톡 링크 수정 완료!");
    } catch (err) { alert("권한이 없거나 오류 발생"); }
  };

  // 2. 🔥 디스코드 링크 수정 (추가됨)
  const handleEditDiscord = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const newLink = prompt("새 디스코드 초대 링크 입력:", discordLink);
    if (newLink === null) return;

    try {
      const res = await api.post('/config/discord', { userId: user._id, link: newLink });
      setDiscordLink(res.data.link);
      alert("디스코드 링크 수정 완료!");
    } catch (err) { alert("권한이 없거나 오류 발생"); }
  };

  const menuItems = [
    { id: 'home', label: '홈 (전체보기)', icon: <IoHomeOutline /> },
    { id: 'intro', label: 'INK 소개', icon: <IoInformationCircleOutline /> },
    { id: 'notice', label: '공지사항', icon: <IoMegaphoneOutline /> },
    { id: 'art', label: 'ART', icon: <IoColorPaletteOutline /> },
    { id: 'contest', label: '공모전', icon: <IoTrophyOutline /> },
    { id: 'photo', label: '행사 사진', icon: <IoImageOutline /> },
    { id: 'ledger', label: '회계 장부', icon: <IoWalletOutline /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 cursor-pointer"
          />
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-64 bg-white z-[60] border-r-4 border-ink shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b-2 border-ink flex justify-between items-center bg-gray-50">
              <span className="font-display text-xl text-ink">MENU</span>
              <button onClick={onClose}><IoClose size={28} /></button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onCategoryChange(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 font-bold text-lg rounded-sm transition-all text-gray-600 hover:bg-gray-100 hover:text-ink"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t-2 border-ink bg-gray-50 space-y-2">
              
              {/* 카카오톡 버튼 */}
              {isAuthenticated && (
                <div className="relative group">
                  <a 
                    href={kakaoLink || '#'} 
                    target="_blank" rel="noopener noreferrer"
                    onClick={(e) => !kakaoLink && e.preventDefault()}
                    className={`w-full flex items-center justify-center gap-2 py-3 bg-[#FAE100] text-[#371D1E] font-bold border-2 border-ink shadow-sm hover:bg-[#FCE620] transition-colors rounded-sm ${!kakaoLink ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <IoChatbubble size={20} />
                    KAKAO TALK
                  </a>
                  {user?.role === 'admin' && (
                    <button onClick={handleEditKakao} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-ink rounded-full text-gray-500 hover:text-ink hover:bg-gray-100 shadow-sm" title="링크 수정">
                      <IoSettingsOutline size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* 🔥 디스코드 버튼 (동일한 로직 적용) */}
              {isAuthenticated && (
                <div className="relative group">
                  <a 
                    href={discordLink || '#'} 
                    target="_blank" rel="noopener noreferrer"
                    onClick={(e) => !discordLink && e.preventDefault()}
                    className={`w-full flex items-center justify-center gap-2 py-3 bg-[#5865F2] text-white font-bold border-2 border-ink shadow-sm hover:bg-[#4752C4] transition-colors rounded-sm ${!discordLink ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <IoLogoDiscord size={20} />
                    INK DISCORD
                  </a>
                  {user?.role === 'admin' && (
                    <button onClick={handleEditDiscord} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-ink rounded-full text-gray-500 hover:text-ink hover:bg-gray-100 shadow-sm" title="링크 수정">
                      <IoSettingsOutline size={16} />
                    </button>
                  )}
                </div>
              )}

              {isAuthenticated ? (
                <button onClick={handleLogout} className="w-full py-2 border-2 border-gray-300 font-bold text-gray-500 hover:border-red-500 hover:text-red-500 hover:bg-white transition bg-white mt-2">
                  로그아웃
                </button>
              ) : (
                <button onClick={onLogin} className="w-full py-2 bg-ink text-white font-bold border-2 border-ink hover:bg-gray-800 transition">
                  로그인 하러가기
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;