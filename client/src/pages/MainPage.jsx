import React, { useState, useEffect } from 'react';
import api from '../api/axios'
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IoAdd, IoMegaphoneOutline, IoTrophyOutline, IoChevronForward } from 'react-icons/io5';

// Stores
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';

// Components
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LedgerSection from '../components/LedgerSection';
import CalendarSection from '../components/CalendarSection';

// Modals
import PostModal from '../components/PostModal';
import NoticeModal from '../components/NoticeModal';

// 🔥 [수정 1] 컴포넌트 밖으로 추출 (props로 onClick 받음)
const NoticeCard = ({ notice, onClick }) => (
  <div 
    onClick={() => onClick(notice)}
    className="bg-white p-4 border-l-4 border-ink shadow-sm hover:bg-yellow-50 cursor-pointer transition-colors flex justify-between items-center"
  >
    <span className="font-bold text-ink truncate flex-1">{notice.title}</span>
    <span className="text-xs text-gray-500 font-bold ml-4 whitespace-nowrap">{new Date(notice.createdAt).toLocaleDateString()}</span>
  </div>
);

// 🔥 [수정 2] 컴포넌트 밖으로 추출 (props로 onClick 받음)
const GalleryCard = ({ post, onClick }) => (
  <motion.div
    layoutId={post._id}
    onClick={() => onClick(post)}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="break-inside-avoid mb-6 cursor-pointer group"
  >
    <div className="relative">
      {post.images.length > 1 && (
        <div className="absolute inset-0 bg-gray-200 border-2 border-ink translate-x-2 translate-y-2 rounded-sm -z-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
      )}
      <div className="bg-white border-2 border-ink p-2 shadow-sm hover:shadow-md transition-shadow rounded-sm relative z-10">
        <div className="overflow-hidden border border-gray-100">
          <img src={post.images[0]?.url} alt={post.title} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      </div>
    </div>
    <div className="mt-3 px-1">
      <h3 className="font-bold text-lg text-ink leading-tight truncate">{post.title}</h3>
      <div className="flex justify-between items-center mt-1">
        <p className="text-sm text-gray-500">by {post.author?.name}</p>
        <div className="flex gap-2 text-xs text-gray-400 font-bold"><span>♥ {post.likes.length}</span></div>
      </div>
    </div>
  </motion.div>
);

