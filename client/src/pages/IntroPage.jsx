import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMenu, IoClose, IoHomeOutline, IoInformationCircleOutline, IoMegaphoneOutline, IoColorPaletteOutline, IoTrophyOutline, IoImageOutline } from 'react-icons/io5';
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';
import inkLogo from '../assets/ink.svg';

const IntroPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 로그아웃 핸들러
  const handleLogout = () => {
    showConfirm("로그아웃 하시겠습니까?", () => {
      logout();
      showAlert("로그아웃 되었습니다.");
      setIsMenuOpen(false);
      navigate('/');
    });
  };

  // 카테고리 이동 핸들러
  const handleCategoryChange = (id) => {
    setIsMenuOpen(false);
    
    if (id === 'intro') return; // 이미 여기임

    if (id === 'home') {
      navigate('/');
    } else {
      // 다른 카테고리는 메인 페이지의 쿼리 스트링으로 이동
      navigate(`/?category=${id}`);
    }
  };

  const menuItems = [
    { id: 'home', label: '홈 (전체보기)', icon: <IoHomeOutline /> },
    { id: 'intro', label: 'INK 소개', icon: <IoInformationCircleOutline /> },
    { id: 'notice', label: '공지사항', icon: <IoMegaphoneOutline /> },
    { id: 'art', label: 'ART', icon: <IoColorPaletteOutline /> },
    { id: 'contest', label: '공모전', icon: <IoTrophyOutline /> },
    { id: 'photo', label: '행사 사진', icon: <IoImageOutline /> },
  ];

  return (
    <div className="min-h-screen bg-paper font-sans relative">
      
      {/* 🔥 [헤더] 메인 페이지와 동일하게 통일 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-ink px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(true)} className="p-1 hover:bg-gray-100 rounded">
            <IoMenu size={32} className="text-ink" />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img src={inkLogo} alt="INK" className="w-8 h-8 transition-transform group-hover:rotate-12" />
            <h1 className="text-2xl font-display text-ink tracking-tight">INK</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/mypage')} className="hidden sm:block font-bold text-ink hover:underline text-sm">
                {user?.name}님
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

      {/* 🔥 [사이드바] 추가됨 */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 cursor-pointer"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-64 bg-white z-[60] border-r-4 border-ink shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b-2 border-ink flex justify-between items-center bg-gray-50">
                <span className="font-display text-xl text-ink">MENU</span>
                <button onClick={() => setIsMenuOpen(false)}><IoClose size={28} /></button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCategoryChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 font-bold text-lg rounded-sm transition-all
                      ${item.id === 'intro' 
                        ? 'bg-ink text-white shadow-md translate-x-1' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-ink'
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="p-4 border-t-2 border-ink">
                {isAuthenticated ? (
                  <button onClick={handleLogout} className="w-full py-2 border-2 border-gray-300 font-bold text-gray-500 hover:border-red-500 hover:text-red-500 transition">
                    로그아웃
                  </button>
                ) : (
                  <button onClick={() => navigate('/login')} className="w-full py-2 bg-ink text-white font-bold border-2 border-ink">
                    로그인 하러가기
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 본문 컨텐츠 (기존 내용 동일) */}
      <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in-up">
        
        {/* 중앙 로고 */}
        <div className="flex justify-center mb-10">
          <img 
            src={inkLogo} 
            alt="INK Logo" 
            className="w-40 h-40 md:w-56 md:h-56 drop-shadow-md hover:scale-105 transition-transform duration-700" 
          />
        </div>

        {/* 소개글 */}
        <div className="text-center space-y-8 mb-20 text-ink leading-loose font-medium text-lg md:text-xl break-keep">
          <p>
            <span className="font-display text-2xl">잉크</span>는<br/>
            경기도 수원시 영통구 원천동에 위치한 아주대학교의<br/>
            <span className="font-bold bg-yellow-100 px-1">소프트웨어융합대학 미디어학부 만화 창작 소학회</span> 입니다.
          </p>
          
          <div className="w-10 h-1 bg-ink mx-auto opacity-20"></div>

          <p>
            만화의 기본도구인 잉크처럼<br/>
            <span className="font-bold">중요하고 필요한 모임</span>이 되자는 뜻으로<br/>
            <span className="font-display text-2xl">잉크(INK)</span>로 이름을 정했습니다.
          </p>

          <div className="w-10 h-1 bg-ink mx-auto opacity-20"></div>

          <p>
            잉크는<br/>
            만화를 다함께 즐기고 배우는 소학회입니다.
          </p>

          <p className="text-base text-gray-600">
            2000년 10월 24일 부터<br/>
            매주마다 정기모임을 가지며<br/>
            한해에 한번 이상 전시회, 회지 발행,<br/>
            또한 여러 만화 관련 행사에 참여하고 있습니다.
          </p>
        </div>

        {/* 회칙 */}
        <div className="bg-white border-4 border-ink p-6 md:p-10 shadow-[8px_8px_0px_0px_var(--color-ink)] relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute top-0 left-0 w-full h-4 bg-yellow-400 border-b-2 border-ink"></div>

          <h3 className="text-3xl font-display text-center mb-10 mt-4 border-b-2 border-dashed border-gray-300 pb-6">■ 회칙 ■</h3>
          
          <div className="space-y-10 text-gray-800 leading-relaxed">
            {/* 제1조 */}
            <section>
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="bg-ink text-white text-sm px-2 py-1 rounded-sm">제1조</span>
                잉크의 목적과 성격
              </h4>
              <p className="pl-2 border-l-4 border-gray-200 ml-1">
                잉크는 다같이 만화를 즐기는 모임이다.
              </p>
            </section>

            {/* 제2조 */}
            <section>
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="bg-ink text-white text-sm px-2 py-1 rounded-sm">제2조</span>
                잉크의 구성
              </h4>
              <div className="space-y-4 pl-1">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm text-sm">
                  <strong className="block mb-2 text-base">👮‍♂️ 임원의 구성 및 선출</strong>
                  <ul className="list-disc list-inside space-y-1">
                    <li>임원은 <strong>회장, 부회장, 총무</strong>로 이루어진다.</li>
                    <li>선출 시기는 2학기 종강 총회 이후 방학 기간이다.</li>
                    <li>임원 선출 시 출석을 반영하여 자발적인 참여를 권장한다.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <strong className="block text-lg">💡 임원의 역할</strong>
                  <ul className="list-none space-y-3 pl-2">
                    <li>
                      <span className="font-bold text-ink mr-2">[회장]</span>
                      ① 연간 주요 활동 계획 ② 대내외 홍보 총괄 ③ 연말 활동 내역 정리 및 발표
                    </li>
                    <li>
                      <span className="font-bold text-ink mr-2">[부회장]</span>
                      ① 회장 보조 및 온라인 커뮤니티 관리 ② 강의실 대여 ③ 회장 부재 시 대행 (비대면 시 일부 생략)
                    </li>
                    <li>
                      <span className="font-bold text-ink mr-2">[총무]</span>
                      ① 자산 총괄 ② 내역 공개 (회원 전체에게 공개 의무)
                    </li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-2">
                    ※ 중요 사항 결정 시 회장, 부회장, 총무의 허락이 모두 있어야 진행 가능하다.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="border p-3 rounded-sm">
                    <strong className="block mb-1">🤝 임원 인수인계</strong>
                    <p className="text-sm">기존 임원진은 신규 임원진과 함께 연간 활동 내역을 정리하여 회지를 제작하고, 홈페이지 관리 방법을 인계한다.</p>
                  </div>
                  <div className="border p-3 rounded-sm">
                    <strong className="block mb-1">🎓 회원 자격</strong>
                    <p className="text-sm">미디어학부 학생 중 만화에 관심 있는 자. (기존 회원의 협의 하에 타 학부 예외 인정)</p>
                  </div>
                </div>

                <div className="mt-2 text-sm text-red-600">
                  <strong>⚠ 회원 탈퇴:</strong> 임원에게 알리지 않고 6개월 이상 활동하지 않는 경우, 통보 후 탈퇴시킬 수 있다.
                </div>
                
                <div className="mt-2 text-sm">
                  <strong>📌 부칙:</strong> 임원 결원이나 중요사항 결정 시 3명 이상의 회원이 결정 권한을 가진다.
                </div>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="bg-ink text-white text-sm px-2 py-1 rounded-sm">제3조</span>
                기본적인 운영방침
              </h4>
              <ul className="list-disc list-inside bg-yellow-50 p-4 border border-yellow-200 text-ink font-medium">
                <li>1년에 한 번 이상 <strong>전시회</strong>를 갖는다. 🖼️</li>
                <li>1년에 한 번 이상 <strong>회지</strong>를 발간한다. 📚</li>
              </ul>
            </section>

            {/* 제4조 */}
            <section>
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="bg-ink text-white text-sm px-2 py-1 rounded-sm">제4조</span>
                홈페이지 회원 등급
              </h4>
              <div className="flex flex-col md:flex-row gap-4 text-center">
                <div className="flex-1 border-2 border-gray-200 p-4 rounded-sm">
                  <div className="text-gray-500 font-bold mb-1">준회원</div>
                  <div className="text-sm">오프라인 회원이 아니고<br/>홈페이지 가입만 한 경우</div>
                </div>
                <div className="flex-1 border-2 border-ink bg-ink text-white p-4 rounded-sm shadow-md">
                  <div className="font-bold mb-1 text-lg">정회원</div>
                  <div className="text-sm opacity-90">오프라인 회원이며<br/>홈페이지에 가입한 경우</div>
                </div>
                <div className="flex-1 border-2 border-yellow-400 bg-yellow-50 p-4 rounded-sm">
                  <div className="text-yellow-700 font-bold mb-1">관리자</div>
                  <div className="text-sm">회장, 부회장, 총무, 서기로<br/>구성된 운영진</div>
                </div>
              </div>
            </section>
          </div>
          
          <div className="mt-16 text-right font-display text-gray-400 text-xl">
            아주대학교 만화 창작 소학회 INK
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;