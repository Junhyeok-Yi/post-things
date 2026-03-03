import { supabase } from './supabase'
import { StickyNote } from './types'
import type { Database } from './database.types.js'

// Supabase 테이블 타입 정의
type Tables = Database['public']['Tables']
type StickyNoteTable = Tables['sticky_notes']
type StickyNoteRow = StickyNoteTable['Row']
type StickyNoteInsert = StickyNoteTable['Insert']
type StickyNoteUpdate = StickyNoteTable['Update']
type StickyNoteRowExt = StickyNoteRow & { meeting_session_id?: string | null }
type StickyNoteInsertExt = StickyNoteInsert & { meeting_session_id?: string | null }
type StickyNoteUpdateExt = StickyNoteUpdate & { meeting_session_id?: string | null }

// LocalStorage 키
const LOCAL_STORAGE_KEY = 'sticky-notes'

/**
 * Supabase에서 모든 노트 가져오기
 */
export async function fetchNotesFromSupabase(): Promise<StickyNote[]> {
  try {
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<StickyNoteRow[]>()

    if (error || !data) {
      console.error('Supabase 노트 조회 실패:', error)
      return []
    }

    // 데이터베이스 형식을 앱 형식으로 변환
    return data.map(dbNote => ({
      id: dbNote.id,
      content: dbNote.content,
      category: dbNote.category,
      color: dbNote.color,
      createdAt: new Date(dbNote.created_at),
      updatedAt: new Date(dbNote.updated_at),
      isCompleted: dbNote.is_completed || false,
      meetingSessionId: (dbNote as StickyNoteRowExt).meeting_session_id ?? null,
    }))
  } catch (error) {
    console.error('Supabase 연결 실패:', error)
    return []
  }
}

/**
 * Supabase에 노트 저장
 */
export async function saveNoteToSupabase(note: StickyNote): Promise<boolean> {
  try {
    // Supabase Insert 타입에 맞는 데이터 구성
    const insertData: StickyNoteInsert = {
      id: note.id,
      content: note.content,
      category: note.category,
      color: note.color,
      is_completed: note.isCompleted || false,
      created_at: note.createdAt.toISOString(),
      updated_at: note.updatedAt.toISOString(),
    }

    // database.types.ts 미갱신 컬럼 반영
    const insertPayload: StickyNoteInsertExt = { ...insertData }
    if (note.meetingSessionId) {
      insertPayload.meeting_session_id = note.meetingSessionId
    }

    const { error } = await supabase
      .from('sticky_notes')
      .insert([insertPayload])
      .returns<StickyNoteRow[]>()

    if (error) {
      console.error('Supabase 노트 저장 실패:', error)
      return false
    }

    console.log('Supabase에 노트 저장 성공:', note.id)
    return true
  } catch (error) {
    console.error('Supabase 저장 중 오류:', error)
    return false
  }
}

/**
 * Supabase에서 노트 업데이트
 */
export async function updateNoteInSupabase(note: StickyNote): Promise<boolean> {
  try {
    // Supabase Update 타입에 맞는 데이터 구성
    const updateData: StickyNoteUpdate = {
      content: note.content,
      category: note.category,
      color: note.color,
      is_completed: note.isCompleted || false,
      updated_at: note.updatedAt.toISOString(),
    }

    const updatePayload: StickyNoteUpdateExt = { ...updateData }
    if (note.meetingSessionId !== undefined) {
      updatePayload.meeting_session_id = note.meetingSessionId
    }

    const { error } = await supabase
      .from('sticky_notes')
      .update(updatePayload)
      .eq('id', note.id)
      .returns<StickyNoteRow[]>()

    if (error) {
      console.error('Supabase 노트 업데이트 실패:', error)
      return false
    }

    console.log('Supabase에 노트 업데이트 성공:', note.id)
    return true
  } catch (error) {
    console.error('Supabase 업데이트 중 오류:', error)
    return false
  }
}

/**
 * Supabase에서 노트 삭제
 */
export async function deleteNoteFromSupabase(noteId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', noteId)
      .returns<StickyNoteRow[]>()

    if (error) {
      console.error('Supabase 노트 삭제 실패:', error)
      return false
    }

    console.log('Supabase에서 노트 삭제 성공:', noteId)
    return true
  } catch (error) {
    console.error('Supabase 삭제 중 오류:', error)
    return false
  }
}

/**
 * LocalStorage에서 Supabase로 데이터 마이그레이션
 */
export async function migrateLocalStorageToSupabase(): Promise<boolean> {
  try {
    // LocalStorage에서 기존 데이터 읽기
    const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!savedNotes) {
      console.log('마이그레이션할 LocalStorage 데이터 없음')
      return true
    }

    const localNotes: StickyNote[] = JSON.parse(savedNotes).map((note: StickyNote) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }))

    console.log(`LocalStorage에서 ${localNotes.length}개 노트 발견`)

    // Supabase에 일괄 저장
    let successCount = 0
    for (const note of localNotes) {
      const success = await saveNoteToSupabase(note)
      if (success) successCount++
    }

    console.log(`${successCount}/${localNotes.length}개 노트 마이그레이션 완료`)

    // 마이그레이션 성공 시 LocalStorage 백업 후 삭제
    if (successCount === localNotes.length) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}-backup`, savedNotes)
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      console.log('LocalStorage 데이터 정리 완료 (백업 보관)')
    }

    return successCount === localNotes.length
  } catch (error) {
    console.error('마이그레이션 중 오류:', error)
    return false
  }
}

/**
 * Supabase 연결 상태 확인
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sticky_notes')
      .select('count', { count: 'exact', head: true })

    return !error
  } catch (error) {
    console.error('Supabase 연결 확인 실패:', error)
    return false
  }
}
