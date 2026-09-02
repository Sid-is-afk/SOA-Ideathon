import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/apiClient';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Trash2,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Compass
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface KarwaanChatbotProps {
  role: 'shipper' | 'agent' | 'business';
  contextData?: any;
}

export const KarwaanChatbot: React.FC<KarwaanChatbotProps> = ({ role, contextData }) => {
  const { language, t, currentLanguageOption } = useLanguage();
  const normalizedRole: 'shipper' | 'agent' = role === 'agent' ? 'agent' : 'shipper';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize initial greeting when role or language changes if message history is empty
  const getInitialGreeting = () => {
    const text = normalizedRole === 'shipper'
      ? t('chatbot.welcomeShipper', 'Hello! I am your Karwaan Logistics Advisor. How can I assist you with cold-chain routing, freight savings, or shelf-life metrics today?')
      : t('chatbot.welcomeDriver', 'Captain, I am your Fleet Dispatch Officer. Ready to assist with pre-cooling setpoints (+2.0°C to +4.0°C), stop sequences, and incident reporting.');
    
    return {
      id: 'init-1',
      sender: 'assistant' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  useEffect(() => {
    // If no messages or only 1 default message, refresh initial greeting with current language
    if (messages.length <= 1) {
      setMessages([getInitialGreeting()]);
    }
  }, [language, normalizedRole]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Build history for context
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const res = await apiClient.post('/chat', {
        message: messageContent,
        role: normalizedRole,
        language: language,
        history,
        context: contextData || {},
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res?.reply || t('chatbot.connecting', 'Response received.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (!isOpen) setHasUnread(true);
    } catch (err: any) {
      console.error('[Chatbot] Failed to send message:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Connection Issue**: Could not reach the Karwaan dispatch server (${err?.message || 'Network error'}). Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([getInitialGreeting()]);
  };

  // Quick Action Prompt Chips
  const promptChips = normalizedRole === 'shipper' ? [
    { label: t('chatbot.chipShipper1', 'Explain Freshness Index'), query: t('chatbot.chipShipper1', 'Explain Freshness Index') },
    { label: t('chatbot.chipShipper2', 'Why was multimodal rail selected?'), query: t('chatbot.chipShipper2', 'Why was multimodal rail selected?') },
    { label: t('chatbot.chipShipper3', 'How does cold consolidation reduce costs?'), query: t('chatbot.chipShipper3', 'How does cold consolidation reduce costs?') },
    { label: t('chatbot.chipShipper4', 'What happens if temperature exceeds threshold?'), query: t('chatbot.chipShipper4', 'What happens if temperature exceeds threshold?') },
  ] : [
    { label: t('chatbot.chipDriver1', 'How do I report compressor failure?'), query: t('chatbot.chipDriver1', 'How do I report compressor failure?') },
    { label: t('chatbot.chipDriver2', 'What are my temperature bounds?'), query: t('chatbot.chipDriver2', 'What are my temperature bounds?') },
    { label: t('chatbot.chipDriver3', 'How do I complete sequence stops?'), query: t('chatbot.chipDriver3', 'How do I complete sequence stops?') },
    { label: t('chatbot.chipDriver4', 'What to do during route traffic delay?'), query: t('chatbot.chipDriver4', 'What to do during route traffic delay?') },
  ];

  // Helper for rendering simple markdown styling (headers, bold, bullets, backticks)
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
        {lines.map((line, idx) => {
          let trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Header ###
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-[#163832] text-sm sm:text-base mt-2 mb-1 flex items-center gap-1.5 border-b border-gray-200 pb-1">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          // Bullet points - or *
          const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
          const isNumber = /^\d+\.\s/.test(trimmed);

          let displayLine = trimmed;
          if (isBullet) displayLine = trimmed.substring(2);
          if (isNumber) displayLine = trimmed.replace(/^\d+\.\s/, '');

          // Process bold **text** and code `code`
          const parts = displayLine.split(/(\*\*.*?\*\*|`.*?`)/g);

          const formattedContent = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-[#163832]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx} className="font-mono bg-black/10 px-1 py-0.5 rounded text-[11px] text-[#B3462C]">{part.slice(1, -1)}</code>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="text-[#5C7A50] font-bold text-base leading-none mt-0.5">&bull;</span>
                <div className="flex-1">{formattedContent}</div>
              </div>
            );
          }

          if (isNumber) {
            const numMatch = trimmed.match(/^(\d+)\./);
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="text-[#D98E2B] font-mono font-bold text-xs shrink-0 mt-0.5">{numMatch ? numMatch[1] : '1'}.</span>
                <div className="flex-1">{formattedContent}</div>
              </div>
            );
          }

          return <p key={idx}>{formattedContent}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Action Button (Docked Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#163832] via-[#245249] to-[#5C7A50] text-white shadow-[0_8px_25px_rgba(22,56,50,0.35)] hover:shadow-[0_12px_30px_rgba(22,56,50,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/30 cursor-pointer"
            aria-label="Open Karwaan AI Assistant"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-25" />
            <div className="relative flex items-center justify-center">
              {normalizedRole === 'shipper' ? (
                <Sparkles className="w-7 h-7 text-[#D98E2B] group-hover:rotate-12 transition-transform duration-300" />
              ) : (
                <Compass className="w-7 h-7 text-[#D98E2B] group-hover:rotate-45 transition-transform duration-300" />
              )}
            </div>

            {/* Unread badge dot */}
            {hasUnread && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#B3462C] border-2 border-white rounded-full animate-bounce" />
            )}

            {/* Tooltip Tag */}
            <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#163832] text-white text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block border border-[#5C7A50]/40">
              {normalizedRole === 'shipper' ? t('chatbot.advisorTitle', 'Karwaan Logistics Advisor') : t('chatbot.dispatchTitle', 'Karwaan Dispatch Officer')} ({currentLanguageOption.flag})
            </span>
          </button>
        </div>
      )}

      {/* Expanded Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[1000] w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] h-[580px] max-h-[85vh] bg-[#F8FAF7] border border-[#D6DCD4] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#163832] via-[#204a43] to-[#245249] text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner text-[#D98E2B]">
                {normalizedRole === 'shipper' ? <Bot className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-base text-white tracking-tight">
                    {normalizedRole === 'shipper' ? t('chatbot.advisorTitle', 'Logistics Advisor') : t('chatbot.dispatchTitle', 'Dispatch Officer')}
                  </h3>
                  <span className="bg-[#D98E2B] text-[#163832] text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                    {currentLanguageOption.code.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 font-sans truncate max-w-[200px]">
                  {normalizedRole === 'shipper' ? t('chatbot.advisorSubtitle', 'Cold-Chain Intelligence') : t('chatbot.dispatchSubtitle', 'Live Telemetry & SOPs')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              <button
                type="button"
                onClick={handleClearChat}
                title={t('chatbot.clearChat', 'Clear chat')}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-[#F8FAF7]">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm border ${
                      isUser
                        ? 'bg-[#5C7A50] text-white border-[#435A3A]'
                        : 'bg-[#163832] text-[#D98E2B] border-white/20'
                    }`}
                  >
                    {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                      isUser
                        ? 'bg-[#163832] text-white rounded-tr-none'
                        : 'bg-white border border-[#E5EBE3] text-[#1A211E] rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      renderMarkdown(msg.text)
                    )}
                    <div
                      className={`text-[9px] font-mono mt-1 text-right ${
                        isUser ? 'text-white/60' : 'text-gray-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#163832] text-[#D98E2B] flex items-center justify-center text-xs shrink-0 shadow-sm border border-white/20">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-[#E5EBE3] rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5C7A50] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-[#D98E2B] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-[#163832] animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Prompt Chips */}
          <div className="bg-white border-t border-[#E5EBE3] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {promptChips.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(chip.query)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1.5 rounded-full bg-[#F3F5F2] hover:bg-[#E5EBE3] text-[#163832] border border-[#D6DCD4] text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-[#E5EBE3] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatbot.inputPlaceholder', 'Ask a question in your preferred language...')}
              disabled={isLoading}
              className="flex-1 bg-[#F8FAF7] border border-[#D6DCD4] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1A211E] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5C7A50] focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#163832] hover:bg-[#0F2622] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Micro Footer Disclaimer */}
          <div className="bg-[#F8FAF7] px-3 py-1 text-center border-t border-gray-100">
            <span className="text-[9px] text-gray-400 font-mono">
              {t('chatbot.disclaimer', 'AI routing & dispatch recommendations based on real-time telemetry.')}
            </span>
          </div>

        </div>
      )}
    </>
  );
};
