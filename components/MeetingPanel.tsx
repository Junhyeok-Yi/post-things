'use client';

import { useEffect, useState } from 'react';

type MeetingSession = {
  id: string;
  title: string;
  status: 'active' | 'ended';
  started_at: string;
  ended_at: string | null;
};

export default function MeetingPanel() {
  const [active, setActive] = useState<MeetingSession | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const refreshActive = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meetings/active', { cache: 'no-store' });
      const data = await res.json();
      setActive(data?.activeSession ?? null);
      setMessage('');
    } catch {
      setMessage('활성 회의 상태를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshActive();
  }, []);

  const startMeeting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meetings/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '시작 실패');
      setActive(data.session);
      setTitle('');
      setMessage('회의를 시작했습니다.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '회의 시작에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const endMeeting = async () => {
    if (!active?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${active.id}/end`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '종료 실패');
      setActive(null);
      setMessage('회의를 종료했습니다.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '회의 종료에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-slate-900">Meeting</h2>
        <p className="mt-1 text-sm text-slate-600">회의 시작/종료 및 활성 세션 상태를 관리합니다.</p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">현재 상태</p>
          {loading ? (
            <p className="mt-2 text-sm text-slate-500">불러오는 중...</p>
          ) : active ? (
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p>상태: <span className="font-semibold text-emerald-700">진행중</span></p>
              <p>제목: {active.title}</p>
              <p>시작: {new Date(active.started_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">활성 회의가 없습니다.</p>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회의 제목 (선택)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <button
            onClick={startMeeting}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            회의 시작
          </button>
          <button
            onClick={endMeeting}
            disabled={loading || !active}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            회의 종료
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={refreshActive}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
          >
            상태 새로고침
          </button>
        </div>

        {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
      </div>
    </section>
  );
}
