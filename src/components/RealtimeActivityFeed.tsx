import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Radio,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  GraduationCap,
  Award,
  BarChart2,
  FileText,
  BookOpen,
  Bell,
  Settings,
  Trash2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import type { ActivityItem, ActivityCategory } from '../types';
import { auditApi } from '../api/auditApi';
import { useToast } from '../context/ToastContext';
import { formatSriLankaDate } from '../utils/sriLankaTime';

interface RealtimeActivityFeedProps {
  initialActivities?: ActivityItem[];
  portalType?: 'admin' | 'teacher';
  title?: string;
  subtitle?: string;
  maxItems?: number;
  allowSimulate?: boolean;
  allowClear?: boolean;
  onClearLogs?: () => void;
  className?: string;
}

export const RealtimeActivityFeed: React.FC<RealtimeActivityFeedProps> = ({
  initialActivities = [],
  portalType = 'admin',
  title = 'සජීවී පද්ධති ක්‍රියාකාරකම් විකාශය (Real-Time Activity Feed)',
  subtitle = 'ශිෂ්‍ය ලියාපදිංචි, විභාග ලකුණු, අධ්‍යයන සටහන් හා පද්ධති ක්‍රියාකාරකම් සජීවීව',
  maxItems = 50,
  allowSimulate = true,
  allowClear = true,
  onClearLogs,
  className = '',
}) => {
  const toast = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'polling' | 'disconnected'>('reconnecting');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<any>(null);

  // Gentle audio chime for new live arrivals
  const playArrivalTone = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
      setTimeout(() => {
        audioCtx.close().catch(() => {});
      }, 500);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, [soundEnabled]);

  // Fetch initial activity list
  const fetchActivities = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await auditApi.getActivities({ limit: maxItems });
      if (res && Array.isArray(res.activities)) {
        setActivities(res.activities);
      }
    } catch (err) {
      console.warn('Failed to load initial activities:', err);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [maxItems]);

  // Event-Driven & Visibility-Aware Live Feed
  useEffect(() => {
    let isMounted = true;

    // Load initial feed
    fetchActivities();
    setConnectionStatus('connected');

    // Poll periodically only if document is visible
    const pollInterval = window.setInterval(() => {
      if (isMounted && !document.hidden) {
        fetchActivities();
      }
    }, 30000);

    // Refresh immediately on user actions across the ERP
    const handleDataUpdated = () => {
      if (isMounted) {
        fetchActivities();
      }
    };

    window.addEventListener('site-data-updated', handleDataUpdated);
    window.addEventListener('users-data-updated', handleDataUpdated);
    window.addEventListener('students-data-updated', handleDataUpdated);
    window.addEventListener('teachers-data-updated', handleDataUpdated);
    window.addEventListener('visibilitychange', handleDataUpdated);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('site-data-updated', handleDataUpdated);
      window.removeEventListener('users-data-updated', handleDataUpdated);
      window.removeEventListener('students-data-updated', handleDataUpdated);
      window.removeEventListener('teachers-data-updated', handleDataUpdated);
      window.removeEventListener('visibilitychange', handleDataUpdated);
    };
  }, [fetchActivities]);

  // Quick Simulation for Testing Real-time Stream
  const handleSimulateEvent = async (type: 'enrollment' | 'grade' | 'material') => {
    setIsSimulating(true);
    try {
      const studentNames = ['පූජ්‍ය බලංගොඩ සුමනසාර හිමි', 'පූජ්‍ය රත්නපුරේ ධම්මදින්න හිමි', 'කුමාර දිසානායක සිසුවා', 'පූජ්‍ය ඇහැලියගොඩ මේධංකර හිමි'];
      const randomStudent = studentNames[Math.floor(Math.random() * studentNames.length)];
      const randomScore = Math.floor(75 + Math.random() * 25);

      await auditApi.simulateActivity({
        type,
        customName: randomStudent,
        score: randomScore,
      });

      toast.success(
        type === 'enrollment'
          ? '🎓 නව ශිෂ්‍ය ලියාපදිංචි පරීක්ෂණ ක්‍රියාව සාර්ථකව විකාශය කරන ලදී!'
          : type === 'grade'
          ? '📊 විභාග ලකුණු යාවත්කාලීන කිරීමේ පරීක්ෂණ ක්‍රියාව සාර්ථකව විකාශය කරන ලදී!'
          : '📚 නව අධ්‍යයන නිබන්ධන පරීක්ෂණ ක්‍රියාව සාර්ථකව විකාශය කරන ලදී!'
      );
    } catch (err: any) {
      toast.error('පරීක්ෂණ ක්‍රියාව විකාශය කිරීමට නොහැකි විය: ' + (err?.message || 'Server error'));
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper: Format Relative Time in Sinhala & English
  const formatTimeRelative = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 15) return 'දැන් (Just now)';
      if (diffSecs < 60) return `තත්පර ${diffSecs}කට පෙර`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `මිනිත්තු ${diffMins}කට පෙර`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `පැය ${diffHours}කට පෙර`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'ඊයේ (Yesterday)';
      if (diffDays < 7) return `දින ${diffDays}කට පෙර`;
      return formatSriLankaDate(date, 'si', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Category Configuration (Badges, Icons & Styling)
  const categoryConfig: Record<string, { label: string; icon: React.FC<any>; bg: string; text: string; border: string; glow: string }> = {
    enrollment: {
      label: 'ශිෂ්‍ය ලියාපදිංචි (Enrollment)',
      icon: GraduationCap,
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800',
      glow: 'shadow-emerald-500/10',
    },
    admission: {
      label: 'අයදුම්පත් (Admission)',
      icon: UserCheck,
      bg: 'bg-teal-50 dark:bg-teal-950/60',
      text: 'text-teal-800 dark:text-teal-300',
      border: 'border-teal-200/80 dark:border-teal-800',
      glow: 'shadow-teal-500/10',
    },
    grades: {
      label: 'ලකුණු & ප්‍රතිඵල (Grades)',
      icon: Award,
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200/80 dark:border-blue-800',
      glow: 'shadow-blue-500/10',
    },
    exam: {
      label: 'විභාග (Exams)',
      icon: FileText,
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200/80 dark:border-purple-800',
      glow: 'shadow-purple-500/10',
    },
    material: {
      label: 'නිබන්ධන (Materials)',
      icon: BookOpen,
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800',
      glow: 'shadow-amber-500/10',
    },
    notice: {
      label: 'නිවේදන (Notices)',
      icon: Bell,
      bg: 'bg-orange-50 dark:bg-orange-950/60',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200/80 dark:border-orange-800',
      glow: 'shadow-orange-500/10',
    },
    system: {
      label: 'පද්ධති (System)',
      icon: ShieldCheck,
      bg: 'bg-stone-100 dark:bg-stone-800/80',
      text: 'text-stone-800 dark:text-stone-300',
      border: 'border-stone-200 dark:border-stone-700',
      glow: 'shadow-stone-500/10',
    },
  };

  // Filtered Activity List
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // 1. Filter by Category
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'academic') {
          if (!['enrollment', 'admission', 'grades', 'exam', 'material'].includes(act.category || '')) {
            return false;
          }
        } else if (act.category !== selectedCategory) {
          return false;
        }
      }

      // 2. Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchActor = (act.actor || act.userName || '').toLowerCase().includes(q);
        const matchAction = (act.action || '').toLowerCase().includes(q);
        const matchDetails = (act.details || '').toLowerCase().includes(q);
        const matchMetadata = JSON.stringify(act.metadata || {}).toLowerCase().includes(q);
        if (!matchActor && !matchAction && !matchDetails && !matchMetadata) {
          return false;
        }
      }

      return true;
    });
  }, [activities, selectedCategory, searchQuery]);

  return (
    <div
      id="realtime-activity-feed-container"
      className={`bg-white dark:bg-stone-900 border border-amber-200/80 dark:border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden ${className}`}
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              <Activity className="w-4 h-4 animate-pulse" />
            </span>
            <h3 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight">
              {title}
            </h3>

            {/* Connection Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800'
                  : connectionStatus === 'polling'
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300/80 dark:border-blue-800'
                  : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500 animate-ping'
                    : connectionStatus === 'polling'
                    ? 'bg-blue-500'
                    : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span>
                {connectionStatus === 'connected'
                  ? '🟢 සජීවී විකාශය සක්‍රීයයි (Live)'
                  : connectionStatus === 'polling'
                  ? '🔵 ස්වයංක්‍රීයව සමමුහුර්ත වේ (Polling)'
                  : '🟡 නැවත සම්බන්ධ වෙමින්...'}
              </span>
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            {subtitle}
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
              soundEnabled
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
            }`}
            title={soundEnabled ? 'ශබ්ද දැනුම්දීම් සක්‍රීයයි (Mute)' : 'ශබ්ද දැනුම්දීම් අක්‍රීයයි (Unmute)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchActivities(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl border border-stone-200 dark:border-stone-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>යාවත්කාලීන කරන්න</span>
          </button>

          {/* Simulation Trigger Dropdown for Testing */}
          {allowSimulate && (
            <div className="flex items-center gap-1">
              <button
                disabled={isSimulating}
                onClick={() => handleSimulateEvent('enrollment')}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold text-[11px] rounded-xl border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                title="ශිෂ්‍ය ලියාපදිංචි පරීක්ෂණ ක්‍රියාවක් විකාශය කරන්න"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ ශිෂ්‍ය ඇතුළත් කිරීම</span>
              </button>

              <button
                disabled={isSimulating}
                onClick={() => handleSimulateEvent('grade')}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-bold text-[11px] rounded-xl border border-blue-200 dark:border-blue-800 transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                title="විභාග ලකුණු යාවත්කාලීන කිරීමේ පරීක්ෂණ ක්‍රියාවක් විකාශය කරන්න"
              >
                <Award className="w-3.5 h-3.5" />
                <span>+ ලකුණු යාවත්කාලීන</span>
              </button>
            </div>
          )}

          {/* Clear Logs Button */}
          {allowClear && onClearLogs && activities.length > 0 && (
            <button
              onClick={onClearLogs}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900 transition cursor-pointer"
              title="සටහන් හිස් කරන්න (Clear Feed)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {[
            { id: 'all', label: 'සියල්ල (All)' },
            { id: 'enrollment', label: '🎓 ලියාපදිංචි (Enrollments)' },
            { id: 'grades', label: '📊 ලකුණු (Grades)' },
            { id: 'exam', label: '📝 විභාග (Exams)' },
            { id: 'material', label: '📚 නිබන්ධන (Materials)' },
            { id: 'notice', label: '📢 නිවේදන (Notices)' },
            { id: 'system', label: '⚙️ පද්ධති (System)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                selectedCategory === tab.id
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Filter Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input autoComplete="name" id="realtimeactivityfeed-searchQuery" name="searchQuery"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ක්‍රියාකාරකම් සොයන්න..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-600 transition"
          />
        </div>
      </div>

      {/* Activity Items List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredActivities.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800/80 text-stone-400 mx-auto flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {searchQuery
                ? 'සෙවුමට ගැළපෙන ක්‍රියාකාරකම් හමු නොවීය.'
                : 'තවම සජීවී ක්‍රියාකාරකම් සටහන් නොමැත. ඉහත බොත්තම ඔබා පරීක්ෂණ ක්‍රියාවක් විකාශය කළ හැක.'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredActivities.map((act) => {
              const catInfo = categoryConfig[act.category || 'system'] || categoryConfig.system;
              const IconComp = catInfo.icon;
              const isNewlyAdded = newlyAddedIds.has(act.id);
              const isExpanded = expandedDetailsId === act.id;
              const hasMetadata = act.metadata && Object.keys(act.metadata).length > 0;

              return (
                <motion.div
                  key={act.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    backgroundColor: isNewlyAdded ? 'rgba(254, 243, 199, 0.45)' : undefined,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className={`p-3 rounded-2xl border transition-all ${
                    isNewlyAdded
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-800/40 hover:bg-white dark:hover:bg-stone-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left Icon & Main Text */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Actor Badge */}
                          <span className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                            {act.actor || act.userName || 'පද්ධතිය'}
                          </span>

                          {/* Action Pill */}
                          <span
                            className={`px-2 py-0.5 rounded-lg font-bold text-[10px] border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}
                          >
                            {act.action}
                          </span>

                          {/* New Arrival Indicator */}
                          {isNewlyAdded && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 font-black text-[9px] uppercase tracking-wider animate-bounce">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Details String */}
                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed break-words">
                          {act.details}
                        </p>

                        {/* Expandable Metadata Bar */}
                        {hasMetadata && (
                          <div className="pt-1">
                            <button
                              onClick={() => setExpandedDetailsId(isExpanded ? null : act.id)}
                              className="text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'අතිරේක තොරතුරු සඟවන්න' : 'වැඩිදුර විස්තර (Metadata)'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Object.entries(act.metadata!).map(([key, val]) => (
                                  <div key={key} className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                      {key}:
                                    </span>
                                    <p className="font-bold text-stone-800 dark:text-stone-200 truncate">
                                      {String(val)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Timestamp */}
                    <div
                      className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 shrink-0 font-medium self-start pt-0.5"
                      title={new Date(act.timestamp || act.created_at || Date.now()).toLocaleString('si-LK')}
                    >
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{formatTimeRelative(act.timestamp || act.created_at || new Date().toISOString())}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Stats Bar */}
      <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <span>සම්පූර්ණ සටහන්: <strong className="text-stone-800 dark:text-stone-200">{filteredActivities.length}</strong> ක්</span>
          <span>•</span>
          <span>කාණ්ඩය: <strong className="text-amber-800 dark:text-amber-300">{categoryConfig[selectedCategory]?.label || 'සියලුම කාණ්ඩ'}</strong></span>
        </div>
        <span className="italic text-[10px]">
          ශ්‍රී සුමන මහා පිරිවෙන් සජීවී පාලන පද්ධතිය
        </span>
      </div>
    </div>
  );
};
