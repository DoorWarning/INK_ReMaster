import React, { useState, useEffect } from 'react';
import api from '../api/axios'
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';
import { IoCheckmarkCircle, IoCloseCircle, IoTrashOutline, IoArrowBack } from 'react-icons/io5'; // 👈 IoArrowBack 추가

const AdminPage = () => {
  const { user } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  // 관리자 권한 체크
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showAlert("임원진만 접근할 수 있는 페이지입니다! 👮‍♂️");
      navigate('/');
    }
  }, [user, navigate, showAlert]);

  // 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        showAlert("목록을 불러오지 못했습니다.");
      }
    };
    if (user?.role === 'admin') fetchUsers();
  }, [user, showAlert]);

  // 역할 변경
  const handleRoleChange = (targetUser, newRole) => {
    const executeChange = async () => {
      try {
        await api.put(`/users/${targetUser._id}`, { role: newRole });
        setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, role: newRole } : u));
        showAlert("권한이 변경되었습니다.");
      } catch (err) { showAlert("변경 실패"); }
    };

    if (targetUser._id === user._id && newRole !== 'admin') {
      showConfirm("정말 본인의 관리자 권한을 해제하시겠습니까?", executeChange);
    } else {
      executeChange();
    }
  };

  // 회비 납부 토글
  const toggleDues = async (targetUser) => {
    try {
      await api.put(`/users/${targetUser._id}`, { hasPaidDues: !targetUser.hasPaidDues });
      setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, hasPaidDues: !u.hasPaidDues } : u));
    } catch (err) { showAlert("변경 실패"); }
  };

  // 승인 토글
  const toggleApprove = async (targetUser) => {
    try {
      await api.put(`/users/${targetUser._id}`, { isApproved: !targetUser.isApproved });
      setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, isApproved: !u.isApproved } : u));
      showAlert(targetUser.isApproved ? "승인이 취소되었습니다." : "가입이 승인되었습니다! 🎉");
    } catch (err) { showAlert("처리 실패"); }
  };

  // 회원 강제 탈퇴 (삭제)
  const handleDeleteUser = (targetUser) => {
    if (targetUser._id === user._id) {
      return showAlert("자기 자신을 추방할 수는 없습니다! 😅");
    }

    showConfirm(`정말 [${targetUser.name}]님을 탈퇴시키겠습니까?\n이 작업은 되돌릴 수 없습니다.`, async () => {
      try {
        await api.delete(`/users/${targetUser._id}`);
        setUsers(prev => prev.filter(u => u._id !== targetUser._id));
        showAlert("성공적으로 탈퇴 처리되었습니다.");
      } catch (err) {
        showAlert("삭제 실패. 서버 오류가 발생했습니다.");
      }
    });
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-600' };
      case 'graduate': return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-400' };
      default: return { bg: 'bg-white', text: 'text-ink', border: 'border-gray-300' };
    }
  };

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* 🔥 [추가됨] 뒤로가기 버튼 */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-ink font-bold text-ink rounded-sm shadow-[4px_4px_0px_0px_var(--color-ink)] hover:translate-y-1 hover:shadow-none transition-all active:bg-gray-100"
          >
            <IoArrowBack size={20} />
            메인으로 돌아가기
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-display text-ink mb-2">부원 명부 (Admin)</h1>
            <p className="text-gray-600 font-bold">현재 총 인원: {users.length}명</p>
          </div>
        </div>

        <div className="bg-white border-3 border-ink shadow-[8px_8px_0px_0px_var(--color-ink)] rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-ink text-ink font-display text-lg">
                <th className="p-4 w-16">#</th>
                <th className="p-4">이름 (기수)</th>
                <th className="p-4 hidden md:table-cell">이메일</th>
                <th className="p-4 text-center">상태</th>
                <th className="p-4 text-center">회비</th>
                <th className="p-4 text-center">역할</th>
                <th className="p-4 text-center text-red-600">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((member, index) => {
                const badge = getRoleBadge(member.role);
                return (
                  <tr key={member._id} className="border-b border-gray-200 hover:bg-yellow-50 transition-colors">
                    <td className="p-4 font-bold text-gray-400">{index + 1}</td>
                    
                    <td className="p-4">
                      <div className="font-bold text-ink text-lg">{member.name}</div>
                      <div className="text-xs text-gray-500 font-bold">{member.generation}기 | {member.studentId}</div>
                    </td>
                    
                    <td className="p-4 hidden md:table-cell text-gray-600 text-sm font-mono">{member.email}</td>
                    
                    <td className="p-4 text-center">
                      {member.isApproved ? (
                        <button onClick={() => toggleApprove(member)} className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200 text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                          활동중
                        </button>
                      ) : (
                        <button onClick={() => toggleApprove(member)} className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full border border-red-300 hover:bg-red-200 transition text-xs animate-pulse">
                          승인대기
                        </button>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button onClick={() => toggleDues(member)} className="transition-transform active:scale-95">
                        {member.hasPaidDues ? (
                          <div className="flex items-center gap-1 justify-center text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full border border-green-600 shadow-sm text-sm">
                            <IoCheckmarkCircle /> 납부
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-center text-gray-400 font-bold bg-gray-100 px-3 py-1 rounded-full border border-gray-300 text-sm">
                            <IoCloseCircle /> 미납
                          </div>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <div className="relative inline-block">
                        <select 
                          value={member.role || 'member'} 
                          onChange={(e) => handleRoleChange(member, e.target.value)}
                          className={`appearance-none pl-3 pr-8 py-1 rounded-sm border-2 font-bold cursor-pointer focus:outline-none focus:border-ink transition-colors text-sm ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <option value="member">부원</option>
                          <option value="admin">임원진</option>
                          <option value="graduate">OB</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDeleteUser(member)}
                        className="p-2 bg-white border-2 border-red-200 text-red-500 rounded-full hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm active:scale-90"
                        title="회원 탈퇴시키기"
                      >
                        <IoTrashOutline size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;