const MainPage = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- 상태 관리 ---
  const [category, setCategory] = useState(searchParams.get('category') || 'home');
  const [posts, setPosts] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- URL 감지 및 데이터 로드 ---
  useEffect(() => {
    const currentCategory = searchParams.get('category') || 'home';
    setCategory(currentCategory);
  }, [searchParams]);

  useEffect(() => {
    if (category === 'intro' || category === 'contest' || category === 'ledger') return;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        if (category === 'home') {
          const [noticeRes, artRes] = await Promise.all([
            api.get('/posts?category=notice'),
            api.get('/posts?category=art')
          ]);
          setRecentNotices(noticeRes.data.slice(0, 3));
          setPosts(artRes.data);
        } else {
          const res = await api.get(`http://localhost:4000/api/posts?category=${category}`);
          setPosts(res.data);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [category]);

  // --- 핸들러들 ---
  const handleLogout = () => {
    showConfirm("로그아웃 하시겠습니까?", () => {
      logout();
      showAlert("로그아웃 되었습니다.");
      setIsMenuOpen(false);
      navigate('/');
    });
  };

  const handleWriteClick = () => {
    if (!isAuthenticated) {
      showAlert("로그인이 필요합니다!");
      navigate('/login');
      return;
    }
    if (category === 'notice') {
      if (user.role !== 'admin') return showAlert("공지사항은 임원진만 작성할 수 있습니다.");
      navigate('/write?category=notice');
    } else if (category === 'photo') {
      navigate('/write?category=photo');
    } else {
      navigate('/write?category=art');
    }
  };

  const handleCategoryChange = (id) => {
    if (id === 'intro') {
      navigate('/intro');
    } else {
      navigate(`/?category=${id}`);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-paper font-sans relative">
      
      {/* 1. 헤더 */}
      <Header 
        onMenuClick={() => setIsMenuOpen(true)} 
        onLogoClick={() => navigate('/?category=home')}
        user={user}
        isAuthenticated={isAuthenticated}
        navigate={navigate}
      />

      {/* 2. 사이드바 */}
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onCategoryChange={handleCategoryChange}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
        onLogin={() => navigate('/login')}
      />

      {/* 3. 메인 컨텐츠 */}
      <main className="p-4 max-w-7xl mx-auto min-h-[80vh]">

        {/* 3-A. 공지사항 */}
        {category === 'home' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4 border-b-2 border-ink pb-2">
              <div className="flex items-center gap-2">
                <IoMegaphoneOutline size={24} className="text-ink" />
                <h2 className="text-xl font-display text-ink">Latest News</h2>
              </div>
              <button onClick={() => navigate('/?category=notice')} className="text-xs font-bold text-gray-500 hover:text-ink flex items-center">
                더보기 <IoChevronForward />
              </button>
            </div>
            <div className="grid gap-3">
              {recentNotices.length === 0 ? (
                <div className="p-4 bg-white border text-center text-gray-400">등록된 공지사항이 없습니다.</div>
              ) : (
                recentNotices.map(n => (
                  // 🔥 [수정 3] props로 setSelectedPost 전달
                  <NoticeCard key={n._id} notice={n} onClick={setSelectedPost} />
                ))
              )}
            </div>
          </div>
        )}

        {category === 'notice' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-display text-ink">📢 공지사항</h2>
              {user?.role === 'admin' && (
                <button onClick={handleWriteClick} className="flex items-center gap-1 text-sm font-bold bg-ink text-white px-3 py-1.5 hover:bg-gray-800"><IoAdd /> 글쓰기</button>
              )}
            </div>
            <div className="bg-white border-2 border-ink">
              {posts.map(post => (
                 <div key={post._id} onClick={() => setSelectedPost(post)} className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-yellow-50 cursor-pointer last:border-0">
                  <div className="flex-1 min-w-0 pr-4"><h3 className="font-bold text-lg truncate">{post.title}</h3><p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()} | {post.author?.name}</p></div>
                  <div className="text-sm font-bold text-gray-400">Read &gt;</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3-B. 갤러리 (Art / Photo) */}
        {(category === 'home' || category === 'art' || category === 'photo') && (
          <>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-display text-ink">{category === 'photo' ? '📷 Event Photos' : '🎨 Artworks'}</h2>
              <button onClick={handleWriteClick} className="px-4 py-2 bg-ink text-white border-2 border-ink font-bold text-sm hover:bg-gray-800 transition-transform active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                {category === 'photo' ? '사진 올리기' : '작품 올리기'}
              </button>
            </div>
            {isLoading ? <div className="text-center py-20 font-bold text-gray-400">로딩 중...</div> : posts.length === 0 ? <div className="text-center py-10 mb-10 text-gray-400">등록된 게시물이 없습니다.</div> : (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 mb-20">
                {posts.map(post => (
                  // 🔥 [수정 4] props로 setSelectedPost 전달
                  <GalleryCard key={post._id} post={post} onClick={setSelectedPost} />
                ))}
              </div>
            )}
            
            {category === 'home' && (
              <>
                <div className="mb-20">
                  <div className="flex items-center gap-2 mb-6 border-b-2 border-ink pb-2"><IoTrophyOutline size={28} className="text-ink" /><h2 className="text-2xl font-display text-ink">Current Contest</h2></div>
                  <div className="bg-white border-2 border-dashed border-ink p-10 text-center rounded-sm"><IoTrophyOutline size={60} className="text-yellow-400 mx-auto mb-4" /><h3 className="text-xl font-bold text-ink mb-2">🏆 제 1회 INK 창작 공모전</h3><p className="text-gray-500">주제: 겨울의 시작</p></div>
                </div>
                <CalendarSection />
              </>
            )}
          </>
        )}

        {/* 3-C. 공모전 / 회계 장부 */}
        {category === 'contest' && <div className="flex flex-col items-center justify-center py-20 text-center"><IoTrophyOutline size={80} className="text-yellow-400 mb-4" /><h2 className="text-3xl font-display text-ink mb-2">공모전 준비 중</h2></div>}
        
        {category === 'ledger' && <LedgerSection />}

      </main>

      {/* 4. 모달들 */}
      {selectedPost && (
        <>
          {selectedPost.category === 'notice' ? (
            <NoticeModal 
              post={selectedPost} onClose={() => setSelectedPost(null)} 
              onUpdate={() => {
                if (category === 'home') api.get('/posts?category=notice').then(res => setRecentNotices(res.data.slice(0,3)));
                else if (category === 'notice') api.get('/posts?category=notice').then(res => setPosts(res.data));
              }} 
            />
          ) : (
            <PostModal 
              post={selectedPost} onClose={() => setSelectedPost(null)} 
              onUpdate={() => {
                const target = category === 'home' ? 'art' : category;
                api.get(`http://localhost:4000/api/posts?category=${target}`).then(res => setPosts(res.data));
              }} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default MainPage;