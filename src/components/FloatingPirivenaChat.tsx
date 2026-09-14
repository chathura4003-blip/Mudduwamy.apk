import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Clock,
  Trash2,
  Smile,
  Shield,
  GraduationCap,
  Crown,
  UserCheck,
  CheckCheck,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  Download,
  Eye,
  Pin,
  Search,
  MoreVertical,
  Reply,
  CornerDownRight,
  Info,
  Lock,
  PhoneCall,
  Video,
  Mic,
  Plus,
  Sparkles,
  Heart,
  SmilePlus,
  Copy,
  Check,
  AlertTriangle,
  Volume2,
  VolumeX,
  PinOff,
  Users,
} from 'lucide-react';
import type { User, ChatMessage, ChatReaction } from '../types';
import { copyToClipboard } from '../utils/clipboardHelper';
import { navigationHistoryManager } from '../services/navigationHistoryManager';
import { chatApi } from '../api/chatApi';
import { uploadApi } from '../api/uploadApi';
import { triggerHaptic } from '../utils/haptics';
import { playNotificationSound } from '../utils/soundHelper';
import { formatSriLankaDate, formatSriLankaTime } from '../utils/sriLankaTime';
import { openInAppFileViewer } from '../utils/pdfHelper';
import { appLifecycleManager } from '../services/appLifecycleManager';
import { notificationService } from '../services/notificationService';
import { oneSignalService } from '../services/oneSignalService';
import { getUserNotificationSettings } from '../utils/userNotificationSettings';
import { getImageUrl } from '../utils/imageHelper';
import { getMediaUrl } from '../api/apiClient';

interface FloatingPirivenaChatProps {
  user: User | null;
  isHidden?: boolean;
}

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '☸️', '🪷', '🔥'];

const PRO_EMOJI_CATEGORIES = [
  {
    id: 'blessings',
    name: '🪷 ආශිර්වාද & පිරිවෙන',
    emojis: ['🙏', '☸️', '🪷', '🕯️', '📜', '🔔', '🌿', '🪔', '🥥', '🧘‍♂️', '✨', '⭐'],
  },
  {
    id: 'smileys',
    name: '😊 සිනහව & හැඟීම්',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
      '😇', '🥰', '😍', '🤩', '😘', '😋', '😛', '😜', '🤪', '😎', '🥳', '😏',
      '🤔', '🤫', '🫡', '🤗', '🤝', '🙌', '🤐', '🤨', '😐', '😑', '😶', '😴'
    ],
  },
  {
    id: 'gestures',
    name: '👍 අත් සංඥා & පැසසුම්',
    emojis: [
      '👍', '👎', '👏', '🙌', '👐', '🤲', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
      '👉', '👆', '👇', '👑', '💯', '🔥', '🎉', '🎈', '💪', '🏆', '🎯', '🚀'
    ],
  },
  {
    id: 'academic',
    name: '📚 අධ්‍යයන & සටහන්',
    emojis: [
      '📚', '📖', '📝', '✏️', '🎓', '🥇', '🥈', '🥉', '🎯', '💡', '🔬', '📌',
      '📋', '📊', '📈', '🖋️', '📅', '🕒', '💻', '🎨', '📐', '🧠', '💼', '🏆'
    ],
  },
  {
    id: 'hearts',
    name: '❤️ හදවත් & සංකේත',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💖', '💗', '💓',
      '💞', '💕', '❣️', '🪄', '🍀', '🌟', '💫', '⚡', '☀️', '🌈', '🌺', '🌸'
    ],
  },
];

