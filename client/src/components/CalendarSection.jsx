// client/src/components/CalendarSection.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios'
import { IoCalendarOutline, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import EventModal from './EventModal'; // 👈 모달 불러오기

const CalendarSection = () => {
  const [currentDate, setCurrentDate] = useState(new Date()); // 현재 보고 있는 달
  const [events, setEvents] = useState([]);
  
  // 모달 관련 상태
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 월이 바뀔 때마다 일정 가져오기
  const fetchEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await api.get(`/events?year=${year}&month=${month}`);
      setEvents(res.data);
    } catch (err) {
      console.error("일정 로드 실패", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  // 달 이동 함수
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (day) => {
    if (!day) return;
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setModalOpen(true);
  };

  // 달력 렌더링 로직
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // 오늘 날짜 체크용
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // 해당 날짜의 일정 필터링
  const getEventsForDay = (day) => {
    if (!day) return [];
    // DB의 Date는 ISOString이므로 로컬 날짜와 비교 시 주의
    // 여기서는 간단하게 YYYY-MM-DD 문자열로 비교
    const target = new Date(year, month, day).toDateString();
    return events.filter(e => new Date(e.date).toDateString() === target);
  };

  return (
    <div className="max-w-4xl mx-auto my-12 relative">
      
      {/* 달력 헤더 (화살표 추가) */}
      <div className="flex items-center justify-between mb-6 border-b-2 border-ink pb-2">
        <div className="flex items-center gap-2">
          <IoCalendarOutline size={28} className="text-ink" />
          <h2 className="text-2xl font-display text-ink">INK Schedule</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-full transition">
            <IoChevronBack size={24} />
          </button>
          <span className="font-bold text-xl text-ink w-24 text-center">
            {year}. {month + 1}
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-full transition">
            <IoChevronForward size={24} />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-2 text-center font-bold text-gray-500 mb-2">
        <div className="text-red-500">SUN</div>
        <div>MON</div>
        <div>TUE</div>
        <div>WED</div>
        <div>THU</div>
        <div>FRI</div>
        <div className="text-blue-500">SAT</div>
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <div 
              key={idx} 
              onClick={() => handleDateClick(day)}
              className={`
                min-h-[100px] border-2 p-1 relative rounded-sm transition-all cursor-pointer overflow-hidden
                ${day 
                  ? 'bg-white border-gray-200 hover:border-ink hover:shadow-md hover:-translate-y-1' 
                  : 'border-transparent cursor-default'
                }
              `}
            >
              {day && (
                <>
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold ml-1 ${idx % 7 === 0 ? 'text-red-500' : (idx % 7 === 6 ? 'text-blue-500' : 'text-gray-700')}`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] bg-red-500 text-white px-1 rounded-full font-bold mr-1">TODAY</span>
                    )}
                  </div>
                  
                  {/* 일정 미리보기 (최대 3개) */}
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div 
                        key={evt._id} 
                        className={`text-[10px] font-bold px-1 py-0.5 rounded text-white truncate
                          ${evt.type === 'important' ? 'bg-red-500' : (evt.type === 'party' ? 'bg-yellow-400 text-ink' : 'bg-ink')}
                        `}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-gray-400 text-center font-bold">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 일정 상세 모달 */}
      {modalOpen && selectedDate && (
        <EventModal 
          date={selectedDate}
          events={getEventsForDay(selectedDate.getDate())}
          onClose={() => setModalOpen(false)}
          onUpdate={fetchEvents}
        />
      )}
    </div>
  );
};

export default CalendarSection;