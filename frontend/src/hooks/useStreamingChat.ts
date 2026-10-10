import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';
import { ChatMessage } from '../types';

const initial: ChatMessage[] = [{ id: 'welcome', sender: 'assistant', text: "Hi, I'm your ER Freelancer project assistant. What would you like to build? Tell me a little about your website, app or business idea.", timestamp: new Date().toISOString() }];
const newSession = () => crypto.randomUUID();
const restore = () => {
  try { const value = JSON.parse(sessionStorage.getItem('erf-chat') || 'null'); if (value?.sessionId && Array.isArray(value.messages)) return value; } catch {}
  return { sessionId: newSession(), messages: initial };
};

export const useStreamingChat = (context: { serviceTitle?: string; locationName?: string }) => {
  const [conversation, setConversation] = useState(restore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const messages: ChatMessage[] = conversation.messages;
  const setMessages = (update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => setConversation((prev: any) => ({ ...prev, messages: typeof update === 'function' ? update(prev.messages) : update }));
  useEffect(() => { try { sessionStorage.setItem('erf-chat', JSON.stringify(conversation)); } catch {} }, [conversation]);
  useEffect(() => () => { controller.current?.abort(); sequence.current++; }, []);

  const send = async (text: string, retry = false) => {
    if (controller.current || (!text.trim() && !retry)) return;
    const requestId = ++sequence.current;
    let history = messages;
    if (retry) { const last = history.map(m => m.sender).lastIndexOf('user'); if (last < 0) return; history = history.slice(0, last + 1); }
    else history = [...history, { id: newSession(), sender: 'user', text: text.trim(), timestamp: new Date().toISOString() }];
    const assistantId = newSession();
    setMessages([...history, { id: assistantId, sender: 'assistant', text: '', timestamp: new Date().toISOString() }]);
    setLoading(true); setError('');
    const abort = new AbortController(); controller.current = abort;
    const timer = window.setTimeout(() => abort.abort('timeout'), 90000);
    let complete = false;
    try {
      const response = await apiFetch('/api/chat/stream', { method: 'POST', signal: abort.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: conversation.sessionId, messages: history.filter(m => m.text).slice(-50).map(m => ({ role: m.sender, text: m.text })), userContext: context }) });
      if (!response.ok || !response.body) throw new Error('Chat is unavailable right now. Please retry.');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
      try {
        while (!complete) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          let split: number;
          while ((split = buffer.indexOf('\n\n')) >= 0) {
            const block = buffer.slice(0, split); buffer = buffer.slice(split + 2);
            const kind = block.split('\n').find(l => l.startsWith('event:'))?.slice(6).trim();
            const raw = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('\n');
            if (!raw) continue;
            const data = JSON.parse(raw);
            if (kind === 'error') throw new Error(data.message);
            if (kind === 'done') complete = true;
            if (kind === 'delta') {
              const words = data.text.match(/\S+\s*|\s+/g) || [];
              for (const word of words) {
                if (abort.signal.aborted || requestId !== sequence.current) throw new DOMException('Aborted', 'AbortError');
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: m.text + word } : m));
                if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(r => setTimeout(r, 20));
              }
            }
          }
          if (done) break;
        }
        if (!complete) throw new Error('Connection interrupted. Please retry to get the complete reply.');
      } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
    } catch (e: any) {
      if (requestId === sequence.current) setError(abort.signal.aborted ? (abort.signal.reason === 'timeout' ? 'Reply timed out. Please retry.' : 'Reply stopped. You can retry or send another message.') : e.message || 'Unable to reply. Please retry.');
    } finally {
      clearTimeout(timer);
      if (requestId === sequence.current) { controller.current = null; setLoading(false); setMessages(prev => prev.filter(m => m.text.trim())); }
    }
  };
  const reset = () => { sequence.current++; controller.current?.abort(); controller.current = null; setLoading(false); setError(''); setConversation({ sessionId: newSession(), messages: initial }); };
  return { messages, setMessages, sessionId: conversation.sessionId, loading, error, send, reset, stop: () => controller.current?.abort() };
};