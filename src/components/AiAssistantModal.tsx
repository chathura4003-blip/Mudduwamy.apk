import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Quote,
  BookOpen,
  CornerUpLeft,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { triggerHaptic } from '../utils/haptics';
import { copyToClipboard } from '../utils/clipboardHelper';
import { aiApi } from '../api';
import { aiProviderManager } from '../services/ai/AiProviderManager';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  replyTo?: {
    sender: 'ai' | 'user';
    text: string;
  };
}

// Helper Component for rendering beautifully formatted Dhamma & Pali AI text
const AiFormattedMessage: React.FC<{ text: string; isAi: boolean }> = ({ text, isAi }) => {
  if (!isAi) {
    return <p className="whitespace-pre-wrap leading-relaxed font-sans">{text}</p>;
  }

  const renderInline = (content: string) => {
    // Match both bold **text** and inline `code`
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong
            key={i}
            className="font-extrabold text-amber-950 dark:text-amber-100 bg-amber-400/25 dark:bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-400/40 dark:border-amber-500/30 mx-0.5 shadow-2xs"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300 bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let quoteBuffer: string[] = [];

  const flushQuoteBuffer = (keyIdx: number) => {
    if (quoteBuffer.length > 0) {
      elements.push(
        <div
          key={`quote-${keyIdx}`}
          className="my-3 p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/5 dark:from-amber-950/80 dark:via-stone-900 dark:to-amber-950/40 border-l-4 border-amber-500 rounded-r-2xl shadow-sm ring-1 ring-amber-400/20"
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden p-0.5">
              <img
                src="/pirivena-logo.svg"
                alt="Pirivena Emblem"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/pirivena-logo.png';
                }}
              />
            </div>
            <div className="font-serif italic text-amber-950 dark:text-amber-100 text-xs sm:text-sm leading-relaxed sm:leading-loose space-y-1.5 font-medium">
              {quoteBuffer.map((qLine, qIdx) => (
                <p key={qIdx}>{renderInline(qLine)}</p>
              ))}
            </div>
          </div>
        </div>
      );
      quoteBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('>')) {
      quoteBuffer.push(trimmed.replace(/^>\s*/, ''));
      return;
    } else if (quoteBuffer.length > 0) {
      flushQuoteBuffer(idx);
    }

    if (!trimmed) {
      elements.push(<div key={`blank-${idx}`} className="h-2" />);
      return;
    }

    // Heading tags (#, ##, ###)
    if (trimmed.startsWith('#')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <div
          key={`h-${idx}`}
          className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent dark:from-amber-950/70 dark:via-stone-900/50 dark:to-transparent px-3 py-1.5 rounded-xl border-l-4 border-amber-600 dark:border-amber-400 mt-3.5 mb-2 flex items-center gap-2 shadow-2xs"
        >
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
          <h4 className="font-serif font-black text-amber-950 dark:text-amber-200 text-xs sm:text-sm tracking-wide">
            {renderInline(headingText)}
          </h4>
        </div>
      );
      return;
    }

    // Bullet points (- or * or •)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const bulletContent = trimmed.replace(/^[-*•]\s+/, '');
      elements.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-2.5 my-1.5 pl-1.5 text-xs sm:text-sm">
          <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 mt-1.5 shrink-0 shadow-xs" />
          <div className="flex-1 leading-relaxed sm:leading-loose text-stone-800 dark:text-stone-200">
            {renderInline(bulletContent)}
          </div>
        </div>
      );
      return;
    }

    // Numbered lists (1., 2., etc)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${idx}`} className="flex items-start gap-2.5 my-2 pl-1 text-xs sm:text-sm">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            {numMatch[1]}
          </span>
          <div className="flex-1 leading-relaxed sm:leading-loose text-stone-800 dark:text-stone-200">
            {renderInline(numMatch[2])}
          </div>
        </div>
      );
      return;
    }

    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed sm:leading-loose text-xs sm:text-sm my-1 text-stone-800 dark:text-stone-200">
        {renderInline(line)}
      </p>
    );
  });

  if (quoteBuffer.length > 0) {
    flushQuoteBuffer(lines.length);
  }

  return <div className="space-y-1.5 font-serif text-stone-900 dark:text-amber-50">{elements}</div>;
};

interface SwipeableMessageBubbleProps {
  message: ChatMessage;
  onReply: (m: ChatMessage) => void;
  onSpeak: (id: string, text: string) => void;
  onCopy: (id: string, text: string) => void;
  speakingId: string | null;
  copiedId: string | null;
}

