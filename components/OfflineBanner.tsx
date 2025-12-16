/**
 * 오프라인 배너 컴포넌트
 * 
 * 인터넷 연결이 끊겼을 때 화면 상단에 표시되는 알림 배너입니다.
 * useOnlineStatus 훅과 함께 사용하여 자동으로 표시/숨김 처리됩니다.
 */

'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // 오프라인 상태로 전환됨
      setShow(true);
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // 오프라인에서 다시 온라인으로 복구됨
      // 3초 후에 배너 숨김
      setTimeout(() => {
        setShow(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOnline ? 'bg-green-500' : 'bg-amber-500'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-white">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" />
            <span className="font-medium">
              ✅ 인터넷에 다시 연결되었습니다
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">
              ⚠️ 인터넷 연결이 끊겼습니다 - 오프라인 모드
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 간단한 오프라인 표시기 (우측 상단)
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-amber-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span>오프라인</span>
    </div>
  );
}
