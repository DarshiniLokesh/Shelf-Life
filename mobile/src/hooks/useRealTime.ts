import { useEffect, useRef } from 'react';
import EventSource from 'react-native-sse';
import 'react-native-url-polyfill/auto';
import { API_BASE_URL } from '../config';

/**
 * A custom hook to listen for real-time inventory updates on mobile.
 * Prioritizes Server-Sent Events (SSE) and falls back to 5-second polling
 * if SSE is unavailable or disconnects.
 * 
 * @param onUpdate Callback function to invoke when an inventory change is detected.
 */
export function useRealTime(onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;
    let sseConnected = false;
    let reconnectTimeout: any = null;

    const startPolling = () => {
      if (pollInterval) return;
      console.log('[RealTime] SSE not active. Falling back to 5s polling.');
      pollInterval = setInterval(() => {
        onUpdateRef.current();
      }, 5000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        console.log('[RealTime] SSE active. Stopping polling.');
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const connectSSE = () => {
      if (eventSource) return;

      try {
        eventSource = new EventSource(`${API_BASE_URL}/api/events`, {
          method: 'GET'
        });

        eventSource.addEventListener('open', () => {
          console.log('[RealTime] SSE connection established successfully.');
          sseConnected = true;
          stopPolling();
        });

        eventSource.addEventListener('message', () => {
          console.log('[RealTime] SSE update received.');
          onUpdateRef.current();
        });

        eventSource.addEventListener('error', (err) => {
          console.warn('[RealTime] SSE connection error/closed. Swapped to polling.', err);
          sseConnected = false;
          
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          
          startPolling();

          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              if (!sseConnected) {
                console.log('[RealTime] Attempting to reconnect SSE stream...');
                connectSSE();
              }
            }, 10000);
          }
        });
      } catch (e) {
        console.error('[RealTime] EventSource creation failed, starting polling.', e);
        startPolling();
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);
}