export const FloatingPirivenaChat: React.FC<FloatingPirivenaChatProps> = ({ user, isHidden = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const [currentSubTab, setCurrentSubTab] = useState<string>(() => {
    try {
      return (
        sessionStorage.getItem('pirivena_student_tab') ||
        sessionStorage.getItem('pirivena_teacher_tab') ||
        sessionStorage.getItem('pirivena_admin_tab') ||
        'overview'
      );
    } catch {
      return 'overview';
    }
  });

  // Track active sub-tab (Overview, Timetable, Exams, etc.)
  useEffect(() => {
    const handleSubTabSwitch = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        setCurrentSubTab(e.detail.toLowerCase());
      }
    };
    window.addEventListener('switch-portal-subtab', handleSubTabSwitch);
    return () => window.removeEventListener('switch-portal-subtab', handleSubTabSwitch);
  }, []);

  // Register with Android Back Button Stack when Chat window is open
  useEffect(() => {
    if (isOpen) {
      navigationHistoryManager.pushModal('pirivena_floating_chat', () => setIsOpen(false), 25);
    } else {
      navigationHistoryManager.removeModal('pirivena_floating_chat');
    }
    return () => navigationHistoryManager.removeModal('pirivena_floating_chat');
  }, [isOpen]);

  const isOnOverviewTab = useMemo(() => {
    const t = currentSubTab.trim().toLowerCase();
    return t === 'overview' || t === 'dashboard' || t === 'home' || t === '';
  }, [currentSubTab]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showComposerEmojiPicker, setShowComposerEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ file: File; preview?: string } | null>(null);

  // Long-Press / Tap-and-Hold Selection State
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Modal Confirmation State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive?: boolean;
    icon?: string;
    onConfirm: () => void;
  } | null>(null);

  // Reaction State
  const [reactionTargetMessageId, setReactionTargetMessageId] = useState<string | null>(null);
  const [showFullEmojiModal, setShowFullEmojiModal] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('all');
  const [emojiSearchTerm, setEmojiSearchTerm] = useState<string>('');

  // Mobile Keyboard & Dynamic Viewport Height States
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = useState<number>(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);

  // Mute Notifications State (Feature 6)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pirivena_chat_muted') === 'true';
    } catch {
      return false;
    }
  });
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Pinned Message Carousel State (Feature 1)
  const [activePinnedIndex, setActivePinnedIndex] = useState<number>(0);

  // Typing Activity State (Feature 5)
  const [isTypingActive, setIsTypingActive] = useState<boolean>(false);
  const typingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const pollIntervalRef = useRef<any>(null);
  const lastMsgCountRef = useRef<number>(0);
  const longPressTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Available Rooms (WhatsApp Chat Groups)
  const availableRooms = useMemo(() => {
    const rooms = [
      {
        id: 'general',
        name: 'ශ්‍රී සුමන පොදු ශාලාව (General)',
        shortName: 'පොදු ශාලාව',
        icon: '📢',
        desc: 'පරිපාලක, ගුරු හා සිසු සැමට පොදුයි',
        avatarBg: 'bg-emerald-700',
        allowed: true,
      },
    ];

    if (user?.role === 'student') {
      const classId = user.classId || (user as any).className || 'class_room';
      const className = (user as any).className || (user as any).class || 'මගේ පන්තිය';
      rooms.push({
        id: `class_${classId}`,
        name: `🏫 ${className} (Class Group)`,
        shortName: `${className}`,
        icon: '🏫',
        desc: 'ඔබගේ පන්තියේ අධ්‍යයන සාකච්ඡා',
        avatarBg: 'bg-amber-700',
        allowed: true,
      });
    } else if (user?.role === 'teacher') {
      rooms.push(
        {
          id: 'staff_lounge',
          name: '👨‍🏫 ආචාර්ය මණ්ඩලය (Staff Lounge)',
          shortName: 'ආචාර්ය මණ්ඩලය',
          icon: '🏛️',
          desc: 'ගුරුභවතුන් හා පරිපාලන රහස්‍ය සාකච්ඡා',
          avatarBg: 'bg-indigo-700',
          allowed: true,
        },
        {
          id: 'class_general',
          name: '🏫 පන්ති සාකච්ඡා (Class Hub)',
          shortName: 'පන්ති සාකච්ඡා',
          icon: '📚',
          desc: 'පන්ති අධ්‍යයන කටයුතු',
          avatarBg: 'bg-amber-700',
          allowed: true,
        }
      );
    } else if (user?.role === 'admin' || user?.role === 'superadmin') {
      rooms.push(
        {
          id: 'staff_lounge',
          name: '👨‍🏫 ආචාර්ය මණ්ඩලය (Staff Lounge)',
          shortName: 'ආචාර්ය මණ්ඩලය',
          icon: '🏛️',
          desc: 'පරිපාලක හා ගුරුභවතුන්ගේ රහස්‍ය කාමරය',
          avatarBg: 'bg-indigo-700',
          allowed: true,
        },
        {
          id: 'class_general',
          name: '🏫 පන්ති අධීක්ෂණය (Class Monitor)',
          shortName: 'පන්ති අධීක්ෂණය',
          icon: '🏫',
          desc: 'පන්ති සාකච්ඡා නිරීක්ෂණය',
          avatarBg: 'bg-amber-700',
          allowed: true,
        }
      );
    }

    return rooms;
  }, [user]);

  // Check if current user is Teacher, Staff, Admin, or Superadmin
  const isTeacherOrAdmin = useMemo(() => {
    if (!user) return false;
    const r = user.role?.toLowerCase();
    return (
      r === 'admin' ||
      r === 'superadmin' ||
      r === 'teacher' ||
      r === 'staff' ||
      Boolean((user as any).teacherId) ||
      Boolean((user as any).teacherAssignments)
    );
  }, [user]);

  const activeRoom = availableRooms.find((r) => r.id === activeRoomId) || availableRooms[0];

  const initialScreenHeightRef = useRef<number>(
    typeof window !== 'undefined' ? (window.screen?.height || window.innerHeight) : 800
  );

  // Track open state on document.body for global bottom-bar and modal coordination
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('pirivena-chat-active');
      navigationHistoryManager.pushModal('floating_chat', () => setIsOpen(false), 30);
    } else {
      document.body.classList.remove('pirivena-chat-active');
      navigationHistoryManager.removeModal('floating_chat');
    }
    return () => {
      document.body.classList.remove('pirivena-chat-active');
      navigationHistoryManager.removeModal('floating_chat');
    };
  }, [isOpen]);

  useEffect(() => {
    if (showFullEmojiModal) {
      navigationHistoryManager.pushModal('chat_emoji_modal', () => setShowFullEmojiModal(false), 35);
    } else {
      navigationHistoryManager.removeModal('chat_emoji_modal');
    }
    return () => navigationHistoryManager.removeModal('chat_emoji_modal');
  }, [showFullEmojiModal]);

  useEffect(() => {
    if (confirmDialog?.isOpen) {
      navigationHistoryManager.pushModal('chat_confirm_dialog', () => setConfirmDialog(null), 40);
    } else {
      navigationHistoryManager.removeModal('chat_confirm_dialog');
    }
    return () => navigationHistoryManager.removeModal('chat_confirm_dialog');
  }, [confirmDialog?.isOpen]);

  // Dynamic Virtual Keyboard & Visual Viewport Handler (Active ONLY when chat is open)
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    if (!initialScreenHeightRef.current || initialScreenHeightRef.current < window.innerHeight) {
      initialScreenHeightRef.current = Math.max(window.screen?.height || 0, window.innerHeight || 0);
    }

    let rafId: number;
    const handleViewportChange = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const vvHeight = vv ? vv.height : window.innerHeight;
        const offsetTop = vv ? vv.offsetTop : 0;
        const fullHeight = Math.max(
          initialScreenHeightRef.current,
          window.screen?.height || 0,
          window.screen?.availHeight || 0,
          window.outerHeight || 0,
          window.innerHeight || 0
        );
        const isKb = fullHeight - vvHeight > 120 || (initialScreenHeightRef.current - vvHeight > 120);
        setViewportHeight(vvHeight);
        setViewportOffsetTop(offsetTop);
        setIsKeyboardOpen(isKb);

        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
      });
    };

    handleViewportChange();
    window.visualViewport?.addEventListener('resize', handleViewportChange, { passive: true });
    window.visualViewport?.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });

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
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
      try {
        capKeyboardShowSub?.remove?.();
        capKeyboardHideSub?.remove?.();
      } catch (e) {}
    };
  }, [isOpen]);

  // Fetch messages for active room with shallow diffing to prevent lag/re-render stutter
  const loadMessages = useCallback(
    async (isBackground = false) => {
      if (!user || typeof window === 'undefined') return;
      const token = localStorage.getItem('pirivena_token');
      if (!token) return; // Strict session guard

      try {
        const msgs = await chatApi.getMessages(activeRoomId);
        
        setMessages((prev) => {
          if (
            prev.length === msgs.length &&
            prev[prev.length - 1]?.id === msgs[msgs.length - 1]?.id &&
            prev[prev.length - 1]?.is_pinned === msgs[msgs.length - 1]?.is_pinned &&
            prev[0]?.id === msgs[0]?.id
          ) {
            return prev; // No state change -> 0 re-renders
          }
          return msgs;
        });

        const userSettings = getUserNotificationSettings(user.id);
        if (!isOpenRef.current && isBackground && msgs.length > lastMsgCountRef.current && !isMutedRef.current && userSettings.chatNotifications) {
          const diff = msgs.length - lastMsgCountRef.current;
          setUnreadCount((prev) => prev + diff);

          // Find latest message sent by other participants
          const latestOtherMsg = [...msgs].reverse().find((m) => m.sender_id !== user.id);
          if (latestOtherMsg && localStorage.getItem('pirivena_token')) {
            const senderTitle = latestOtherMsg.sender_name || 'පිරිවෙන් සාමාජික';
            const roomObj = availableRooms.find((r) => r.id === activeRoomId);
            const roomTitle = roomObj ? roomObj.shortName : '';

            // 🌟 WhatsApp-Style Title: "💬 6A පන්තිය: කසුන් පෙරේරා" or "👤 කසුන් පෙරේරා"
            const notifTitle =
              roomTitle && activeRoomId !== 'general'
                ? `💬 ${roomTitle}: ${senderTitle}`
                : `👤 ${senderTitle}`;

            // 🌟 WhatsApp-Style Body: True message text or photo/document label
            let messagePreview = latestOtherMsg.content?.trim() || '';
            if (
              latestOtherMsg.message_type === 'image' ||
              latestOtherMsg.attachment_url?.match(/\.(jpeg|jpg|png|webp|gif)$/i)
            ) {
              messagePreview = latestOtherMsg.content?.trim()
                ? `📷 ${latestOtherMsg.content.trim()}`
                : '📷 ඡායාරූපයක් (Photo)';
            } else if (latestOtherMsg.message_type === 'file' || latestOtherMsg.attachment_url) {
              messagePreview = `📄 ${latestOtherMsg.attachment_name || 'ලේඛනයක් (Document)'}`;
            } else if (!messagePreview) {
              messagePreview = 'නව පණිවිඩයක්';
            }

            // Only fire duplicate LocalNotification if native OneSignal push is NOT enabled/available
            if (!oneSignalService.isAvailable()) {
              notificationService.scheduleNotification({
                title: notifTitle,
                body: messagePreview,
                channelId: 'pirivena_chat_channel',
                sound: true,
                stableKey: `chat_msg_${latestOtherMsg.id}`,
                extra: {
                  type: 'chat_message',
                  roomId: activeRoomId,
                  senderId: latestOtherMsg.sender_id,
                  senderName: latestOtherMsg.sender_name,
                },
              });
            }
          }
        }

        lastMsgCountRef.current = msgs.length;
      } catch (err) {
        console.warn('Error loading chat messages:', err);
      }
    },
    [activeRoomId, user]
  );

  // Deep-link listener: Open chat when notification is tapped
  useEffect(() => {
    const handleOpenFromNotification = (e: any) => {
      const detail = e.detail;
      if (detail?.roomId) {
        setActiveRoomId(detail.roomId);
      }
      setIsOpen(true);
      triggerHaptic('medium');
    };

    window.addEventListener('open-pirivena-chat', handleOpenFromNotification);
    return () => window.removeEventListener('open-pirivena-chat', handleOpenFromNotification);
  }, []);

  // Polling setup: 3s when open, 10s when closed (auto-pauses on background)
  useEffect(() => {
    if (!user) return;
    loadMessages(false);

    const pollRate = isOpen ? 4000 : 30000;
    const cleanupPoll = appLifecycleManager.registerPollTask(
      'pirivena_chat_poll',
      () => loadMessages(true),
      pollRate,
      { runImmediately: false, runImmediatelyOnResume: true, allowBackground: true, backgroundIntervalMs: 15000 }
    );

    return () => {
      cleanupPoll();
    };
  }, [isOpen, activeRoomId, loadMessages, user]);

  // Scroll to bottom when messages update or open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      setUnreadCount(0);
    }
  }, [isOpen, messages.length, activeRoomId]);

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        m.sender_name?.toLowerCase().includes(q) ||
        m.attachment_name?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  // Filtered Emojis for Full Modal
  const displayedEmojis = useMemo(() => {
    let list: string[] = [];
    if (selectedEmojiCategory === 'all') {
      PRO_EMOJI_CATEGORIES.forEach((c) => {
        list.push(...c.emojis);
      });
    } else {
      const cat = PRO_EMOJI_CATEGORIES.find((c) => c.id === selectedEmojiCategory);
      if (cat) list = cat.emojis;
    }

    if (emojiSearchTerm.trim()) {
      const term = emojiSearchTerm.toLowerCase();
      list = list.filter((e) => e.includes(term));
    }
    return Array.from(new Set(list));
  }, [selectedEmojiCategory, emojiSearchTerm]);

  // Memoized Pinned Messages for Active Room (Feature 1)
  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => Boolean(m.is_pinned));
  }, [messages]);

  // Estimated Active Online Members (Feature 5)
  const estimatedOnlineCount = useMemo(() => {
    const uniqueSenders = new Set(messages.map((m) => m.sender_id).filter(Boolean)).size;
    return Math.max(3, uniqueSenders + (user ? 1 : 0));
  }, [messages, user]);

  // Long-Press Handlers (Tap and hold detection for touch & mouse)
  const handleHoldStart = (msgId: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      triggerHaptic('heavy');
      setSelectedMessageId(msgId);
    }, 420);
  };

  const handleHoldEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Copy text handler
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('light');
    showToast('පණිවිඩය පිටපත් විය (Copied to Clipboard)');
    setSelectedMessageId(null);
  };

  // Dedicated helper to trigger instant direct file/photo download
  const handleDownloadFile = async (url: string, defaultName = 'download') => {
    triggerHaptic('medium');
    showToast('බාගත වීම ආරම්භ විය... (Downloading)');
    const targetUrl = getImageUrl(url);
    try {
      if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = defaultName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const response = await fetch(targetUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = defaultName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = defaultName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = defaultName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle Toggle Pin Message (Feature 1 - Admin & Teacher only)
  const handleTogglePin = async (messageId: string) => {
    triggerHaptic('medium');
    if (!isTeacherOrAdmin) return;

    try {
      const isPinnedNow = await chatApi.togglePin(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: isPinnedNow } : m))
      );
      setSelectedMessageId(null);
      showToast(
        isPinnedNow
          ? 'පණිවිඩය ඉහළින් Pin කරන ලදී 📌 (Pinned to top)'
          : 'පණිවිඩය Unpin කරන ලදී (Unpinned)'
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Handle Toggle Mute / Sound notifications (Feature 6)
  const handleToggleMute = () => {
    triggerHaptic('light');
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pirivena_chat_muted', String(next));
      } catch {}
      showToast(
        next
          ? '🔕 Chat Notification ශබ්දය අක්‍රියයි (Muted)'
          : '🔔 Chat Notification ශබ්දය ක්‍රියාත්මකයි (Unmuted)'
      );
      return next;
    });
  };

  // Handle Input typing change with live typing indicator (Feature 5)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTypingActive && e.target.value.trim().length > 0) {
      setIsTypingActive(true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTypingActive(false);
    }, 2500);
  };

  // Handle Send Message (Text or Attached File) with 100% Reliable Keyboard Retention
  const handleSendMessage = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const textToSend = inputText.trim();
    if ((!textToSend && !selectedFile) || isSending) return;

    triggerHaptic('medium');
    setIsSending(true);

    const activeReply = replyingTo;
    const fileToSend = selectedFile;

    // Keep input field focused immediately so keyboard NEVER dismisses
    setInputText('');
    setSelectedFile(null);
    setReplyingTo(null);
    setShowComposerEmojiPicker(false);
    setShowAttachMenu(false);

    // Keep focus synchronously in event cycle
    if (messageInputRef.current) {
      messageInputRef.current.focus({ preventScroll: true });
    }

    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentSize: string | null = null;
      let msgType: 'text' | 'image' | 'file' | 'link' = 'text';

      // 1. If file attached, upload first
      if (fileToSend) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', fileToSend.file);
          const uploadRes = await uploadApi.uploadFile(formData);
          if (uploadRes && (uploadRes.fileUrl || (uploadRes as any).url)) {
            attachmentUrl = uploadRes.fileUrl || (uploadRes as any).url;
            attachmentName = fileToSend.file.name;
            attachmentSize = `${Math.round(fileToSend.file.size / 1024)} KB`;
            msgType = fileToSend.file.type.startsWith('image/') ? 'image' : 'file';
          } else if (fileToSend.preview && fileToSend.file.type.startsWith('image/')) {
            attachmentUrl = fileToSend.preview;
            attachmentName = fileToSend.file.name;
            attachmentSize = `${Math.round(fileToSend.file.size / 1024)} KB`;
            msgType = 'image';
          }
        } catch (uploadErr) {
          console.warn('Chat upload server fallback to base64 preview:', uploadErr);
          if (fileToSend.preview && fileToSend.file.type.startsWith('image/')) {
            attachmentUrl = fileToSend.preview;
            attachmentName = fileToSend.file.name;
            attachmentSize = `${Math.round(fileToSend.file.size / 1024)} KB`;
            msgType = 'image';
          }
        } finally {
          setIsUploading(false);
        }
      } else {
        const isLink = /(https?:\/\/[^\s]+)/g.test(textToSend);
        if (isLink) msgType = 'link';
      }

      const replyContentSnippet = activeReply
        ? activeReply.message_type === 'image'
          ? '📷 ඡායාරූපය (Photo)'
          : activeReply.message_type === 'file'
          ? `📄 ${activeReply.attachment_name || 'ගොනුව'}`
          : (activeReply.content || '').slice(0, 140)
        : null;

      const newMsg = await chatApi.sendMessage({
        room_id: activeRoomId,
        sender_id: user.id || user.username || 'unknown',
        sender_name: user.name || (user as any).fullName || user.username || 'Member',
        sender_role: user.role || 'student',
        sender_avatar: user.avatar || null,
        message_type: msgType,
        content: textToSend || attachmentName || 'ගොනුවක්',
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_size: attachmentSize,
        reply_to_id: activeReply?.id || null,
        reply_to_name: activeReply?.sender_name || null,
        reply_to_content: replyContentSnippet,
      });

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error('Failed to send WhatsApp message:', err);
    } finally {
      setIsSending(false);
      // Ensure focus is retained and scroll smoothly
      requestAnimationFrame(() => {
        messageInputRef.current?.focus({ preventScroll: true });
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  // Handle File Select
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>, isImageOnly = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('light');
    if (isImageOnly || file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile({ file });
    }
    setShowAttachMenu(false);
  };

  // Handle Reaction Toggle
  const handleReaction = async (messageId: string, emoji: string) => {
    triggerHaptic('light');
    try {
      const userId = user.id || user.username || 'user';
      const userName = user.name || user.username || 'පරිශීලක';
      const updatedReactions = await chatApi.toggleReaction(messageId, emoji, userId, userName);

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: updatedReactions } : m))
      );
      setReactionTargetMessageId(null);
      setShowFullEmojiModal(false);
    } catch (err) {
      console.error('Failed to react to message:', err);
    }
  };

  // Handle Delete Message (with sleek WhatsApp Modal confirmation - Author or Admin only)
  const handleDeleteMessage = (messageId: string, isAuthor = false) => {
    triggerHaptic('medium');
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    if (!isAdmin && !isAuthor) return;
    
    setConfirmDialog({
      isOpen: true,
      title: isAdmin && !isAuthor ? '👑 පරිපාලක පණිවිඩ මකා දැමීම' : '🗑️ පණිවිඩය මකා දැමීම',
      description: isAdmin && !isAuthor
        ? 'පරිපාලක (Admin) බලතල යටතේ මෙම පණිවිඩය සර්වර් ඩේටාබේස් එකෙන්ම සම්පූර්ණයෙන්ම මැකීමට අවශ්‍ය බව තහවුරු කරන්නද?'
        : 'ඔබ එවූ මෙම පණිවිඩය කණ්ඩායමෙන් ඉවත් කිරීමට (Delete for everyone) අවශ්‍ය බව තහවුරු කරන්නද?',
      confirmLabel: 'ඔව්, මකන්න',
      isDestructive: true,
      icon: '🗑️',
      onConfirm: async () => {
        try {
          await chatApi.deleteMessage(messageId);
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          setSelectedMessageId(null);
          showToast('පණිවිඩය සාර්ථකව මකා දමන ලදී');
        } catch (err) {
          console.error('Failed to delete message:', err);
        }
      },
    });
  };

  // Handle Clear Entire Room (with sleek WhatsApp Modal confirmation)
  const handleClearRoom = () => {
    triggerHaptic('heavy');
    setConfirmDialog({
      isOpen: true,
      title: `👑 [${activeRoom.name}] පිරිසිදු කිරීම`,
      description: 'මෙම ශාලාවේ ඇති සියලුම පණිවිඩ එකවර මකා දැමීමට ඔබ සූදානම් වේ. මෙය නැවත ආපසු හැරවිය නොහැක. තහවුරු කරන්නද?',
      confirmLabel: 'සියලු පණිවිඩ මකන්න',
      isDestructive: true,
      icon: '⚠️',
      onConfirm: async () => {
        try {
          await chatApi.clearRoom(activeRoomId);
          setMessages([]);
          setShowOptionsMenu(false);
          showToast('ශාලාවේ සියලු පණිවිඩ මකා දමන ලදී');
        } catch (err) {
          console.error('Failed to clear room messages:', err);
        }
      },
    });
  };

  // Name color helper for WhatsApp group chat senders
  const getSenderColor = (role: string, senderId: string) => {
    if (role === 'admin' || role === 'superadmin') return 'text-amber-400 font-black';
    if (role === 'teacher') return 'text-emerald-400 font-black';
    const colors = ['text-teal-400', 'text-sky-400', 'text-indigo-400', 'text-purple-400', 'text-rose-400', 'text-orange-400'];
    const idx = Math.abs((senderId || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
    return colors[idx] + ' font-bold';
  };

  // Render elegant WhatsApp Group Role Badge (English Titles)
  const renderRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-2xs font-sans tracking-wide">
            <Crown className="w-2.5 h-2.5 text-amber-400" />
            <span>Admin</span>
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-2xs font-sans tracking-wide">
            <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
            <span>Teacher</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/35 shadow-2xs font-sans tracking-wide">
            <GraduationCap className="w-2.5 h-2.5 text-sky-400" />
            <span>Student</span>
          </span>
        );
    }
  };

  if (!user || isHidden || !isOnOverviewTab) return null;

  return (
    <div id="pirivena-chat-root">
      {/* ─────────────────────────────────────────────────────────────
          1. WHATSAPP-STYLE FLOATING LEVITATING BADGE / BUTTON
          ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-3.5 sm:bottom-6 sm:right-6 z-[9990] no-print">
        {!isOpen && !isKeyboardOpen ? (
          <motion.div
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => {
                triggerHaptic('medium');
                React.startTransition(() => {
                  setIsOpen(true);
                });
              }}
              className="group relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-[0_10px_25px_rgba(16,185,129,0.45)] border border-emerald-300/80 cursor-pointer backdrop-blur-md transition-all active:shadow-inner"
              title="ශ්‍රී සුමන WhatsApp සජීවී Chat ශාලාව"
            >
              {/* Soft Pulsing Ambient Ring */}
              <div className="absolute -inset-0.5 rounded-full bg-emerald-400 opacity-30 blur-2xs animate-ping pointer-events-none" />

              <div className="relative flex items-center justify-center w-5.5 h-5.5 rounded-full bg-white text-emerald-600 shadow-xs">
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 animate-icon-pulse-glow" />
              </div>

              <span className="font-serif font-black tracking-wide text-white drop-shadow-xs text-xs">
                Chat
              </span>

              {/* Online pulse status */}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse hidden sm:inline-block" />

              {/* Unread Counter Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 border border-white text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>
          </motion.div>
        ) : null}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. AUTHENTIC WHATSAPP WEB / APP CHAT MODAL DIALOG
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[9999999] no-safe-inset flex flex-col justify-end pointer-events-none select-none"
            style={
              typeof window !== 'undefined' && window.innerWidth < 640 && viewportHeight
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
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.92 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              style={
                typeof window !== 'undefined' && window.innerWidth < 640 && viewportHeight
                  ? {
                      height: `${viewportHeight}px`,
                      maxHeight: `${viewportHeight}px`,
                    }
                  : undefined
              }
              className={`pointer-events-auto bg-[#111b21] text-[#e9edef] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] border-0 sm:border border-[#222e35] overflow-hidden ${
                isExpanded
                  ? 'fixed inset-0 sm:inset-6 sm:rounded-3xl z-[9999999]'
                  : 'w-full h-full sm:w-[440px] sm:h-[650px] sm:max-h-[88vh] rounded-none sm:rounded-3xl'
              }`}
            >
              {/* 🌟 2.1 WHATSAPP HEADER (TOP BAR) */}
              <div className="bg-[#202c33] pt-safe px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#2a3942] flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  {/* Group DP & Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-full ${activeRoom.avatarBg} text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-md ring-2 ring-[#00a884]/40`}>
                      {activeRoom.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs sm:text-sm text-[#e9edef] truncate flex items-center gap-1.5 leading-tight">
                        <span className="truncate">{activeRoom.name}</span>
                        <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse shrink-0" />
                      </h3>

                      {isTypingActive ? (
                        <p className="text-[10.5px] text-[#00a884] font-bold truncate flex items-center gap-1 mt-0.5 animate-pulse font-sans">
                          <span>✍️ Typing...</span>
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] text-[#8696a0] truncate mt-0.5 font-sans">
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>{estimatedOnlineCount} Online</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate text-[#8696a0]">
                            <Clock className="w-2.5 h-2.5 text-[#00a884]" />
                            <span>24h Auto-Purge</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1 shrink-0 text-[#aebac1]">
                    {/* Feature 6: Sound Mute / Unmute Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className={`p-2 rounded-full hover:bg-[#374248] transition cursor-pointer active:scale-90 ${
                        isMuted ? 'text-rose-400 bg-rose-500/10' : 'text-[#00a884]'
                      }`}
                      title={isMuted ? "Sound is Muted (Click to Unmute)" : "Sound is Active (Click to Mute)"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    {/* Search button */}
                    <button
                      type="button"
                      onClick={() => setIsSearching(!isSearching)}
                      className={`p-2 rounded-full hover:bg-[#374248] transition cursor-pointer active:scale-90 ${isSearching ? 'text-[#00a884] bg-[#374248]' : ''}`}
                      title="Search messages"
                    >
                      <Search className="w-4 h-4" />
                    </button>

                    {/* 3-Dots More Options Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setShowOptionsMenu((prev) => !prev);
                        }}
                        className={`p-2 rounded-full hover:bg-[#374248] transition cursor-pointer active:scale-90 ${
                          showOptionsMenu ? 'text-[#00a884] bg-[#374248]' : ''
                        }`}
                        title="More options (තවත් විකල්ප)"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* WhatsApp Dropdown Menu with click-outside dismissal */}
                      <AnimatePresence>
                        {showOptionsMenu && (
                          <>
                            {/* Backdrop covering screen to dismiss on tap */}
                            <div
                              className="fixed inset-0 z-[9999998] bg-black/30 backdrop-blur-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowOptionsMenu(false);
                              }}
                            />

                            <motion.div
                              initial={{ opacity: 0, scale: 0.92, y: -6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.92, y: -6 }}
                              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                              className="fixed top-[calc(env(safe-area-inset-top,0px)+3.8rem)] right-3 sm:absolute sm:top-full sm:right-0 sm:mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-[#1f2c34] border border-[#00a884]/50 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] py-2 z-[9999999] text-xs text-[#e9edef] space-y-1 backdrop-blur-2xl ring-1 ring-white/10 select-none overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Option 1: Mute / Unmute */}
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('light');
                                  handleToggleMute();
                                  setShowOptionsMenu(false);
                                }}
                                className="w-full px-4 py-3 hover:bg-[#111b21] flex items-center gap-3 text-left transition cursor-pointer active:bg-[#182229]"
                              >
                                {isMuted ? (
                                  <>
                                    <div className="w-7 h-7 rounded-lg bg-[#00a884]/15 flex items-center justify-center shrink-0">
                                      <Volume2 className="w-4 h-4 text-[#00a884]" />
                                    </div>
                                    <span className="font-semibold text-xs">ශබ්දය සක්‍රිය කරන්න (Unmute)</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
                                      <VolumeX className="w-4 h-4 text-rose-400" />
                                    </div>
                                    <span className="font-semibold text-xs">දැනුම්දීම් නිහඬ කරන්න (Mute)</span>
                                  </>
                                )}
                              </button>

                              {/* Option 2: Refresh Messages */}
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('light');
                                  loadMessages(false);
                                  setShowOptionsMenu(false);
                                  showToast('පණිවිඩ නැවුම් කරන ලදී');
                                }}
                                className="w-full px-4 py-3 hover:bg-[#111b21] flex items-center gap-3 text-left transition cursor-pointer active:bg-[#182229]"
                              >
                                <div className="w-7 h-7 rounded-lg bg-[#00a884]/15 flex items-center justify-center shrink-0">
                                  <RefreshCw className="w-4 h-4 text-[#00a884]" />
                                </div>
                                <span className="font-semibold text-xs">පණිවිඩ නැවුම් කරන්න (Refresh)</span>
                              </button>

                              {/* Info Pill */}
                              <div className="px-4 py-2.5 my-1 border-t border-b border-[#2a3942]/70 text-[11px] text-[#ffd279] flex items-center gap-2.5 bg-[#182229]/80 font-medium">
                                <Lock className="w-4 h-4 text-[#ffd279] shrink-0" />
                                <span>පැය 24න් ඉබේ මැකේ (24h Auto-Purge)</span>
                              </div>

                              {/* Admin Option: Clear Room */}
                              {(user.role === 'admin' || user.role === 'superadmin') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('medium');
                                    setShowOptionsMenu(false);
                                    handleClearRoom();
                                  }}
                                  className="w-full px-4 py-3 hover:bg-rose-950/80 text-rose-400 flex items-center gap-3 text-left transition cursor-pointer font-bold active:bg-rose-900/90"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                  </div>
                                  <span className="text-xs">👑 ශාලාවේ සියල්ල මකන්න (Clear)</span>
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-2 rounded-full hover:bg-[#374248] transition cursor-pointer hidden sm:flex active:scale-90"
                      title={isExpanded ? 'Minimize' : 'Maximize'}
                    >
                      {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setIsOpen(false);
                        setShowOptionsMenu(false);
                        setSelectedMessageId(null);
                        setReactionTargetMessageId(null);
                        setShowFullEmojiModal(false);
                      }}
                      className="p-2 rounded-full hover:bg-[#374248] hover:text-rose-400 transition cursor-pointer active:scale-90"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* WhatsApp Search Bar (When Toggled) */}
                <AnimatePresence>
                  {isSearching && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-1"
                    >
                      <div className="relative">
                        <input id="floatingpirivenachat-input-1" name="floatingpirivenachat-input-1"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search in conversation..."
                          className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-[#111b21] border border-[#2a3942] text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-hidden focus:border-[#00a884]"
                        />
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8696a0]" />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-2 text-[#8696a0] hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* WhatsApp Chat Channels / Groups Pill Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar border-t border-[#2a3942]/60 pt-2">
                  {availableRooms.map((room) => {
                    const isActive = activeRoomId === room.id;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setActiveRoomId(room.id);
                          setSearchQuery('');
                          setSelectedMessageId(null);
                          setReactionTargetMessageId(null);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-[#00a884] text-[#111b21] font-black shadow-xs'
                            : 'bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] border border-[#2a3942]'
                        }`}
                      >
                        <span>{room.icon}</span>
                        <span className="truncate max-w-[130px]">{room.shortName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 🌟 2.1.3 PINNED MESSAGE NOTICE STRIP (FEATURE 1) */}
                {pinnedMessages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      const target = pinnedMessages[activePinnedIndex % pinnedMessages.length];
                      if (target) {
                        const el = document.getElementById(`msg-${target.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        triggerHaptic('light');
                        setSelectedMessageId(target.id);
                        setTimeout(() => setSelectedMessageId(null), 3000);
                      }
                    }}
                    className="p-2 rounded-2xl bg-[#18252d] border border-amber-500/40 flex items-center justify-between gap-2 text-xs text-[#e9edef] shadow-md cursor-pointer hover:bg-[#20313b] transition backdrop-blur-md shrink-0"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Pin className="w-3.5 h-3.5 fill-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-400 font-sans">
                          <span>📌 Pinned Message</span>
                          {pinnedMessages.length > 1 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                              {(activePinnedIndex % pinnedMessages.length) + 1}/{pinnedMessages.length}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8696a0] truncate mt-0.2">
                          <span className="font-bold text-[#e9edef]">
                            {pinnedMessages[activePinnedIndex % pinnedMessages.length]?.sender_name}:{' '}
                          </span>
                          {pinnedMessages[activePinnedIndex % pinnedMessages.length]?.content || 'ඇමුණුමක් (Attachment)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {pinnedMessages.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold transition"
                          title="Next pinned message"
                        >
                          Next ❯
                        </button>
                      )}

                      {isTeacherOrAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const target = pinnedMessages[activePinnedIndex % pinnedMessages.length];
                            if (target) handleTogglePin(target.id);
                          }}
                          className="p-1 rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-white/10 transition"
                          title="Unpin message"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 🌟 2.2 WHATSAPP CHAT THREAD CANVAS WITH AUTHENTIC DOODLE PATTERN */}
              <div
                onClick={() => {
                  setSelectedMessageId(null);
                  setReactionTargetMessageId(null);
                }}
                className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 relative"
                style={{
                  backgroundColor: '#0b141a',
                  backgroundImage: `radial-gradient(#202c33 1px, transparent 1px), radial-gradient(#202c33 1px, #0b141a 1px)`,
                  backgroundSize: '24px 24px',
                  backgroundPosition: '0 0, 12px 12px',
                }}
              >
                {/* 🌟 2.2.0 FLOATING BEAUTIFUL TOAST POPUP NOTIFICATION */}
                <AnimatePresence>
                  {toastMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -15, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.9 }}
                      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#00a884] text-[#111b21] font-black px-4 py-2 rounded-full text-xs shadow-[0_10px_30px_rgba(0,168,132,0.6)] flex items-center gap-2 border border-white/20 backdrop-blur-md select-none"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{toastMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* WhatsApp Disappearing 24-Hour Security Pill */}
                <div className="mx-auto max-w-sm text-center py-1.5 px-3.5 rounded-xl bg-[#182229] border border-[#2a3942] text-[10px] text-[#ffd279] flex items-center justify-center gap-2 shadow-xs">
                  <Lock className="w-3 h-3 text-[#ffd279] shrink-0" />
                  <span>
                    🔒 පණිවිඩ සුරක්ෂිතයි • පැය 24 කින් සියලු පණිවිඩ ඉබේ මැකේ
                  </span>
                </div>

                {/* Empty State */}
                {filteredMessages.length === 0 && (
                  <div className="py-20 text-center space-y-2 opacity-70">
                    <div className="w-12 h-12 rounded-full bg-[#202c33] text-[#00a884] flex items-center justify-center mx-auto text-xl shadow-inner">
                      💬
                    </div>
                    <p className="text-xs text-[#8696a0]">
                      {searchQuery
                        ? 'සොයන ලද පණිවිඩය හමු නොවීය'
                        : 'පණිවිඩ නොමැත. පළමු පණිවිඩය යවන්න!'}
                    </p>
                  </div>
                )}

                {/* WhatsApp Message Bubbles */}
                {filteredMessages.map((msg) => {
                  const isMine = Boolean(
                    (user.id && msg.sender_id && String(msg.sender_id) === String(user.id)) ||
                    (user.username && msg.sender_id && String(msg.sender_id) === String(user.username)) ||
                    ((user as any).studentId && msg.sender_id && String(msg.sender_id) === String((user as any).studentId)) ||
                    ((user as any).teacherId && msg.sender_id && String(msg.sender_id) === String((user as any).teacherId)) ||
                    (user.name && msg.sender_name && String(msg.sender_name).trim().toLowerCase() === String(user.name).trim().toLowerCase())
                  );
                  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
                  const canDelete = isMine || isAdmin;
                  const isSelected = selectedMessageId === msg.id;
                  const isReactionTarget = reactionTargetMessageId === msg.id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative`}
                    >
                      {/* 🌟 2.2.1 PRO-LEVEL WHATSAPP FLOATING REACTION BAR POPUP */}
                      <AnimatePresence>
                        {isReactionTarget && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: -10 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 380 }}
                            className={`absolute z-40 -top-12 ${
                              isMine ? 'right-2' : 'left-2'
                            } bg-[#1f2c34]/98 border border-[#00a884]/40 rounded-full px-2 py-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.95)] flex items-center gap-1 backdrop-blur-2xl`}
                          >
                            {QUICK_REACTION_EMOJIS.map((emoji, eIdx) => (
                              <motion.button
                                key={eIdx}
                                whileHover={{ scale: 1.5, y: -6 }}
                                whileTap={{ scale: 0.85 }}
                                type="button"
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-white/10 transition cursor-pointer"
                              >
                                {emoji}
                              </motion.button>
                            ))}

                            <motion.button
                              whileHover={{ scale: 1.25, y: -3 }}
                              whileTap={{ scale: 0.85 }}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setShowFullEmojiModal(true);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#00a884] bg-[#111b21] hover:bg-[#374248] border border-[#2a3942] transition cursor-pointer font-black text-sm shadow-xs"
                              title="More Emojis (වෙනත් ප්‍රතිචාර)"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* 🌟 2.2.2 ULTRA-BEAUTIFUL TAP-AND-HOLD / LONG-PRESS ACTIONS POPUP */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: -12 }}
                            exit={{ opacity: 0, scale: 0.85, y: 10 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 400 }}
                            className={`absolute z-40 -top-14 ${
                              isMine ? 'right-0' : 'left-0'
                            } bg-[#1f2c34]/98 border border-[#00a884]/40 rounded-2xl px-2 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.95)] flex items-center gap-1.5 backdrop-blur-2xl ring-1 ring-white/10`}
                          >
                            {/* React */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReactionTargetMessageId(msg.id);
                                setSelectedMessageId(null);
                              }}
                              className="px-2.5 py-1.5 rounded-xl hover:bg-[#374248] text-xs text-[#e9edef] flex items-center gap-1.5 transition cursor-pointer active:scale-90"
                              title="React"
                            >
                              <SmilePlus className="w-4 h-4 text-[#00a884]" />
                              <span className="text-[11px] font-bold">React</span>
                            </button>

                            {/* Reply */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(msg);
                                setSelectedMessageId(null);
                                setTimeout(() => messageInputRef.current?.focus(), 60);
                              }}
                              className="px-2.5 py-1.5 rounded-xl hover:bg-[#374248] text-xs text-[#e9edef] flex items-center gap-1.5 transition cursor-pointer active:scale-90"
                              title="Reply"
                            >
                              <Reply className="w-4 h-4 text-[#53bdeb]" />
                              <span className="text-[11px] font-bold">Reply</span>
                            </button>

                            {/* Copy */}
                            {msg.content && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(msg.content);
                                }}
                                className="px-2.5 py-1.5 rounded-xl hover:bg-[#374248] text-xs text-[#e9edef] flex items-center gap-1.5 transition cursor-pointer active:scale-90"
                                title="Copy Text"
                              >
                                <Copy className="w-4 h-4 text-amber-400" />
                                <span className="text-[11px] font-bold">Copy</span>
                              </button>
                            )}

                            {/* Pin / Unpin (Teacher & Admin Only) */}
                            {isTeacherOrAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePin(msg.id);
                                }}
                                className="px-2.5 py-1.5 rounded-xl hover:bg-[#374248] text-xs text-amber-400 flex items-center gap-1.5 transition cursor-pointer active:scale-90"
                                title={msg.is_pinned ? "Unpin message" : "Pin to top (ඉහළින් Pin කරන්න)"}
                              >
                                <Pin className={`w-4 h-4 ${msg.is_pinned ? 'fill-amber-400' : ''}`} />
                                <span className="text-[11px] font-bold">{msg.is_pinned ? 'Unpin' : 'Pin'}</span>
                              </button>
                            )}

                            {/* Delete (Admin or Message Author ONLY) */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(msg.id, isMine);
                                }}
                                className="px-2.5 py-1.5 rounded-xl hover:bg-rose-950/80 text-xs text-rose-400 flex items-center gap-1.5 transition cursor-pointer font-bold active:scale-90"
                                title={isAdmin && !isMine ? 'පරිපාලක ලෙස මකා දමන්න' : 'මගේ පණිවිඩය මකන්න'}
                              >
                                <Trash2 className="w-4 h-4 text-rose-400" />
                                <span className="text-[11px]">{isAdmin && !isMine ? 'Admin Delete' : 'Delete'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMessageId(null);
                              }}
                              className="p-1 rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* WhatsApp Speech Bubble Card with Long-Press / Tap-and-Hold Handler */}
                      <div
                        id={`msg-${msg.id}`}
                        onTouchStart={() => handleHoldStart(msg.id)}
                        onTouchEnd={handleHoldEnd}
                        onTouchMove={handleHoldEnd}
                        onMouseDown={() => handleHoldStart(msg.id)}
                        onMouseUp={handleHoldEnd}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('medium');
                          setReplyingTo(msg);
                          showToast(`පිළිතුරු ලියන්න (${msg.sender_name} ට)`);
                          setTimeout(() => messageInputRef.current?.focus(), 80);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          triggerHaptic('heavy');
                          setSelectedMessageId(msg.id);
                        }}
                        className={`relative max-w-[86%] sm:max-w-[78%] rounded-2xl px-3 py-2 shadow-md transition-all cursor-pointer select-text ${
                          isSelected
                            ? 'ring-2 ring-[#00a884] shadow-[0_0_25px_rgba(0,168,132,0.5)] scale-[1.01]'
                            : ''
                        } ${
                          isMine
                            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs'
                            : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs'
                        }`}
                      >
                        {/* Pinned Message Golden Badge on Bubble */}
                        {msg.is_pinned && (
                          <div
                            onClick={(e) => {
                              if (isTeacherOrAdmin) {
                                e.stopPropagation();
                                handleTogglePin(msg.id);
                              }
                            }}
                            className={`absolute -top-2 -right-2 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-stone-900 shadow-md ring-2 ring-[#202c33] ${
                              isTeacherOrAdmin ? 'cursor-pointer hover:scale-110 active:scale-95' : ''
                            }`}
                            title={isTeacherOrAdmin ? "Click to Unpin 📌" : "Pinned Message 📌"}
                          >
                            <Pin className="w-3 h-3 fill-stone-900" />
                          </div>
                        )}
                        {/* Sender Name & Role Tag in WhatsApp Group Chat */}
                        {!isMine && (
                          <div className="flex items-center justify-between gap-2 mb-1.5 pb-0.5 border-b border-white/5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-[12px] leading-tight ${getSenderColor(msg.sender_role, msg.sender_id)} truncate`}>
                                {msg.sender_name}
                              </span>
                              {renderRoleBadge(msg.sender_role)}
                            </div>
                          </div>
                        )}

                        {/* WhatsApp Quoted Reply Block */}
                        {msg.reply_to_name && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (msg.reply_to_id) {
                                const targetEl = document.getElementById(`msg-${msg.reply_to_id}`);
                                if (targetEl) {
                                  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  triggerHaptic('light');
                                  setSelectedMessageId(msg.reply_to_id);
                                  setTimeout(() => setSelectedMessageId(null), 2500);
                                } else {
                                  showToast('මුල් පණිවිඩය මෙම ශාලාවේ ඉහළින් පිහිටා ඇත');
                                }
                              }
                            }}
                            className="mb-2 p-2 rounded-xl bg-black/35 border-l-4 border-[#00a884] text-xs cursor-pointer hover:bg-black/50 transition active:scale-[0.99] select-none"
                            title="මුල් පණිවිඩය වෙත යන්න (Click to jump to message)"
                          >
                            <div className="font-bold text-[#00a884] text-[11px] flex items-center gap-1">
                              <CornerDownRight className="w-3 h-3 text-[#00a884]" />
                              <span>{msg.reply_to_name}</span>
                            </div>
                            <div className="text-[#8696a0] text-[10.5px] truncate mt-0.5 line-clamp-1">
                              {msg.reply_to_content || 'පණිවිඩයක්'}
                            </div>
                          </div>
                        )}

                        {/* 🖼️ WHATSAPP PHOTO CARD */}
                        {msg.message_type === 'image' && msg.attachment_url && (
                          <div className="relative group/photo space-y-1 mb-1.5 overflow-hidden rounded-xl border border-white/10 bg-black/25">
                            <img
                              src={getImageUrl(msg.attachment_url)}
                              alt={msg.attachment_name || 'Photo'}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fullUrl = getMediaUrl(msg.attachment_url);
                                if (target.src !== fullUrl) {
                                  target.src = fullUrl;
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(msg.attachment_url || null);
                              }}
                              className="rounded-xl max-h-72 w-full object-cover cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                            />

                            {/* Floating Action Overlay on Photo */}
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadFile(
                                    msg.attachment_url!,
                                    msg.attachment_name || `photo_${msg.id}.jpg`
                                  );
                                }}
                                className="p-1.5 rounded-full bg-black/75 hover:bg-[#00a884] text-white shadow-lg backdrop-blur-md transition cursor-pointer active:scale-90"
                                title="ඡායාරූපය බාගත කරන්න (Download Photo)"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(msg.attachment_url || null);
                                }}
                                className="p-1.5 rounded-full bg-black/75 hover:bg-[#374248] text-white shadow-lg backdrop-blur-md transition cursor-pointer active:scale-90"
                                title="විශාල කර බලන්න (View Fullscreen)"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 📄 WHATSAPP DOCUMENT / PDF CARD */}
                        {msg.message_type === 'file' && msg.attachment_url && (
                          <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-black/30 border border-[#2a3942] mb-1.5 hover:border-[#00a884]/40 transition">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                openInAppFileViewer({
                                  url: getMediaUrl(msg.attachment_url!),
                                  title: msg.attachment_name || 'Document',
                                });
                              }}
                              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                            >
                              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-inner">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 truncate">
                                <div className="font-bold text-xs truncate text-[#e9edef] hover:underline">
                                  {msg.attachment_name || msg.content || 'Document.pdf'}
                                </div>
                                <div className="text-[10px] text-[#8696a0] font-mono">
                                  {msg.attachment_size || 'PDF Document'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Open / View Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInAppFileViewer({
                                    url: getMediaUrl(msg.attachment_url!),
                                    title: msg.attachment_name || 'Document',
                                  });
                                }}
                                className="px-2 py-1.5 rounded-lg bg-[#2a3942] hover:bg-[#374248] text-[#e9edef] text-xs flex items-center gap-1 transition cursor-pointer active:scale-95 border border-white/5"
                                title="කියවන්න / විවෘත කරන්න (Open Document)"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#53bdeb]" />
                                <span className="text-[10.5px] font-bold">Open</span>
                              </button>

                              {/* Download Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadFile(
                                    msg.attachment_url!,
                                    msg.attachment_name || 'document.pdf'
                                  );
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#00a884]/20 hover:bg-[#00a884]/35 text-[#00a884] text-xs flex items-center gap-1 transition cursor-pointer active:scale-95 border border-[#00a884]/30"
                                title="බාගත කරන්න (Download PDF)"
                              >
                                <Download className="w-3.5 h-3.5 text-[#00a884]" />
                                <span className="text-[10.5px] font-bold">බාගත</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 💬 MESSAGE TEXT / HYPERLINK CONTENT */}
                        {msg.content && msg.message_type !== 'file' && (
                          <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words pr-14 text-[#e9edef]">
                            {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                              if (/(https?:\/\/[^\s]+)/.test(part)) {
                                return (
                                  <a
                                    key={i}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[#53bdeb] underline font-bold inline-flex items-center gap-0.5 hover:text-white"
                                  >
                                    <span>{part}</span>
                                    <ExternalLink className="w-3 h-3 inline ml-0.5" />
                                  </a>
                                );
                              }
                              return part;
                            })}
                          </p>
                        )}

                        {/* WhatsApp Timestamp & Blue Double Check Marks */}
                        <div className="absolute right-2 bottom-1 flex items-center gap-1 text-[9.5px] text-[#8696a0] font-mono select-none">
                          <span>{formatSriLankaTime(msg.created_at)}</span>
                          {isMine && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                        </div>
                      </div>

                      {/* 🌟 2.2.3 PRO-LEVEL REACTION BADGES STRIP */}
                      <div className="flex items-center gap-1.5 flex-wrap px-1 mt-1">
                        {Array.isArray(msg.reactions) &&
                          msg.reactions.map((r, rIdx) => {
                            const isMyReaction = r.users?.includes(user.id || user.username || '');
                            return (
                              <motion.button
                                key={rIdx}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReaction(msg.id, r.emoji);
                                }}
                                className={`px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                                  isMyReaction
                                    ? 'bg-[#00a884]/25 border border-[#00a884] text-white ring-1 ring-[#00a884]/30'
                                    : 'bg-[#202c33] border border-[#2a3942] text-[#8696a0] hover:bg-[#374248] hover:text-white'
                                }`}
                                title={isMyReaction ? 'ඔබ ප්‍රතිචාර දක්වා ඇත (Click to remove)' : 'Reacted with ' + r.emoji}
                              >
                                <span className="text-xs">{r.emoji}</span>
                                <span className="font-mono text-[10px] font-bold">{r.count}</span>
                              </motion.button>
                            );
                          })}

                        {/* Add Any Reaction (+) Pill */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            setReactionTargetMessageId(msg.id);
                          }}
                          className="px-1.5 py-0.5 rounded-full bg-[#202c33] hover:bg-[#374248] border border-[#2a3942] text-[10px] text-[#8696a0] hover:text-white transition cursor-pointer flex items-center gap-1"
                          title="Add reaction (ප්‍රතිචාර එක් කරන්න)"
                        >
                          <SmilePlus className="w-3 h-3 text-[#00a884]" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* 🌟 2.3 REPLYING-TO PREVIEW BAR */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#202c33] px-3.5 py-2 border-t border-[#2a3942] flex items-center justify-between gap-2 shrink-0 select-none shadow-md"
                  >
                    <div className="border-l-4 border-[#00a884] pl-2 text-xs truncate min-w-0 flex-1">
                      <span className="font-bold text-[#00a884] flex items-center gap-1 text-[11px]">
                        <Reply className="w-3.5 h-3.5 text-[#53bdeb]" />
                        <span>Replying to {replyingTo.sender_name}</span>
                      </span>
                      <span className="text-[#8696a0] truncate block mt-0.5 text-[11px]">
                        {replyingTo.message_type === 'image'
                          ? '📷 ඡායාරූපය (Photo)'
                          : replyingTo.message_type === 'file'
                          ? `📄 ${replyingTo.attachment_name || 'ගොනුව'}`
                          : replyingTo.content}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 text-[#8696a0] hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                      title="Cancel reply"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 🌟 2.4 SELECTED FILE PREVIEW BEFORE SENDING */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#202c33] p-2.5 border-t border-[#2a3942] flex items-center justify-between gap-3 shrink-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {selectedFile.preview ? (
                        <img
                          src={selectedFile.preview}
                          alt="preview"
                          className="w-10 h-10 rounded-lg object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#e9edef] truncate">
                          {selectedFile.file.name}
                        </p>
                        <p className="text-[10px] text-[#8696a0]">
                          {Math.round(selectedFile.file.size / 1024)} KB • Ready to send
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 🌟 2.5 ATTACHMENT MENU POPOVER */}
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="p-3 bg-[#202c33] border-t border-[#2a3942] grid grid-cols-2 gap-2 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-2xl bg-[#111b21] hover:bg-[#2a3942] flex items-center gap-3 transition cursor-pointer border border-[#2a3942]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-[#e9edef]">Photos & Media</div>
                        <div className="text-[9.5px] text-[#8696a0]">JPG, PNG, WEBP</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="p-3 rounded-2xl bg-[#111b21] hover:bg-[#2a3942] flex items-center gap-3 transition cursor-pointer border border-[#2a3942]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-[#e9edef]">Document / PDF</div>
                        <div className="text-[9.5px] text-[#8696a0]">PDF Study Notes</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 🌟 2.6 COMPOSER QUICK EMOJI TRAY */}
              <AnimatePresence>
                {showComposerEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0"
                  >
                    {QUICK_REACTION_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + emoji);
                          triggerHaptic('light');
                        }}
                        className="w-9 h-9 rounded-xl hover:bg-[#374248] text-lg flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setShowFullEmojiModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#111b21] hover:bg-[#374248] border border-[#2a3942] text-xs text-[#00a884] font-bold flex items-center gap-1 shrink-0"
                    >
                      <span>තවත්</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 🌟 2.7 AUTHENTIC WHATSAPP COMPOSER BAR (BOTTOM) */}
              <div
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 ${
                  isKeyboardOpen ? 'pb-1.5' : 'pb-safe'
                } bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2 shrink-0 select-none`}
              >
                {/* Hidden File Inputs */}
                <input id="floatingpirivenachat-input-2" name="file_2"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFilePicked(e, true)}
                  accept="image/*"
                  className="hidden"
                />
                <input id="floatingpirivenachat-input-3" name="file_3"
                  type="file"
                  ref={docInputRef}
                  onChange={(e) => handleFilePicked(e, false)}
                  accept="application/pdf,.doc,.docx"
                  className="hidden"
                />

                {/* Emoji Tray Button */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowComposerEmojiPicker(!showComposerEmojiPicker);
                    setShowAttachMenu(false);
                  }}
                  className={`p-2 rounded-full transition cursor-pointer shrink-0 active:scale-90 ${
                    showComposerEmojiPicker ? 'text-[#00a884] bg-[#374248]' : 'text-[#8696a0] hover:text-[#e9edef]'
                  }`}
                  title="Emojis"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Attachment Paperclip Button */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowAttachMenu(!showAttachMenu);
                    setShowComposerEmojiPicker(false);
                  }}
                  className={`p-2 rounded-full transition cursor-pointer shrink-0 active:scale-90 ${
                    showAttachMenu ? 'text-[#00a884] bg-[#374248]' : 'text-[#8696a0] hover:text-[#e9edef]'
                  }`}
                  title="Attach Photo or Document"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* WhatsApp Message Input Pill */}
                <div className="flex-1 relative flex items-center">
                  <input id="floatingpirivenachat-input-4" name="floatingpirivenachat-input-4"
                    ref={messageInputRef}
                    type="text"
                    value={inputText}
                    onFocus={() => {
                      setIsKeyboardOpen(true);
                      setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                      }, 150);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        const isStillFocused = document.activeElement === messageInputRef.current;
                        if (!isStillFocused) {
                          setIsKeyboardOpen(false);
                        }
                      }, 200);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSendMessage();
                      }
                    }}
                    onChange={handleInputChange}
                    placeholder={
                      replyingTo
                        ? `පිළිතුර ලියන්න (${replyingTo.sender_name} ට)...`
                        : 'Type a message / පණිවිඩයක් ලියන්න...'
                    }
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#2a3942] text-base sm:text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-hidden font-sans border-0 focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>

                {/* WhatsApp Circular Green Send Button */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    if ((inputText.trim() || selectedFile) && !isSending) {
                      handleSendMessage();
                    }
                  }}
                  className={`w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-[#111b21] flex items-center justify-center font-black transition cursor-pointer shrink-0 shadow-md active:scale-90 ${
                    (!inputText.trim() && !selectedFile) || isSending
                      ? 'opacity-40 pointer-events-none'
                      : 'opacity-100'
                  }`}
                  title="Send message"
                >
                  {isSending || isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#111b21]" />
                  ) : (
                    <Send className="w-4.5 h-4.5 fill-[#111b21]" />
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. FULL CATEGORIZED PRO EMOJI PICKER MODAL (ALL EMOJIS)
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFullEmojiModal && (
          <div className="fixed inset-0 z-[99999999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 pt-safe pb-safe">
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              className="w-full sm:max-w-lg bg-[#202c33] border border-[#2a3942] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="p-3.5 bg-[#111b21] border-b border-[#2a3942] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center text-base">
                    ✨
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#e9edef]">
                      {reactionTargetMessageId
                        ? 'පණිවිඩයට ප්‍රතිචාරයක් දක්වන්න (React with Emoji)'
                        : 'Emoji තෝරන්න (Select Emoji)'}
                    </h4>
                    <p className="text-[10px] text-[#8696a0]">
                      කැමති ඕනෑම Emoji එකක් මත ක්ලික් කරන්න
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullEmojiModal(false)}
                  className="p-1.5 rounded-full hover:bg-[#374248] text-[#8696a0] hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Emoji Search Box */}
              <div className="p-3 bg-[#202c33] border-b border-[#2a3942]">
                <div className="relative">
                  <input id="floatingpirivenachat-input-5" name="floatingpirivenachat-input-5"
                    type="text"
                    value={emojiSearchTerm}
                    onChange={(e) => setEmojiSearchTerm(e.target.value)}
                    placeholder="Search emoji (සොයන්න)..."
                    className="w-full pl-8 pr-8 py-2 rounded-xl bg-[#111b21] border border-[#2a3942] text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-hidden focus:border-[#00a884]"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#8696a0]" />
                  {emojiSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setEmojiSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-[#8696a0] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 p-2 bg-[#111b21] border-b border-[#2a3942] overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedEmojiCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                    selectedEmojiCategory === 'all'
                      ? 'bg-[#00a884] text-[#111b21]'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  🌟 සියල්ල (All)
                </button>
                {PRO_EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedEmojiCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                      selectedEmojiCategory === cat.id
                        ? 'bg-[#00a884] text-[#111b21]'
                        : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="p-4 overflow-y-auto max-h-[50vh] grid grid-cols-7 sm:grid-cols-9 gap-2">
                {displayedEmojis.map((emoji, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.35, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => {
                      if (reactionTargetMessageId) {
                        handleReaction(reactionTargetMessageId, emoji);
                      } else {
                        setInputText((prev) => prev + emoji);
                        setShowFullEmojiModal(false);
                      }
                    }}
                    className="w-10 h-10 rounded-2xl hover:bg-[#374248] text-2xl flex items-center justify-center transition cursor-pointer shadow-xs border border-transparent hover:border-[#00a884]/40"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          4. ULTRA-BEAUTIFUL CUSTOM CONFIRMATION MODAL DIALOG
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-[99999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 360 }}
              className="w-full max-w-sm bg-[#202c33] border border-[#2a3942] rounded-3xl p-6 shadow-2xl space-y-4 text-center select-none ring-1 ring-white/10"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-2xl shadow-inner">
                {confirmDialog.icon || '⚠️'}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-black text-[#e9edef] tracking-wide">
                  {confirmDialog.title}
                </h4>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-white text-xs font-bold transition cursor-pointer border border-[#2a3942]"
                >
                  අවලංගු කරන්න
                </button>

                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-black text-white transition cursor-pointer shadow-lg active:scale-95 ${
                    confirmDialog.isDestructive
                      ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-rose-950/50'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
                  }`}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          5. FULLSCREEN IMAGE LIGHTBOX MODAL WITH DOWNLOAD TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-[99999999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
            onClick={() => setPreviewImage(null)}
          >
            {/* Top Toolbar */}
            <div
              className="w-full max-w-4xl flex items-center justify-between gap-3 mb-3 px-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-white/80 text-xs font-serif font-bold truncate">
                <ImageIcon className="w-4 h-4 text-[#00a884] shrink-0" />
                <span className="truncate">ඡායාරූප පෙරදසුන (Photo Preview)</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewImage, 'pirivena_photo.jpg')}
                  className="px-3 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-black text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer active:scale-95"
                  title="ඡායාරූපය බාගත කරන්න"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">බාගත කරන්න</span>
                  <span>(Download)</span>
                </button>

                <a
                  href={getImageUrl(previewImage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-[#202c33] hover:bg-[#374248] text-white transition border border-[#2a3942]"
                  title="නව Tab එකකින් විවෘත කරන්න"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-xl bg-[#202c33] text-white hover:bg-rose-600 transition cursor-pointer border border-[#2a3942]"
                  title="වසන්න (Close)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image display */}
            <div
              className="relative max-w-4xl max-h-[82vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getImageUrl(previewImage)}
                alt="Full preview"
                className="max-w-full max-h-[82vh] rounded-2xl shadow-2xl object-contain border border-[#2a3942]"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
