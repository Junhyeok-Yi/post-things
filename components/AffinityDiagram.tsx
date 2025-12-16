'use client';

import { useState, useEffect } from 'react';
import { StickyNote } from '@/lib/types';
import { getCategoryPriority } from '@/lib/ai-categorizer';
import { Edit3, Clock, Tag, MoreVertical, Check, Trash2, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { normalizeDate } from '@/lib/date-utils';
import { groupMeetings, extractMeetingTitle } from '@/lib/meeting-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortType = 'category' | 'meeting' | 'time';

interface AffinityDiagramProps {
  notes: StickyNote[];
  onNoteSelect: (note: StickyNote | null) => void;
  onSwitchToMemo: () => void;
  onNoteComplete: (id: string) => void;
  onNoteDelete: (id: string) => void;
  onNoteUncomplete?: (id: string) => void; // 완료 취소 함수 추가
}

export default function AffinityDiagram({
  notes,
  onNoteSelect,
  onSwitchToMemo,
  onNoteComplete,
  onNoteDelete,
  onNoteUncomplete
}: AffinityDiagramProps) {
  const [sortType, setSortType] = useState<SortType>('category');
  const [actionFeedback, setActionFeedback] = useState<{ [key: string]: 'complete' | 'delete' | 'uncomplete' | null }>({});
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  
  const handleNoteClick = (note: StickyNote, e: React.MouseEvent<HTMLElement>) => {
    // 더보기 메뉴 클릭 시 이벤트 전파 중단
    if ((e.target as HTMLElement).closest('.more-menu')) {
      e.stopPropagation();
      return;
    }
    onNoteSelect(note);
    onSwitchToMemo();
  };

  const handleNewMemo = () => {
    onNoteSelect(null);
    onSwitchToMemo();
  };

  // 완료 처리 with 피드백
  const handleComplete = (noteId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // 피드백 표시
    setActionFeedback(prev => ({ ...prev, [noteId]: 'complete' }));
    
    // 실제 완료 처리
    setTimeout(() => {
      onNoteComplete(noteId);
      // 피드백 제거
      setTimeout(() => {
        setActionFeedback(prev => ({ ...prev, [noteId]: null }));
      }, 500);
    }, 300);
  };
  
  // 완료 취소 처리 with 피드백
  const handleUncomplete = (noteId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!onNoteUncomplete) return;
    
    // 피드백 표시
    setActionFeedback(prev => ({ ...prev, [noteId]: 'uncomplete' }));
    
    // 실제 완료 취소 처리
    setTimeout(() => {
      onNoteUncomplete(noteId);
      // 피드백 제거
      setTimeout(() => {
        setActionFeedback(prev => ({ ...prev, [noteId]: null }));
      }, 500);
    }, 300);
  };

  // 삭제 처리 with 피드백
  const handleDelete = (noteId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // 피드백 표시
    setActionFeedback(prev => ({ ...prev, [noteId]: 'delete' }));
    
    // 실제 삭제 처리
    setTimeout(() => {
      onNoteDelete(noteId);
      // 피드백 제거
      setTimeout(() => {
        setActionFeedback(prev => ({ ...prev, [noteId]: null }));
      }, 500);
    }, 300);
  };

  // 회의록별 그룹화 함수
  const groupByMeeting = (notes: StickyNote[]) => {
    const meetings = groupMeetings(notes);
    const groupedByMeeting: Record<string, StickyNote[]> = {};
    
    meetings.forEach(meeting => {
      const meetingNotes = notes.filter(note => meeting.noteIds.includes(note.id));
      if (meetingNotes.length > 0) {
        groupedByMeeting[meeting.id] = meetingNotes;
      }
    });
    
    return groupedByMeeting;
  };


  // 카테고리별 그룹화 함수
  const groupByCategory = (notes: StickyNote[]) => {
    return notes.reduce((acc, note) => {
      if (!acc[note.category]) {
        acc[note.category] = [];
      }
      acc[note.category].push(note);
      return acc;
    }, {} as Record<string, StickyNote[]>);
  };

  // 시간별 정렬 함수
  const sortByTime = (notes: StickyNote[]) => {
    const sortedNotes = [...notes].sort((a, b) => {
      const dateA = normalizeDate(a.createdAt);
      const dateB = normalizeDate(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    // 날짜별로 그룹화
    const groupedByDate = sortedNotes.reduce((acc, note) => {
      const noteDate = normalizeDate(note.createdAt);
      const dateKey = format(noteDate, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(note);
      return acc;
    }, {} as Record<string, StickyNote[]>);

    return { sortedNotes, groupedByDate };
  };

  // 정렬된 노트와 그룹 가져오기
  const getSortedNotesAndGroups = () => {
    switch (sortType) {
      case 'category':
        const groupedByCategory = groupByCategory(notes);
        const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
          return getCategoryPriority(a as StickyNote['category']) - getCategoryPriority(b as StickyNote['category']);
        });
        return { groups: sortedCategories, groupedNotes: groupedByCategory, isTimeline: false, isMeeting: false };
      
      case 'meeting':
        const groupedByMeeting = groupByMeeting(notes);
        const meetings = groupMeetings(notes);
        const meetingGroups = meetings.map(m => m.id);
        return { groups: meetingGroups, groupedNotes: groupedByMeeting, isTimeline: false, isMeeting: true, meetings };
      
      case 'time':
        const { groupedByDate } = sortByTime(notes);
        const sortedDates = Object.keys(groupedByDate).sort().reverse();
        return { groups: sortedDates, groupedNotes: groupedByDate, isTimeline: true, isMeeting: false };
      
      default:
        return { groups: [], groupedNotes: {}, isTimeline: false, isMeeting: false };
    }
  };

  // 🎨 M2Z1 스타일 카테고리별 색상 테마 (라이트 모드)
  const getTheme = (group: string) => {
    switch (group) {
      case 'To-Do':
        return {
          accent: 'text-pink-600',
          badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
          completedColor: 'bg-green-50 text-green-700 border-green-200'
        };
      case '아이디어':
        return {
          accent: 'text-blue-600',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          completedColor: 'bg-green-50 text-green-700 border-green-200'
        };
      case '회의록':
        return {
          accent: 'text-green-600',
          badgeColor: 'bg-green-50 text-green-700 border-green-200',
          completedColor: 'bg-green-50 text-green-700 border-green-200'
        };
      default:
        return {
          accent: 'text-amber-600',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          completedColor: 'bg-green-50 text-green-700 border-green-200'
        };
    }
  };

  const { groups, groupedNotes, isTimeline, isMeeting, meetings } = getSortedNotesAndGroups();

  return (
    <div className="min-h-screen bg-white text-gray-900 relative">
      {/* 🎨 M2Z1 스타일 헤더 영역 (화이트 배경 최적화) */}
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gray-900">AI 메모 갤러리</h1>
              <p className="text-gray-600 text-lg">스마트 분류로 정리된 당신의 생각들</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{notes.length}</p>
              <p className="text-gray-500 text-sm">Total Memos</p>
            </div>
          </div>
          
          {/* M2Z1 스타일 네비게이션 바 (라이트 모드) */}
          <nav className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSortType('category')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all text-sm font-medium ${
                sortType === 'category'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Tag size={16} />
              Categories
            </button>
            <button
              onClick={() => setSortType('meeting')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all text-sm font-medium ${
                sortType === 'meeting'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock size={16} />
              회의록
            </button>
            <button
              onClick={() => setSortType('time')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all text-sm font-medium ${
                sortType === 'time'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock size={16} />
              Timeline
            </button>
          </nav>
        </div>
      </header>

      {notes.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Edit3 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">아직 메모가 없습니다</h3>
            <p className="text-gray-600 text-lg mb-8">첫 번째 메모를 작성해서 AI 갤러리를 시작해보세요</p>
            <button
              onClick={handleNewMemo}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              새 메모 작성하기
            </button>
          </div>
        </div>
      ) : (
        <main className="max-w-[1920px] mx-auto px-6 py-8">
          {groups.map((group) => {
            const groupNotes = groupedNotes[group];
            // 완료되지 않은 노트만 카운트
            const activeCount = groupNotes.filter(note => !note.isCompleted).length;
            const completedCount = groupNotes.filter(note => note.isCompleted).length;
            
            // 회의록인 경우 제목 추출
            let meetingTitle = '';
            let meetingDate = '';
            if (isMeeting && meetings) {
              const meeting = meetings.find(m => m.id === group);
              if (meeting) {
                meetingTitle = meeting.title;
                meetingDate = format(meeting.startTime, 'M월 d일 HH:mm', { locale: ko });
              }
            }
            
            return (
              <section key={group} className="mb-16">
                {/* 🎨 M2Z1 스타일 섹션 헤더 */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    {isTimeline ? (
                      <h2 className="text-3xl font-bold text-gray-900">
                        {format(new Date(group), 'M월 d일 (E)', { locale: ko })}
                      </h2>
                    ) : isMeeting ? (
                      <>
                        <div>
                          <h2 className={`text-3xl font-bold ${getTheme('회의록').accent}`}>{meetingTitle || '회의록'}</h2>
                          <p className="text-sm text-gray-500 mt-1">{meetingDate}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getTheme('회의록').badgeColor}`}>
                            {groupNotes.length} items
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className={`text-3xl font-bold ${getTheme(group).accent}`}>{group}</h2>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getTheme(group).badgeColor}`}>
                            {activeCount} items
                          </span>
                          {group === 'To-Do' && completedCount > 0 && (
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-2 rounded-full text-sm font-medium border ${getTheme(group).completedColor}`}>
                                {completedCount} completed
                              </span>
                              {/* 막대 그래프 */}
                              <div className="flex items-center gap-1">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${(completedCount / (activeCount + completedCount)) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {Math.round((completedCount / (activeCount + completedCount)) * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* 🖼️ M2Z1 스타일 갤러리 그리드 - 최대 4개 가로 배치 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={(e) => handleNoteClick(note, e)}
                      onMouseEnter={() => setHoveredNoteId(note.id)}
                      onMouseLeave={() => setHoveredNoteId(null)}
                      className="group relative aspect-square cursor-pointer transition-all duration-300 hover:scale-105"
                    >
                      {/* M2Z1 스타일 메모 카드 */}
                      <div className={`relative w-full h-full rounded-2xl shadow-lg transition-all duration-300 ${
                        note.color === 'yellow' ? 'bg-gradient-to-br from-yellow-200 to-yellow-300' :
                        note.color === 'pink' ? 'bg-gradient-to-br from-pink-200 to-pink-300' :
                        note.color === 'blue' ? 'bg-gradient-to-br from-blue-200 to-blue-300' : 
                        'bg-gradient-to-br from-green-200 to-green-300'
                      } group-hover:shadow-2xl`}>
                        
                        {/* 더보기 아이콘 (항상 표시) */}
                        <div className="absolute top-2 right-2 z-50 more-menu">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                                className="p-2 text-gray-600 hover:text-gray-800 transition-colors hover:bg-white/80 rounded-full shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              {!note.isCompleted ? (
                                <DropdownMenuItem onClick={(e) => handleComplete(note.id, e)}>
                                  <Check className="w-4 h-4 mr-2" />
                                  <span>완료</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={(e) => handleUncomplete(note.id, e)}>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  <span>미완료</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={(e) => handleDelete(note.id, e)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span>삭제</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* 포스트잇 접착 테이프 효과 */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-yellow-400/40 rounded-b-lg"></div>
                        
                          {/* 메모 내용 영역 */}
                          <div className="relative h-full flex flex-col justify-between p-6 pt-8">
                          {/* 메모 텍스트 - 말줄임 처리 */}
                          <div className="flex-1 flex items-center justify-center">
                            <p className={`text-gray-800 text-center leading-relaxed font-medium text-sm ${
                              hoveredNoteId === note.id && note.isCompleted ? '' : 'line-clamp-3'
                            }`}>
                              {note.content}
                            </p>
                          </div>
                          
                          {/* 하단 메타데이터 */}
                          <div className="flex items-center justify-between pt-4 border-t border-black/10">
                            <span className="text-xs text-gray-600 font-medium">
                              {group}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(normalizeDate(note.createdAt), 'MM.dd', { locale: ko })}
                            </span>
                          </div>
                        </div>

                        {/* 완료 오버레이 (M2Z1 스타일) - hover 시 내용 보이기 */}
                        {note.isCompleted && (
                          <div className={`absolute inset-0 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm transition-all duration-300 ${
                            hoveredNoteId === note.id 
                              ? 'bg-black/20' 
                              : 'bg-black/60'
                          }`}>
                            {hoveredNoteId !== note.id && (
                              <div className="text-center">
                                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <span className="text-white font-bold text-sm">완료됨</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 액션 피드백 오버레이 */}
                        {actionFeedback[note.id] && (
                          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center z-30 backdrop-blur-sm">
                            <div className="bg-white/90 rounded-full p-4 shadow-lg">
                              {actionFeedback[note.id] === 'complete' ? (
                                <Check className="w-6 h-6 text-green-600" />
                              ) : actionFeedback[note.id] === 'uncomplete' ? (
                                <RotateCcw className="w-6 h-6 text-blue-600" />
                              ) : (
                                <X className="w-6 h-6 text-red-600" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 빈 그룹 메시지 (라이트 모드) */}
                {groupNotes.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Grid className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg">
                      이 {
                        sortType === 'category' ? '카테고리' : 
                        sortType === 'meeting' ? '회의록' : '날짜'
                      }에는 아직 메모가 없습니다.
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </main>
      )}

      {/* 🎨 M2Z1 스타일 플로팅 액션 버튼 (라이트 모드) */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={handleNewMemo}
          className="group relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
          aria-label="새 메모 작성"
        >
          <Edit3 className="w-6 h-6 transition-transform group-hover:scale-110" />
          
          {/* M2Z1 스타일 툴팁 (라이트 모드) */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
              새 메모 작성
              <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}