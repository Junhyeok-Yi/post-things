/**
 * useOnlineStatus 커스텀 훅
 * 
 * 인터넷 연결 상태를 실시간으로 감지합니다.
 * 오프라인 모드에서 사용자에게 알림을 표시하거나
 * 로컬 스토리지로 전환하는 등의 처리에 사용할 수 있습니다.
 * 
 * @example
 * function App() {
 *   const isOnline = useOnlineStatus();
 *   
 *   return (
 *     <>
 *       {!isOnline && <OfflineBanner />}
 *       <MainContent />
 *     </>
 *   );
 * }
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * 온라인/오프라인 상태를 추적하는 훅
 * 
 * @returns 현재 온라인 상태 (true: 온라인, false: 오프라인)
 */
export function useOnlineStatus(): boolean {
  // 초기값: 브라우저의 현재 연결 상태
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // 온라인 상태로 전환되었을 때
    const handleOnline = () => {
      console.log('✅ 인터넷 연결됨');
      setIsOnline(true);
    };

    // 오프라인 상태로 전환되었을 때
    const handleOffline = () => {
      console.warn('⚠️ 인터넷 연결 끊김');
      setIsOnline(false);
    };

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 클린업: 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * 온라인 상태 변경 시 콜백을 실행하는 훅
 * 
 * @example
 * useOnlineStatusChange((isOnline) => {
 *   if (isOnline) {
 *     syncWithServer();
 *   } else {
 *     saveToLocalStorage();
 *   }
 * });
 */
export function useOnlineStatusChange(
  onStatusChange: (isOnline: boolean) => void
): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onStatusChange(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      onStatusChange(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  return isOnline;
}

/**
 * 네트워크 상태 정보를 반환하는 고급 훅
 * 
 * @returns 네트워크 연결 타입, 속도, 절약 모드 등의 정보
 */
export function useNetworkInformation() {
  const [networkInfo, setNetworkInfo] = useState<{
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      // Network Information API 사용 (지원하는 브라우저에서만)
      const connection = (navigator as any).connection 
        || (navigator as any).mozConnection 
        || (navigator as any).webkitConnection;

      setNetworkInfo({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection?.downlink,           // 다운로드 속도 (Mbps)
        rtt: connection?.rtt,                     // Round-trip time (ms)
        saveData: connection?.saveData,           // 데이터 절약 모드 여부
      });
    };

    // 초기 정보 수집
    updateNetworkInfo();

    // 연결 상태 변경 감지
    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API 변경 감지
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return networkInfo;
}
