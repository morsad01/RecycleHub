import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { supabase } from '../lib/supabase';
import type { ChatbotMessage } from '../types';
import { AIService } from '../features/ai/services/aiService';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-reply`;

export function ChatbotWidget() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user && messages.length === 0) {
      loadHistory();
    }
  }, [open, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);
    if (data && data.length > 0) {
      setMessages(data as ChatbotMessage[]);
    } else {
      setMessages([{ id: 'welcome', user_id: user.id, role: 'assistant', content: t('chatbot.welcome'), created_at: new Date().toISOString() }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !user) return;
    const userMsg: ChatbotMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const content = input.trim();
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message: content, userId: user.id }),
      });

      if (!response.ok) throw new Error('Request failed');

      const data = await response.json();

      if (data.reply) {
        const assistantMsg: ChatbotMessage = {
          id: crypto.randomUUID(),
          user_id: user.id,
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch {
      try {
        const reply = await AIService.askChatbot(content);
        const assistantMsg: ChatbotMessage = {
          id: crypto.randomUUID(),
          user_id: user.id,
          role: 'assistant',
          content: reply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        // Persist history to database
        await supabase.from('chatbot_messages').insert([
          { user_id: user.id, role: 'user', content },
          { user_id: user.id, role: 'assistant', content: reply }
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), user_id: user.id, role: 'assistant', content: t('chatbot.unavailable'), created_at: new Date().toISOString() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Open chatbot"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] sm:w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col animate-scale-in border border-neutral-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-primary-500 rounded-t-2xl">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={18} />
              <span className="font-semibold text-sm">{t('chatbot.title')}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
            {messages.length === 0 && (
              <div className="text-center text-sm text-neutral-500 py-8">{t('chatbot.welcome')}</div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-white text-neutral-700 shadow-sm border border-neutral-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-neutral-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t('chatbot.placeholder')}
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
