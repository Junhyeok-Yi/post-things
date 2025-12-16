'use client';

import { useState, useEffect } from 'react';
import { StickyNote, ViewMode } from '@/lib/types';
import { categorizeContent } from '@/lib/ai-categorizer';
import { 
  fetchNotesFromSupabase, 
  saveNoteToSupabase, 
  updateNoteInSupabase, 
  deleteNoteFromSupabase,
  migrateLocalStorageToSupabase,
  checkSupabaseConnection 
} from '@/lib/supabase-api';
import { supabase } from '@/lib/supabase';
import StickyNoteInput from '@/components/StickyNoteInput';
import AffinityDiagram from '@/components/AffinityDiagram';
import { useToast } from "@/hooks/use-toast";
import { normalizeDate } from '@/lib/date-utils';
import { normalizeError, getUserFriendlyError, logError, isRecoverableError } from '@/lib/error-handler';
import { validateNoteContent } from '@/lib/validation';
import { STORAGE_KEYS } from '@/lib/constants';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('memo');
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [currentNote, setCurrentNote] = useState<StickyNote | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // Supabase 연결 확인
        const isConnected = await checkSupabaseConnection();
        setIsSupabaseConnected(isConnected);
        
        if (isConnected) {
          // LocalStorage 데이터 마이그레이션 (최초 1회)
          await migrateLocalStorageToSupabase();
          
          // Supabase에서 노트 가져오기
          const supabaseNotes = await fetchNotesFromSupabase();
          setNotes(supabaseNotes);
        } else {
          // LocalStorage에서 노트 가져오기
          const savedNotes = localStorage.getItem(STORAGE_KEYS.STICKY_NOTES);
          if (savedNotes) {
            const parsedNotes = JSON.parse(savedNotes);
            // 날짜 정규화
            const normalizedNotes = parsedNotes.map((note: StickyNote) => ({
              ...note,
              createdAt: normalizeDate(note.createdAt),
              updatedAt: normalizeDate(note.updatedAt),
            }));
            setNotes(normalizedNotes);
          }
        }
      } catch (error) {
        const appError = normalizeError(error);
        logError(appError, { context: '앱 초기화' });
        const userError = getUserFriendlyError(appError);
        toast({
          title: userError.title,
          description: userError.description,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [toast]);

  // Supabase Realtime 구독
  useEffect(() => {
    if (!isSupabaseConnected) {
      console.log('Realtime: Supabase 미연결, 구독 비활성화');
      return;
    }

    console.log('Realtime: Supabase 연결됨, 구독 시작 시도...');
    
    const channel = supabase
      .channel('sticky_notes_changes', {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sticky_notes'
        },
        async (payload) => {
          console.log('Realtime: 데이터베이스 변경 감지:', payload);
          const supabaseNotes = await fetchNotesFromSupabase();
          setNotes(supabaseNotes);
          console.log('Realtime: 📱💻 실시간 동기화 완료');
        }
      )
      .subscribe((status) => {
        console.log('Realtime: 구독 상태:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Realtime: ✅ 채널 구독 성공');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime: ❌ 채널 구독 에러');
        }
      });

    return () => {
      if (channel) {
        console.log('Realtime: 채널 구독 해제');
        supabase.removeChannel(channel);
      }
    };
  }, [isSupabaseConnected]);

  // 노트 저장
  const saveNotes = async (updatedNotes: StickyNote[]) => {
    try {
      if (isSupabaseConnected) {
        // Supabase에 저장
        await saveNoteToSupabase(updatedNotes[0]); // 새로운 노트는 항상 배열의 첫 번째
      } else {
        // LocalStorage에 저장
        localStorage.setItem(STORAGE_KEYS.STICKY_NOTES, JSON.stringify(updatedNotes));
      }
      setNotes(updatedNotes);
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { context: '노트 저장' });
      const userError = getUserFriendlyError(appError);
      toast({
        title: userError.title,
        description: userError.description,
        variant: "destructive",
      });
    }
  };

  // 노트 추가/수정
  const addNote = async (content: string) => {
    setIsClassifying(true);
    try {
      // 입력 검증
      const validation = validateNoteContent(content);
      if (!validation.isValid) {
        toast({
          title: "입력 오류",
          description: validation.error || "유효하지 않은 입력입니다.",
          variant: "destructive",
        });
        return;
      }

      const sanitizedContent = validation.sanitized || content;
      const category = await categorizeContent(sanitizedContent);
      const now = new Date();
      
      if (currentNote) {
        // 기존 노트 수정
        const updatedNote = {
          ...currentNote,
          content: sanitizedContent,
          category,
          updatedAt: now
        };
        
        if (isSupabaseConnected) {
          await updateNoteInSupabase(updatedNote);
          const updatedNotes = await fetchNotesFromSupabase();
          setNotes(updatedNotes);
        } else {
          const updatedNotes = notes.map(note => 
            note.id === currentNote.id ? updatedNote : note
          );
          localStorage.setItem(STORAGE_KEYS.STICKY_NOTES, JSON.stringify(updatedNotes));
          setNotes(updatedNotes);
        }
      } else {
        // 새 노트 추가
        const newNote: StickyNote = {
          id: crypto.randomUUID(),
          content: sanitizedContent,
          category,
          color: ['yellow', 'pink', 'blue', 'green'][Math.floor(Math.random() * 4)] as 'yellow' | 'pink' | 'blue' | 'green',
          createdAt: now,
          updatedAt: now,
          isCompleted: false
        };
        
        const updatedNotes = [newNote, ...notes];
        await saveNotes(updatedNotes);
      }
      
      setCurrentNote(null);
      // 새 메모 작성 후에는 메모 모드 유지
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { context: '노트 추가/수정' });
      const userError = getUserFriendlyError(appError);
      toast({
        title: userError.title,
        description: userError.description,
        variant: "destructive",
      });
    } finally {
      setIsClassifying(false);
    }
  };

  // 노트 삭제
  const deleteNote = async (id: string) => {
    try {
      if (isSupabaseConnected) {
        await deleteNoteFromSupabase(id);
        const updatedNotes = await fetchNotesFromSupabase();
        setNotes(updatedNotes);
      } else {
        const updatedNotes = notes.filter(note => note.id !== id);
        localStorage.setItem(STORAGE_KEYS.STICKY_NOTES, JSON.stringify(updatedNotes));
        setNotes(updatedNotes);
      }
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { context: '노트 삭제', noteId: id });
      const userError = getUserFriendlyError(appError);
      toast({
        title: userError.title,
        description: userError.description,
        variant: "destructive",
      });
    }
  };

  // 노트 완료 처리
  const toggleNoteCompletion = async (id: string) => {
    try {
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) return;

      const updatedNote = {
        ...noteToUpdate,
        isCompleted: !noteToUpdate.isCompleted,
        updatedAt: new Date()
      };

        if (isSupabaseConnected) {
          await updateNoteInSupabase(updatedNote);
          const updatedNotes = await fetchNotesFromSupabase();
          setNotes(updatedNotes);
        } else {
          const updatedNotes = notes.map(note =>
            note.id === id ? updatedNote : note
          );
          localStorage.setItem(STORAGE_KEYS.STICKY_NOTES, JSON.stringify(updatedNotes));
          setNotes(updatedNotes);
        }
      } catch (error) {
        const appError = normalizeError(error);
        logError(appError, { context: '노트 완료 처리', noteId: id });
        const userError = getUserFriendlyError(appError);
        toast({
          title: userError.title,
          description: userError.description,
          variant: "destructive",
        });
      }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {viewMode === 'memo' ? (
        <StickyNoteInput
          currentNote={currentNote}
          setCurrentNote={setCurrentNote}
          onSave={addNote}
          onDelete={deleteNote}
          onSwitchToAffinity={() => setViewMode('diagram')}
          onComplete={toggleNoteCompletion}
          isClassifying={isClassifying}
        />
      ) : (
        <AffinityDiagram
          notes={notes}
          onNoteSelect={setCurrentNote}
          onSwitchToMemo={() => setViewMode('memo')}
          onNoteComplete={toggleNoteCompletion}
          onNoteDelete={deleteNote}
        />
      )}
      
      {/* 🎨 M2Z1 스타일 동기화 상태 표시 (라이트 모드) */}
      <div className="fixed top-6 right-6 z-30">
        <div className="px-4 py-2 rounded-lg text-sm font-medium bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center gap-3 shadow-lg">
          <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
          <span className="text-gray-700">
            {isSupabaseConnected ? 'Cloud Sync' : 'Local Mode'}
          </span>
        </div>
      </div>
    </main>
  );
}