const SwipeableMessageBubble: React.FC<SwipeableMessageBubbleProps> = ({
  message,
  onReply,
  onSpeak,
  onCopy,
  speakingId,
  copiedId,
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startXRef.current;
    if (deltaX > 0 && deltaX < 85) {
      setDragX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > 35) {
      onReply(message);
    }
    setDragX(0);
  };

  return (
    <div
      className={`flex flex-col relative ${message.sender === 'user' ? 'items-end' : 'items-start'} select-none group/bubble`}
      onDoubleClick={() => onReply(message)}
    >
      {/* Revealed Swipe Reply Icon (WhatsApp style) */}
      {dragX > 5 && (
        <div
          className={`absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-150 z-10 ${
            dragX > 35
              ? 'bg-amber-500 text-stone-950 scale-110 ring-2 ring-amber-400 font-bold'
              : 'bg-stone-800 text-amber-300 scale-90 opacity-70'
          }`}
          style={{ opacity: Math.min(dragX / 35, 1) }}
        >
          <CornerUpLeft className="w-4 h-4" />
        </div>
      )}

      {/* Main Message Container with spring translation */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md relative group cursor-pointer ${
          message.sender === 'user'
            ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 rounded-tr-none font-sans border border-amber-600/50'
            : 'bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-500/25 text-stone-900 dark:text-amber-50 rounded-tl-none font-serif shadow-sm'
        }`}
      >
        {/* Quoted Reply Card Snippet inside Message */}
        {message.replyTo && (
          <div className="mb-2.5 p-2.5 rounded-xl bg-black/10 dark:bg-stone-950/80 border-l-4 border-amber-400 text-[11px] space-y-0.5 shadow-2xs">
            <span className="font-bold text-amber-200 dark:text-amber-300 flex items-center gap-1">
              <CornerUpLeft className="w-3 h-3 text-amber-400" />
              <span>
                {message.replyTo.sender === 'ai' ? 'පිරිවෙන් AI ධර්ම ශාස්ත්‍රඥ' : 'ඔබ'} ගේ පණිවිඩයට
                පිළිතුරක්:
              </span>
            </span>
            <p className="line-clamp-2 text-amber-100/90 dark:text-amber-200/80 italic font-sans">
              "{message.replyTo.text.slice(0, 110)}
              {message.replyTo.text.length > 110 ? '...' : ''}"
            </p>
          </div>
        )}

        {message.sender === 'ai' ? (
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center justify-between border-b border-amber-200/60 dark:border-amber-500/20 pb-1.5">
            <span className="flex items-center gap-1.5">
              <div className="w-4.5 h-4.5 rounded-full bg-amber-500/20 p-0.5 flex items-center justify-center shrink-0 overflow-hidden border border-amber-500/30">
                <img
                  src="/pirivena-logo.svg"
                  alt="Emblem"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pirivena-logo.png';
                  }}
                />
              </div>
              <span>පිරිවෙන් AI ධර්ම ශාස්ත්‍රඥ</span>
            </span>

            {/* Speech, Copy & Reply Action Tools */}
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(message);
                }}
                title="මෙම පණිවිඩයට පිළිතුරු දෙන්න (Reply)"
                className="p-1 rounded hover:bg-amber-100 dark:hover:bg-stone-800 text-amber-800 dark:text-amber-300 transition"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeak(message.id, message.text);
                }}
                title="අසා සිටින්න (Read Aloud)"
                className="p-1 rounded hover:bg-amber-100 dark:hover:bg-stone-800 text-amber-800 dark:text-amber-300 transition"
              >
                {speakingId === message.id ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(message.id, message.text);
                }}
                title="පිටපත් කරන්න (Copy)"
                className="p-1 rounded hover:bg-amber-100 dark:hover:bg-stone-800 text-amber-800 dark:text-amber-300 transition"
              >
                {copiedId === message.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          /* User Message Action Toolbar on Hover */
          <div className="absolute -top-3 right-3 hidden group-hover:flex items-center gap-1 bg-stone-900 border border-amber-600/40 px-2 py-0.5 rounded-full shadow-md text-amber-300 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
              }}
              title="මෙම පණිවිඩයට පිළිතුරු දෙන්න (Reply)"
              className="hover:text-amber-100 transition p-0.5 flex items-center gap-1 text-[10px]"
            >
              <CornerUpLeft className="w-3 h-3" />
              <span>Swipe / Click to Reply</span>
            </button>
          </div>
        )}

        <AiFormattedMessage text={message.text} isAi={message.sender === 'ai'} />

        <div
          className={`flex items-center justify-end gap-2 text-[10px] mt-2 ${message.sender === 'user' ? 'text-amber-200/80' : 'text-stone-400'}`}
        >
          <span className="opacity-0 group-hover:opacity-70 transition text-[9px] italic mr-auto">
            (Double-click or swipe right to reply)
          </span>
          <span>{message.time}</span>
        </div>
      </div>
    </div>
  );
};

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const toast = useToast();
  const isSi = language === 'si';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'ai',
      text:
        language === 'si'
          ? 'නමෝ බුද්ධාය! ශ්‍රී සුමන මහා පිරිවෙන් AI ධර්ම සහායකයා වෙත සාදරයෙන් පිළිගනිමු.\n\nපාලි ව්‍යාකරණ, ත්‍රිපිටකය, ප්‍රාචීන විභාග හෝ පිරිවෙන පිළිබඳව ඕනෑම ප්‍රශ්නයක් විමසන්න.'
          : 'Namo Buddhaya! Welcome to the Sri Sumana Pirivena AI Dharma Copilot.\n\nAsk any question regarding Pali Grammar, Tripitaka scriptures, Pracheena examinations, or Pirivena institutional studies.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [activeEngineBadge, setActiveEngineBadge] = useState<string>('🤖 Live OpenRouter AI');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = (delay = 50) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, delay);
  };

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = useState<number>(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Auto-scroll when messages update or AI starts loading
  useEffect(() => {
    if (isOpen) {
      scrollToBottom(50);
      scrollToBottom(200);
    }
  }, [isOpen, messages, loading]);

  const initialScreenHeightRef = useRef<number>(
    typeof window !== 'undefined' ? (window.screen?.height || window.innerHeight) : 800
  );

  useEffect(() => {
    if (!isOpen) return;

    if (!initialScreenHeightRef.current || initialScreenHeightRef.current < window.innerHeight) {
      initialScreenHeightRef.current = Math.max(window.screen?.height || 0, window.innerHeight || 0);
    }

    let rafId: number;
    const updateViewport = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const vh = vv ? vv.height : window.innerHeight;
        const offsetTop = vv ? vv.offsetTop : 0;
        const fullHeight = Math.max(
          initialScreenHeightRef.current,
          window.screen?.height || 0,
          window.screen?.availHeight || 0,
          window.outerHeight || 0,
          window.innerHeight || 0
        );
        const isKb = fullHeight - vh > 120 || (initialScreenHeightRef.current - vh > 120);
        setViewportHeight(vh);
        setViewportOffsetTop(offsetTop);
        setIsKeyboardOpen(isKb);

        if (isKb) {
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          });
        }
      });
    };

    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    // Capacitor Native Keyboard listeners
    let capKeyboardShowSub: any;
    let capKeyboardHideSub: any;
    try {
      const CapKeyboard = (window as any).Capacitor?.Plugins?.Keyboard;
      if (CapKeyboard) {
        capKeyboardShowSub = CapKeyboard.addListener('keyboardWillShow', (info: any) => {
          setIsKeyboardOpen(true);
          const currentVv = window.visualViewport
            ? window.visualViewport.height
            : (window.innerHeight - (info?.keyboardHeight || 280));
          setViewportHeight(currentVv);
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          });
        });
        capKeyboardHideSub = CapKeyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardOpen(false);
          setViewportHeight(window.innerHeight);
          setViewportOffsetTop(0);
        });
      }
    } catch (e) {}

    return () => {
      cancelAnimationFrame(rafId);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      try {
        capKeyboardShowSub?.remove?.();
        capKeyboardHideSub?.remove?.();
      } catch (e) {}
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('ai-assistant-active');
      scrollToBottom(30);

      // Auto-focus chat input field instantly for mobile and desktop keyboards
      const focusTimer = setTimeout(() => {
        const inputEl = document.getElementById('ai-chat-input');
        if (inputEl) {
          inputEl.focus({ preventScroll: true });
        }
      }, 100);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }

      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = '';
        document.body.style.overflowY = '';
        document.body.style.pointerEvents = '';
        document.body.classList.remove('ai-assistant-active');
      };
    } else {
      setViewportHeight(null);
      setIsKeyboardOpen(false);
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.pointerEvents = '';
      document.body.classList.remove('ai-assistant-active');
    }
  }, [isOpen]);

  // Handle ESC key to dismiss AI Modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setSpeakingId(null);
    };
  }, [isOpen]);

  const quickQuestions = isSi
    ? [
        {
          label: '☸ ත්‍රිපිටකය',
          prompt: 'ත්‍රිපිටකයේ ප්‍රධාන පිටක 3 සහ ඒවායේ අන්තර්ගතය කෙටියෙන් පැහැදිලි කරන්න.',
        },
        {
          label: '📜 පාලි ව්‍යාකරණ',
          prompt: 'පාලි භාෂාවේ ප්‍රධාන සන්ධි නීති උදාහරණ සමඟ පැහැදිලි කරන්න.',
        },
        { label: '📝 ප්‍රාචීන විභාගය', prompt: 'ප්‍රාචීන ප්‍රාරම්භ විභාගයේ ප්‍රධාන විෂයයන් මොනවාද?' },
        { label: '🏫 පිරිවෙනේ විස්තර', prompt: 'ශ්‍රී සුමන මහා පිරිවෙනේ ඉතිහාසය සහ තොරතුරු කියන්න.' },
      ]
    : [
        {
          label: '☸ Tripitaka',
          prompt: 'Briefly explain the 3 Pitakas of the Pali Canon and their core teachings.',
        },
        {
          label: '📜 Pali Grammar',
          prompt: 'Explain the essential Sandhi rules in classical Pali grammar with examples.',
        },
        { label: '📝 Pracheena Exams', prompt: 'What are the main subjects in the Pracheena Prarambha examinations?' },
        { label: '🏫 Pirivena Heritage', prompt: 'Tell me about the history and background of Sri Sumana Maha Pirivena.' },
      ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const currentReplyTarget = replyToMessage;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: currentReplyTarget
        ? { sender: currentReplyTarget.sender, text: currentReplyTarget.text }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setReplyToMessage(null);
    setLoading(true);
    scrollToBottom(50);

    // Keep mobile keyboard open by retaining input focus
    requestAnimationFrame(() => {
      const inputEl = document.getElementById('ai-chat-input');
      if (inputEl) inputEl.focus();
    });

    let promptPayload = query;
    if (currentReplyTarget) {
      promptPayload = `[පරිශීලකයා පහත සඳහන් මීට පෙර පණිවිඩයට පිළිතුරු සපයයි: "${currentReplyTarget.text.slice(0, 300)}"]\n\nනවතම ප්‍රශ්නය: ${query}`;
    }

    const PIRIVENA_AI_SYSTEM_INSTRUCTION = `ඔබ ශ්‍රී සුමන මහා පිරිවෙනෙහි (රත්නපුර මුද්දුව) නිල AI ධර්ම ශාස්ත්‍රඥ සහකාර (Sri Sumana Pirivena Dhamma AI Copilot) වේ.
ඔබගේ ප්‍රධාන වගකීම වන්නේ පිරිවෙන් අධ්‍යාපනය, ත්‍රිපිටක ධර්මය, පාලි සහ සංස්කෘත ව්‍යාකරණ, ප්‍රාචීන විභාග සහ බෞද්ධ දර්ශනය පිළිබඳව අසනු ලබන සියලුම ප්‍රශ්න සඳහා 100% ක් නිවැරදි, ගැඹුරු, විද්වත් සහ අතිශය ගෞරවනීය අයුරින් සම්පූර්ණයෙන්ම සිංහල භාෂාවෙන් (Sinhala) පිළිතුරු සැපයීමයි.

විශේෂ නීති:
1. සෑම විටම පිළිතුරු සම්පූර්ණයෙන්ම සිංහලෙන් සපයන්න.
2. බෞද්ධ භික්ෂූන් වහන්සේලා, ගුරු හිමිවරුන් සහ සාමණේර හිමිවරුන් අමතන විට 'තෙරුවන් සරණයි', 'ගෞරවනීය ස්වාමීන් වහන්ස', 'අවසරයි' වැනි ශාසනික ගෞරවාන්විත වචන භාවිත කරන්න.
3. පාලි ගාථා හෝ ව්‍යාකරණ සූත්‍ර උපුටා දක්වන විට පාලි පාඨය දක්වා ඊට යටින් පැහැදිලි සිංහල තේරුම සහ අර්ථ විවරණය ලියන්න.
4. ලැයිස්තු, අනුමාතෘකා සහ Bullet points භාවිත කර පිළිතුර ඉතා පැහැදිලිව කියවීමට පහසු වන සේ පෙළගස්වන්න.`;

    try {
      const data = await aiApi.chat(promptPayload, 'si');

      if (data && data.reply && data.reply.trim().length > 0) {
        if (data.source === 'openrouter') {
          setActiveEngineBadge(`🌐 OpenRouter AI (${data.model || 'gemini-2.5-flash'})`);
        } else if (data.source === 'gemini') {
          setActiveEngineBadge('♊ Google Gemini AI');
        } else {
          setActiveEngineBadge('☸ Pirivena Knowledge Engine');
        }

        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }
      throw new Error('Empty reply from cloud server');
    } catch (err) {
      // Fallback to client-side AiProviderManager with strict Sinhala instruction
      try {
        const clientRes = await aiProviderManager.executeCompletion({
          prompt: query,
          systemInstruction: PIRIVENA_AI_SYSTEM_INSTRUCTION,
        });

        if (clientRes && clientRes.text && clientRes.text.trim().length > 0) {
          setActiveEngineBadge('☸ Live Sinhala AI Engine (Client)');

          const fallbackMsg: ChatMessage = {
            id: 'ai-' + Date.now(),
            sender: 'ai',
            text: clientRes.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, fallbackMsg]);
          return;
        }
        throw new Error('Empty client AI completion');
      } catch (fallbackErr) {
        // Built-in Authoritative Sinhala Knowledge Engine Response
        const lowerQ = query.toLowerCase();
        let localSinhalaAnswer = '';

        if (lowerQ.includes('ත්‍රිපිටක') || lowerQ.includes('පිටක')) {
          localSinhalaAnswer = `☸ **නමෝ බුද්ධාය! ශ්‍රී සද්ධර්ම ත්‍රිපිටකය පිළිබඳ විවරණය:**\n\nත්‍රිපිටකය යනු බුදුරජාණන් වහන්සේ වසර 45ක් මුළුල්ලේ දේශනා කළ ධර්මස්කන්ධය ග්‍රන්ථාරූඪ කළ ප්‍රධාන කොටස් 3යි:\n\n1. **විනය පිටකය (භික්ෂු/භික්ෂුණී විනය නීති):**\n   - පාරාජිකා පාලි\n   - පාචිත්තිය පාලි\n   - මහාවග්ග පාලි\n   - චුල්ලවග්ග පාලි\n   - පරිවාර පාලි\n\n2. **සූත්‍ර පිටකය (දෛනික ජීවිතයට අදාළ ධර්ම දේශනා):**\n   - දීඝ නිකාය (දීර්ඝ සූත්‍ර 34)\n   - මජ්ඣිම නිකාය (මධ්‍යම ප්‍රමාණයේ සූත්‍ර 152)\n   - සංයුත්ත නිකාය (සූත්‍ර 7,762)\n   - අංගුත්තර නිකාය (අංක අනුව බෙදූ සූත්‍ර 9,557)\n   - ඛුද්දක නිකාය (ධම්මපදය, ජාතක පාලි ඇතුළු ග්‍රන්ථ 15)\n\n3. **අභිධර්ම පිටකය (පරමාර්ථ ධර්ම විග්‍රහය):**\n   - ධම්මසංගණී, විභංග, ධාතුකථා, පුග්ගලපඤ්ඤත්ති, කථාවත්ථු, යමක, පට්ඨාන යන ප්‍රකරණ 7 ඇතුළත් වේ.\n\nතෙරුවන් සරණයි!`;
        } else if (lowerQ.includes('පාලි') || lowerQ.includes('සන්ධි') || lowerQ.includes('ව්‍යාකරණ') || lowerQ.includes('විභක්ති')) {
          localSinhalaAnswer = `📜 **පාලි භාෂා ව්‍යාකරණ මූලධර්ම සහ සන්ධි නීති:**\n\nපාලි භාෂාවේ ප්‍රධාන සන්ධි කොටස් 3කි:\n\n1. **ස්වර සන්ධි (Vowel Sandhi):**\n   - පූර්ව ස්වරය ලොප් වීම: උදා. *යස්ස + ඉන්ද්‍රියානි = යස්සින්ද්‍රියානි*\n   - පර ස්වරය ලොප් වීම: උදා. *ඡායා + ඉව = ඡායාව*\n\n2. **ව්‍යඤ්ජන සන්ධි (Consonant Sandhi):**\n   - ව්‍යඤ්ජනයක් පර වූ විට ස්වරය දීර්ඝ හෝ හ්‍රස්ව වීම: උදා. *මුනි + චරෙ = මුනීචරෙ*\n\n3. **නිග්ගහීත සන්ධි (Niggahita Sandhi):**\n   - නිග්ගහීතය පර ව්‍යඤ්ජනයේ වග්ගාන්තයට පෙරළීම: උදා. *තං + ඛණං = තඞ්ඛණං*, *ධම්මං + චරෙ = ධම්මඤ්චරෙ*\n\n**පාලි විභක්ති 8:**\n- පඨමා (කර්තෘ), දුතියා (කර්ම), තතියා (කරණ), චතුත්ථී (සම්ප්‍රදාන), පඤ්චමී (අපදාන), ඡට්ඨී (සම්බන්ධ), සත්තමී (ආධාර), ආලපන (ආමන්ත්‍රණ).\n\nතෙරුවන් සරණයි!`;
        } else if (lowerQ.includes('ප්‍රාචීන') || lowerQ.includes('විභාග')) {
          localSinhalaAnswer = `📝 **ශ්‍රී ලංකා ප්‍රාචීන භාෂෝපකාර සමාගමේ ප්‍රාචීන විභාග මාලාව:**\n\nප්‍රාචීන විභාග යනු පිරිවෙන් අධ්‍යාපනයේ මූලික ශාස්ත්‍රීය විභාග ක්‍රමයයි:\n\n1. **ප්‍රාචීන ප්‍රාරම්භ විභාගය:**\n   - සිංහල භාෂාව හා සාහිත්‍යය\n   - පාලි භාෂාව හා ව්‍යාකරණ\n   - සංස්කෘත භාෂාව හා ව්‍යාකරණ\n   - බෞද්ධ ධර්මය හා ඉතිහාසය\n\n2. **ප්‍රාචීන මධ්‍යම විභාගය:**\n   - පාලි, සංස්කෘත හා සිංහල සාහිත්‍ය විචාර සහ ඡන්දස්/අලංකාර ශාස්ත්‍රය.\n\n3. **ප්‍රාචීන අවසාන (රාජකීය පණ්ඩිත) විභාගය:**\n   - සාර්ථකව සමත් වන විද්වත් හිමිවරුන්ට සහ ගිහි විද්වතුන්ට 'රාජකීය පණ්ඩිත (Panditha)' ගෞරව නාමය පිරිනැමේ.\n\nතෙරුවන් සරණයි!`;
        } else if (lowerQ.includes('සුමන') || lowerQ.includes('පිරිවෙන්') || lowerQ.includes('මුද්දුව') || lowerQ.includes('ඉතිහාස')) {
          localSinhalaAnswer = `🏛️ **ශ්‍රී සුමන මහා පිරිවෙන - රත්නපුර මුද්දුව:**\n\nශ්‍රී සුමන මහා පිරිවෙන යනු සබරගමු පළාතේ රත්නපුර මුද්දුව ඓතිහාසික පුදබිම කේන්ද්‍ර කරගනිමින් දශක ගණනාවක් පුරා ශාසනික සහ ශාස්ත්‍රීය මෙහෙවරක යෙදෙන ප්‍රමුඛ පෙළේ මහා පිරිවෙනකි.\n\n**ප්‍රධාන අංශ සහ පාඨමාලා:**\n- මූලික පිරිවෙන් අධ්‍යාපනය (1 ශ්‍රේණියේ සිට 5 ශ්‍රේණිය දක්වා)\n- සාමාන්‍ය පෙළ (O/L) හා උසස් පෙළ (A/L) කලා අංශය\n- ප්‍රාචීන ප්‍රාරම්භ, මධ්‍යම සහ අවසාන (රාජකීය පණ්ඩිත) අංශය\n- නේවාසික සාමණේර භික්ෂු හික්මවීම සහ ත්‍රිපිටක ධර්ම අධ්‍යයනය\n- ඩිජිටල් පුස්තකාල හා පරිගණක තාක්ෂණ අධ්‍යයන අංශය\n\nතෙරුවන් සරණයි!`;
        } else {
          localSinhalaAnswer = `☸ **තෙරුවන් සරණයි!**\n\nඔබගේ ප්‍රශ්නය: "${query}"\n\nශ්‍රී සුමන මහා පිරිවෙන් AI ධර්ම සහායකයා ලෙස මට ත්‍රිපිටක ධර්මය, පාලි/සංස්කෘත ව්‍යාකරණ, ප්‍රාචීන විභාග, බෞද්ධ ඉතිහාසය සහ පිරිවෙන් විෂය නිර්දේශ පිළිබඳව සවිස්තරාත්මකව පැහැදිලි කළ හැක.\n\nඔබට අවශ්‍ය නිශ්චිත ධර්ම කරුණක්, ගාථාවක තේරුමක් හෝ ව්‍යාකරණ ගැටලුවක් ඇත්නම් පහතින් විමසන්න.`;
        }

        setActiveEngineBadge('☸ Pirivena Knowledge Engine (Sinhala)');

        const fallbackMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: localSinhalaAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } finally {
      setLoading(false);
      scrollToBottom(50);
      scrollToBottom(250);
      requestAnimationFrame(() => {
        const inputEl = document.getElementById('ai-chat-input');
        if (inputEl) inputEl.focus();
      });
    }
  };



  const handleCopyText = async (id: string, text: string) => {
    try {
      const ok = await copyToClipboard(text);
      if (ok) {
        setCopiedId(id);
        toast.success(isSi ? '✓ AI පිළිතුර සාර්ථකව Copy විය!' : '✓ AI response copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        toast.error('පිටපත් කිරීමට නොහැකි විය.');
      }
    } catch (e) {
      toast.error('පිටපත් කිරීමට නොහැකි විය.');
    }
  };

  const cleanTextForSpeech = (rawText: string) => {
    return (
      rawText
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code ticks
        .replace(/`([^`]+)`/g, '$1')
        // Remove markdown images
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
        // Replace markdown links [text](url) with just text
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        // Remove headers (# Title, ## Subtitle)
        .replace(/^#+\s+/gm, '')
        // Remove blockquotes (> quote)
        .replace(/^>\s+/gm, '')
        // Remove horizontal rules
        .replace(/^[-*_]{3,}\s*$/gm, '')
        // Remove bullet points / list markers (* item, - item, + item, 1. item)
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        // Remove bold, italic, strikethrough (*, **, _, __, ~~)
        .replace(/(\*\*|__|\*|_|~~)/g, '')
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  };

  const handleSpeakText = (id: string, text: string) => {
    triggerHaptic('light');

    // If currently playing this message, stop it
    if (speakingId === id) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setSpeakingId(null);
      return;
    }

    // Stop any existing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch (_) {}
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    setSpeakingId(id);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.info(isSi ? 'ඔබගේ බ්‍රවුසරය හඬ ප්‍රකාශනයට (Text-to-Speech) සහය නොදක්වයි.' : 'Speech synthesis not supported.');
      setSpeakingId(null);
      return;
    }

    // Unmute/resume on mobile WebViews
    try {
      window.speechSynthesis.resume();
    } catch (_) {}

    const voices = window.speechSynthesis.getVoices() || [];
    
    // Find matching voice: Sinhala -> Indic -> Default
    let matchedVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes('si') ||
        v.lang.toLowerCase().includes('sin') ||
        v.name.toLowerCase().includes('sinhala')
    );

    if (!matchedVoice) {
      matchedVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('hi') ||
          v.lang.toLowerCase().includes('ta') ||
          v.lang.toLowerCase().includes('ne') ||
          v.lang.toLowerCase().includes('in')
      );
    }

    if (!matchedVoice) {
      matchedVoice = voices.find((v) => v.default) || voices[0];
    }

    // Chunk sentences for smooth sequential speech
    const sentences = cleanText
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) {
      sentences.push(cleanText);
    }

    let currentIdx = 0;

    const speakNext = () => {
      if (currentIdx >= sentences.length) {
        setSpeakingId(null);
        return;
      }

      const sentence = sentences[currentIdx++];
      const utterance = new SpeechSynthesisUtterance(sentence);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      if (matchedVoice?.lang) {
        utterance.lang = matchedVoice.lang;
      }
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        speakNext();
      };

      utterance.onerror = (e) => {
        console.warn('[Speech Utterance Error]:', e);
        speakNext();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('[Speech speak call failed]:', e);
        setSpeakingId(null);
      }
    };

    speakNext();
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'init-' + Date.now(),
        sender: 'ai',
        text: 'නමෝ බුද්ධාය! සංවාදය නැවත ආරම්භ කරන ලදී. ඔබට අවශ්‍ය ප්‍රශ්නය පහතින් අසන්න.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const modalJSX = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] no-safe-inset flex items-end sm:items-center justify-center bg-black/80 dark:bg-stone-950/90 overflow-hidden select-none p-0 sm:p-4 backdrop-blur-xs"
          style={
            isMobile && viewportHeight
              ? {
                  position: 'fixed',
                  top: `${viewportOffsetTop}px`,
                  left: 0,
                  right: 0,
                  bottom: 'auto',
                  width: '100vw',
                  height: `${viewportHeight}px`,
                  maxHeight: `${viewportHeight}px`,
                }
              : undefined
          }
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
      <motion.div
        initial={{ opacity: 0, y: isMobile ? 40 : 20, scale: isMobile ? 1 : 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: isMobile ? 40 : 20, scale: isMobile ? 1 : 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        style={
          isMobile && viewportHeight
            ? {
                height: `${viewportHeight}px`,
                maxHeight: `${viewportHeight}px`,
              }
            : undefined
        }
        className="bg-white dark:bg-stone-900 border-0 sm:border border-amber-300/80 dark:border-amber-500/30 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-2xl h-full sm:h-[640px] max-h-full sm:max-h-[88vh] overflow-hidden flex flex-col ring-0 sm:ring-1 ring-amber-400/20"
      >
        {/* Dynamic Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-stone-900 dark:from-stone-950 dark:via-amber-950 dark:to-stone-950 text-white pt-safe px-3.5 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b border-amber-600/30 shadow-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-stone-900 rounded-[14px] p-1 flex items-center justify-center overflow-hidden">
                <img
                  src="/pirivena-logo.svg"
                  alt="ශ්‍රී සුමන මහා පිරිවෙණ ලාංඡනය"
                  className="w-full h-full object-contain pointer-events-none transform-gpu"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src && !target.src.endsWith('/pirivena-logo.png')) {
                      target.src = '/pirivena-logo.png';
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-amber-100 text-sm sm:text-lg flex items-center gap-1.5 flex-wrap">
                <span>{isSi ? 'AI ධර්ම සහායකයා' : 'AI Dharma Copilot'}</span>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-500/40 font-bold truncate max-w-[140px] sm:max-w-none">
                  {activeEngineBadge}
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-amber-300/80 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{isSi ? 'ශ්‍රී සුමන මහා පිරිවෙන • රත්නපුර' : 'Sri Sumana Maha Pirivena • Ratnapura'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleClear}
              title={isSi ? 'නැවුම් කරන්න' : 'Reset Conversation'}
              className="p-1.5 sm:p-2 rounded-xl text-amber-300 hover:text-white hover:bg-amber-800/60 dark:hover:bg-amber-900/60 transition text-xs flex items-center gap-1 border border-amber-700/40 bg-stone-900/40 cursor-pointer group"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-rotate-180 transition-transform duration-500" />
            </button>
            <button
              id="close-ai-modal-btn"
              onClick={onClose}
              title={isSi ? 'වසන්න' : 'Close'}
              className="p-1.5 sm:p-2 rounded-xl text-amber-200 hover:text-white hover:bg-amber-800/80 dark:hover:bg-amber-900/80 transition border border-amber-700/30 cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="bg-amber-50/70 dark:bg-stone-950/70 p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto border-b border-amber-200/60 dark:border-amber-900/40 text-xs shrink-0 scrollbar-none">
          <span className="text-amber-900 dark:text-amber-400 font-bold shrink-0 flex items-center gap-1 text-[11px] sm:text-xs">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-icon-sparkle" /> {isSi ? 'යෝජිත:' : 'Suggested:'}
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q.prompt)}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-300/80 dark:border-amber-500/30 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/80 transition whitespace-nowrap font-medium text-[11px] sm:text-xs shadow-2xs cursor-pointer shrink-0"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Message Body Stream */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto overscroll-y-contain space-y-3 sm:space-y-4 bg-stone-50 dark:bg-stone-950">
          {messages.map((m) => (
            <SwipeableMessageBubble
              key={m.id}
              message={m}
              onReply={(targetMsg) => {
                setReplyToMessage(targetMsg);
                const inputEl = document.getElementById('ai-chat-input');
                if (inputEl) inputEl.focus();
              }}
              onSpeak={handleSpeakText}
              onCopy={handleCopyText}
              speakingId={speakingId}
              copiedId={copiedId}
            />
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 text-xs italic bg-amber-100/80 dark:bg-stone-900 border border-amber-300 dark:border-amber-500/30 p-3 rounded-2xl w-fit animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
              <span>{isSi ? 'පිළිතුර සකසමින් පවතී...' : 'Generating response...'}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Quoted Reply Preview Bar */}
        {replyToMessage && (
          <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-100/90 dark:bg-stone-950 border-t border-amber-300 dark:border-amber-700/60 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 overflow-hidden pr-2">
              <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
                <CornerUpLeft className="w-3 h-3" />
              </div>
              <div className="truncate text-[11px] sm:text-xs">
                <span className="font-bold text-amber-950 dark:text-amber-300 mr-1">
                  {replyToMessage.sender === 'ai' ? (isSi ? 'AI ධර්ම ශාස්ත්‍රඥ' : 'AI Copilot') : (isSi ? 'ඔබ' : 'You')}:
                </span>
                <span className="italic text-stone-700 dark:text-amber-200/80">
                  "{replyToMessage.text.slice(0, 60)}..."
                </span>
              </div>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="p-1 rounded-full hover:bg-amber-200 dark:hover:bg-stone-800 text-stone-600 dark:text-amber-400 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Adaptive Text Input Bar */}
        <div
          className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 ${
            isKeyboardOpen ? 'pb-1.5' : 'pb-safe'
          } bg-white dark:bg-stone-900 border-t border-amber-200 dark:border-amber-500/20 flex items-center gap-2 shrink-0`}
        >
          <input
            name="input"
            id="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onFocus={() => {
              setIsKeyboardOpen(true);
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 250);
            }}
            onBlur={() => {
              setTimeout(() => {
                const isStillFocused = document.activeElement?.id === 'ai-chat-input';
                if (!isStillFocused) {
                  setIsKeyboardOpen(false);
                }
              }, 200);
            }}
            autoComplete="off"
            autoCorrect="off"
            placeholder={
              isSi
                ? 'පාලි, ත්‍රිපිටක ධර්මය හෝ ව්‍යාකරණ පිළිබඳව ප්‍රශ්න අසන්න...'
                : 'Ask any question about Pali, Tripitaka, or Pirivena studies...'
            }
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-amber-300 dark:border-amber-700 text-base sm:text-sm text-stone-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/40 dark:bg-stone-950 font-serif"
          />
          <button
            id="ai-chat-send-btn"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-amber-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-lg shadow-amber-500/25 border border-amber-300 disabled:opacity-40 cursor-pointer shrink-0 active:scale-95"
          >
            <span>{isSi ? 'අසන්න' : 'Send'}</span>
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-950 font-bold" />
          </button>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalJSX, document.body) : modalJSX;
};
