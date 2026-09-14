import React, { useState } from 'react';
import { SiteSettings } from '../../context/PublicSiteContext';
import {
  Building,
  Save,
  Upload,
  Image as ImageIcon,
  Users,
  BookOpen,
  Layers,
  Phone,
  Landmark,
  Compass,
} from 'lucide-react';
import { uploadFileWithProgress, type UploadProgressInfo } from '../../utils/fileUpload';
import { Loader2 } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageHelper';

interface AboutSettingsTabProps {
  settingsForm: SiteSettings;
  setSettingsForm: React.Dispatch<React.SetStateAction<SiteSettings>>;
  setFormDirty: (dirty: boolean) => void;
  onSave: (e: React.FormEvent) => void;
  showNotification?: (msg: string) => void;
  updateSiteSettings?: (newSettings: Partial<SiteSettings>) => void;
  handleFileUploadHelper?: (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string, sizeStr?: string) => void
  ) => void;
}

export const AboutSettingsTab: React.FC<AboutSettingsTabProps> = ({
  settingsForm,
  setSettingsForm,
  setFormDirty,
  onSave,
  showNotification,
  updateSiteSettings,
}) => {
  const [isUploadingCampus, setIsUploadingCampus] = useState<boolean>(false);
  const [campusUploadProgress, setCampusUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [isUploadingPrincipal, setIsUploadingPrincipal] = useState<boolean>(false);
  const [principalUploadProgress, setPrincipalUploadProgress] = useState<UploadProgressInfo | null>(null);

  const handleTextChange = (field: keyof SiteSettings, value: string) => {
    setFormDirty(true);
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCampusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCampus(true);
      setCampusUploadProgress(null);
      if (showNotification) showNotification('පරිශ්‍රයේ ඡායාරූපය Upload වෙමින් පවතී...');
      const url = await uploadFileWithProgress(file, (prog) => {
        setCampusUploadProgress(prog);
      });
      if (url) {
        setFormDirty(true);
        setSettingsForm((prev) => ({ ...prev, campusImageUrl: url }));
        if (updateSiteSettings) updateSiteSettings({ campusImageUrl: url });
        if (showNotification) showNotification('✅ පරිශ්‍රයේ ඡායාරූපය සාර්ථකව Upload විය!');
      }
    } catch (err) {
      if (showNotification) showNotification('❌ ඡායාරූපය Upload දෝෂයක් මතු විය.');
    } finally {
      setIsUploadingCampus(false);
      setCampusUploadProgress(null);
    }
  };

  const handlePrincipalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPrincipal(true);
      setPrincipalUploadProgress(null);
      if (showNotification) showNotification('පරිවේණාධිපති හිමිගේ ඡායාරූපය Upload වෙමින් පවතී...');
      const url = await uploadFileWithProgress(file, (prog) => {
        setPrincipalUploadProgress(prog);
      });
      if (url) {
        setFormDirty(true);
        setSettingsForm((prev) => ({ ...prev, principalImageUrl: url }));
        if (updateSiteSettings) updateSiteSettings({ principalImageUrl: url });
        if (showNotification) showNotification('✅ ඡායාරූපය සාර්ථකව Upload විය!');
      }
    } catch (err) {
      if (showNotification) showNotification('❌ ඡායාරූපය Upload දෝෂයක් මතු විය.');
    } finally {
      setIsUploadingPrincipal(false);
      setPrincipalUploadProgress(null);
    }
  };

  return (
    <form
      onSubmit={onSave}
      className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-6 text-slate-900 dark:text-white select-none"
    >
      {/* 📱 1. CLEAN HEADER WITH TOP SAVE BUTTON */}
      <div className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Building className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
            අප ගැන විස්තර සංස්කාරකය (About Us Editor)
          </h2>
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>වෙනස්කම් සුරකින්න</span>
        </button>
      </div>

      {/* ──────── SECTION 1: OVERVIEW & BANNER TITLES ──────── */}
      <div className="bg-slate-50/70 dark:bg-stone-800/50 border border-slate-200/80 dark:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-stone-700 pb-2">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>1. පිටුවේ ප්‍රධාන මාතෘකා (Page Banner Titles)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              කුඩා ටැග් පෙළ (Sinhala Tagline)
            </label>
            <input id="aboutsettingstab-input-1" name="aboutsettingstab-input-1"
              type="text"
              value={settingsForm.aboutHeaderTagSinhala || ''}
              onChange={(e) => handleTextChange('aboutHeaderTagSinhala', e.target.value)}
              placeholder="ආයතනික හැඳින්වීම"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tagline (English)
            </label>
            <input id="aboutsettingstab-input-2" name="aboutsettingstab-input-2"
              type="text"
              value={settingsForm.aboutHeaderTag || ''}
              onChange={(e) => handleTextChange('aboutHeaderTag', e.target.value)}
              placeholder="Institutional Overview"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ප්‍රධාන මාතෘකාව (Sinhala Title)
            </label>
            <input id="aboutsettingstab-input-3" name="aboutsettingstab-input-3"
              type="text"
              value={settingsForm.aboutTitleSinhala || ''}
              onChange={(e) => handleTextChange('aboutTitleSinhala', e.target.value)}
              placeholder="අපගේ ආයතනය පිළිබඳව"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Main Title (English)
            </label>
            <input id="aboutsettingstab-input-4" name="aboutsettingstab-input-4"
              type="text"
              value={settingsForm.aboutTitle || ''}
              onChange={(e) => handleTextChange('aboutTitle', e.target.value)}
              placeholder="About Our Institution"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
            />
          </div>
        </div>
      </div>

      {/* ──────── SECTION 2: HISTORY, VISION & MISSION ──────── */}
      <div className="bg-slate-50/70 dark:bg-stone-800/50 border border-slate-200/80 dark:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-stone-700 pb-2">
          <Compass className="w-4 h-4 text-amber-600" />
          <span>2. ශාසනික ඉතිහාසය, දැක්ම සහ මෙහෙවර (History, Vision & Mission)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ඉතිහාස කොටසේ මාතෘකාව (Sinhala)
            </label>
            <input id="aboutsettingstab-input-5" name="aboutsettingstab-input-5"
              type="text"
              value={settingsForm.aboutHistoryHeadingSinhala || ''}
              onChange={(e) => handleTextChange('aboutHistoryHeadingSinhala', e.target.value)}
              placeholder="අපගේ අභිමානවත් ඉතිහාසය"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              History Heading (English)
            </label>
            <input id="aboutsettingstab-input-6" name="aboutsettingstab-input-6"
              type="text"
              value={settingsForm.aboutHistoryHeading || ''}
              onChange={(e) => handleTextChange('aboutHistoryHeading', e.target.value)}
              placeholder="Our Noble History"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                පිරිවෙන් ඉතිහාසය (Sinhala Description)
              </label>
              <textarea id="aboutsettingstab-textarea-7" name="aboutsettingstab-textarea-7"
                value={settingsForm.aboutHistorySinhala || ''}
                onChange={(e) => handleTextChange('aboutHistorySinhala', e.target.value)}
                rows={4}
                placeholder="ශ්‍රී සුමන මහා පිරිවෙන් ඉතිහාසය පිළිබඳ විස්තරය..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                History Description (English)
              </label>
              <textarea id="aboutsettingstab-textarea-8" name="aboutsettingstab-textarea-8"
                value={settingsForm.aboutHistory || ''}
                onChange={(e) => handleTextChange('aboutHistory', e.target.value)}
                rows={4}
                placeholder="Founded as a premier monastic educational institution..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              දැක්ම (Vision - Sinhala)
            </label>
            <textarea id="aboutsettingstab-textarea-9" name="aboutsettingstab-textarea-9"
              value={settingsForm.visionSinhala || ''}
              onChange={(e) => handleTextChange('visionSinhala', e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Vision (English)
            </label>
            <textarea id="aboutsettingstab-textarea-10" name="aboutsettingstab-textarea-10"
              value={settingsForm.vision || ''}
              onChange={(e) => handleTextChange('vision', e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              මෙහෙවර (Mission - Sinhala)
            </label>
            <textarea id="aboutsettingstab-textarea-11" name="aboutsettingstab-textarea-11"
              value={settingsForm.missionSinhala || ''}
              onChange={(e) => handleTextChange('missionSinhala', e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mission (English)
            </label>
            <textarea id="aboutsettingstab-textarea-12" name="aboutsettingstab-textarea-12"
              value={settingsForm.mission || ''}
              onChange={(e) => handleTextChange('mission', e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ──────── SECTION 3: CAMPUS CENTRAL PHOTO ──────── */}
      <div className="bg-slate-50/70 dark:bg-stone-800/50 border border-slate-200/80 dark:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-stone-700 pb-2">
          <ImageIcon className="w-4 h-4 text-amber-600" />
          <span>3. පරිශ්‍රයේ ප්‍රධාන ඡායාරූපය (Campus Central Photo & Caption)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-4 h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-stone-700 bg-stone-900 shadow-sm relative group">
            <img
              src={getImageUrl(settingsForm.campusImageUrl)}
              alt="Campus Preview"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>

          <div className="sm:col-span-8 space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ඡායාරූප URL (Campus Photo URL / Path)
              </label>
              <input id="aboutsettingstab-input-13" name="aboutsettingstab-input-13"
                type="text"
                value={settingsForm.campusImageUrl || ''}
                onChange={(e) => handleTextChange('campusImageUrl', e.target.value)}
                placeholder="/campus.jpg"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              />
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black rounded-xl cursor-pointer transition active:scale-95 shadow-md">
              {isUploadingCampus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isUploadingCampus ? 'උඩුගත වෙමින් පවතී...' : 'පරිශ්‍රයේ ඡායාරූපය Upload කරන්න'}</span>
              <input id="aboutsettingstab-input-14" name="file_14"
                type="file"
                accept="image/*"
                disabled={isUploadingCampus}
                className="hidden"
                onChange={handleCampusUpload}
              />
            </label>

            {/* Campus Photo Upload Live Progress Indicator */}
            {isUploadingCampus && campusUploadProgress && (
              <div className="mt-2 p-3 bg-amber-500/10 dark:bg-stone-800 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                    <span>පරිශ්‍රයේ ඡායාරූපය සර්වර් වෙත උඩුගත වෙමින් පවතී...</span>
                  </span>
                  <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{campusUploadProgress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-150"
                    style={{ width: `${campusUploadProgress.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>උඩුගත ප්‍රමාණය:</span>
                  <span className="font-bold text-amber-800 dark:text-amber-300">
                    {campusUploadProgress.loadedFormatted} / {campusUploadProgress.totalFormatted} ({campusUploadProgress.loaded.toLocaleString()} Bytes)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ඡායාරූපයේ යටින් ඇති විස්තරය (Caption - Sinhala)
            </label>
            <input id="aboutsettingstab-input-15" name="aboutsettingstab-input-15"
              type="text"
              value={settingsForm.campusImageCaptionSinhala || ''}
              onChange={(e) => handleTextChange('campusImageCaptionSinhala', e.target.value)}
              placeholder="ශ්‍රී සුමන මහා පිරිවෙන් මධ්‍යම පරිශ්‍රය (මුද්දුව, රත්නපුර)"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Campus Photo Caption (English)
            </label>
            <input id="aboutsettingstab-input-16" name="aboutsettingstab-input-16"
              type="text"
              value={settingsForm.campusImageCaption || ''}
              onChange={(e) => handleTextChange('campusImageCaption', e.target.value)}
              placeholder="Sri Sumana Pirivena Central Campus (Mudduwa, Ratnapura)"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ──────── SECTION 4: KEY INSTITUTIONAL PILLARS ──────── */}
      <div className="bg-slate-50/70 dark:bg-stone-800/50 border border-slate-200/80 dark:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-stone-700 pb-2">
          <Layers className="w-4 h-4 text-amber-600" />
          <span>4. ප්‍රධාන ආයතනික අංග (Key Institutional Pillars & Features)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              කොටසේ මාතෘකාව (Pillars Title - Sinhala)
            </label>
            <input id="aboutsettingstab-input-17" name="aboutsettingstab-input-17"
              type="text"
              value={settingsForm.aboutPillarsTitleSinhala || ''}
              onChange={(e) => handleTextChange('aboutPillarsTitleSinhala', e.target.value)}
              placeholder="ප්‍රධාන ආයතනික අංග"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pillars Title (English)
            </label>
            <input id="aboutsettingstab-input-18" name="aboutsettingstab-input-18"
              type="text"
              value={settingsForm.aboutPillarsTitle || ''}
              onChange={(e) => handleTextChange('aboutPillarsTitle', e.target.value)}
              placeholder="Key Institutional Pillars"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              විභාග මධ්‍යස්ථාන විස්තරය (Exam Center - Sinhala)
            </label>
            <input id="aboutsettingstab-input-19" name="aboutsettingstab-input-19"
              type="text"
              value={settingsForm.aboutPillarExamCenterSinhala || ''}
              onChange={(e) => handleTextChange('aboutPillarExamCenterSinhala', e.target.value)}
              placeholder="පූර්ණ ප්‍රාචීන විභාග මධ්‍යස්ථානය"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Exam Center Item (English)
            </label>
            <input id="aboutsettingstab-input-20" name="aboutsettingstab-input-20"
              type="text"
              value={settingsForm.aboutPillarExamCenter || ''}
              onChange={(e) => handleTextChange('aboutPillarExamCenter', e.target.value)}
              placeholder="Full Pracheena Examination Center"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ආරාම/දාන ශාලා විස්තරය (Monastic Residence - Sinhala)
            </label>
            <input id="aboutsettingstab-input-21" name="aboutsettingstab-input-21"
              type="text"
              value={settingsForm.aboutPillarResidenceSinhala || ''}
              onChange={(e) => handleTextChange('aboutPillarResidenceSinhala', e.target.value)}
              placeholder="නාවාසික ආරාම සංකීර්ණය හා දාන ශාලාව"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Monastic Residence Item (English)
            </label>
            <input id="aboutsettingstab-input-22" name="aboutsettingstab-input-22"
              type="text"
              value={settingsForm.aboutPillarResidence || ''}
              onChange={(e) => handleTextChange('aboutPillarResidence', e.target.value)}
              placeholder="Dedicated Monastic Residence & Alms Hall"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              විද්‍යාගාර හා පුස්තකාල විස්තරය (Smart Lab - Sinhala)
            </label>
            <input id="aboutsettingstab-input-23" name="aboutsettingstab-input-23"
              type="text"
              value={settingsForm.aboutPillarSmartLabSinhala || ''}
              onChange={(e) => handleTextChange('aboutPillarSmartLabSinhala', e.target.value)}
              placeholder="ස්මාර්ට් පරිගණක විද්‍යාගාරය හා ඩිජිටල් පුස්තකාලය"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Smart Lab & Library Item (English)
            </label>
            <input id="aboutsettingstab-input-24" name="aboutsettingstab-input-24"
              type="text"
              value={settingsForm.aboutPillarSmartLab || ''}
              onChange={(e) => handleTextChange('aboutPillarSmartLab', e.target.value)}
              placeholder="Smart Computer Lab & Digital Library"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              යටින් ඇති විශේෂ සටහන (Footer Note - Sinhala)
            </label>
            <input id="aboutsettingstab-input-25" name="aboutsettingstab-input-25"
              type="text"
              value={settingsForm.aboutPillarsNoteSinhala || ''}
              onChange={(e) => handleTextChange('aboutPillarsNoteSinhala', e.target.value)}
              placeholder="සාමණේර හිමිවරුන් සහ ගිහි සිසුන් උදෙසා උසස් බෞද්ධ අධ්‍යාපනය."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Footer Note (English)
            </label>
            <input id="aboutsettingstab-input-26" name="aboutsettingstab-input-26"
              type="text"
              value={settingsForm.aboutPillarsNote || ''}
              onChange={(e) => handleTextChange('aboutPillarsNote', e.target.value)}
              placeholder="Fostering classical Pali, Sanskrit, and Theravada Buddhist scholarship."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ──────── SECTION 5: MONASTIC LEADERSHIP BOARD ──────── */}
      <div className="bg-slate-50/70 dark:bg-stone-800/50 border border-slate-200/80 dark:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-4 text-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-stone-700 pb-2">
          <Users className="w-4 h-4 text-amber-600" />
          <span>5. පිරිවෙන් ආචාර්ය හා පාලක මණ්ඩලය (Leadership & Board Members)</span>
        </h3>

        {/* 1. Principal Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 space-y-3">
          <div className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-stone-800 pb-1.5">
            <span>☸ 1. පරිවේණාධිපති / කෘත්‍යාධිකාරී හිමි (Principal / Chief Incumbent)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                නම (Sinhala Name)
              </label>
              <input id="aboutsettingstab-input-27" name="aboutsettingstab-input-27"
                type="text"
                value={settingsForm.principalNameSinhala || ''}
                onChange={(e) => handleTextChange('principalNameSinhala', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Name (English)
              </label>
              <input id="aboutsettingstab-input-28" name="aboutsettingstab-input-28"
                type="text"
                value={settingsForm.principalName || ''}
                onChange={(e) => handleTextChange('principalName', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                තනතුර (Title - Sinhala)
              </label>
              <input id="aboutsettingstab-input-29" name="aboutsettingstab-input-29"
                type="text"
                value={settingsForm.principalTitleSinhala || ''}
                onChange={(e) => handleTextChange('principalTitleSinhala', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Title (English)
              </label>
              <input id="aboutsettingstab-input-30" name="aboutsettingstab-input-30"
                type="text"
                value={settingsForm.principalTitle || ''}
                onChange={(e) => handleTextChange('principalTitle', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                පණිවිඩය / විස්තරය (Message - Sinhala)
              </label>
              <textarea id="aboutsettingstab-textarea-31" name="aboutsettingstab-textarea-31"
                rows={2}
                value={settingsForm.principalMessageSinhala || ''}
                onChange={(e) => handleTextChange('principalMessageSinhala', e.target.value)}
                placeholder="පරිවේණාධිපති හිමිගේ පණිවිඩය..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Principal Message (English)
              </label>
              <textarea id="aboutsettingstab-textarea-32" name="aboutsettingstab-textarea-32"
                rows={2}
                value={settingsForm.principalMessage || ''}
                onChange={(e) => handleTextChange('principalMessage', e.target.value)}
                placeholder="Principal's Message..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                පරිවේණාධිපති හිමිගේ ඡායාරූපය (Photo URL or Upload)
              </label>
              <div className="flex gap-2 items-center">
                <input id="aboutsettingstab-input-33" name="aboutsettingstab-input-33"
                  type="text"
                  value={settingsForm.principalImageUrl || ''}
                  onChange={(e) => handleTextChange('principalImageUrl', e.target.value)}
                  placeholder="/principal.jpg"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                />
                <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shrink-0 transition active:scale-95 shadow-xs">
                  {isUploadingPrincipal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isUploadingPrincipal ? 'උඩුගත වෙමින්...' : 'Upload'}</span>
                  <input id="aboutsettingstab-input-34" name="file_34"
                    type="file"
                    accept="image/*"
                    disabled={isUploadingPrincipal}
                    className="hidden"
                    onChange={handlePrincipalUpload}
                  />
                </label>
              </div>

              {/* Principal Photo Upload Live Progress Indicator */}
              {isUploadingPrincipal && principalUploadProgress && (
                <div className="mt-2 p-3 bg-amber-500/10 dark:bg-stone-800 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                      <span>පරිවේණාධිපති හිමිගේ ඡායාරූපය සර්වර් වෙත උඩුගත වෙමින් පවතී...</span>
                    </span>
                    <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{principalUploadProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-150"
                      style={{ width: `${principalUploadProgress.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>උඩුගත ප්‍රමාණය:</span>
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                      {principalUploadProgress.loadedFormatted} / {principalUploadProgress.totalFormatted} ({principalUploadProgress.loaded.toLocaleString()} Bytes)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Vice Principal Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 space-y-3">
          <div className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-stone-800 pb-1.5">
            <span>☸ 2. නියෝජ්‍ය පරිවේණාධිපති / ලේඛකාධිකාරී (Vice Principal & Registrar)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                නම (Sinhala Name)
              </label>
              <input id="aboutsettingstab-input-35" name="aboutsettingstab-input-35"
                type="text"
                value={settingsForm.vicePrincipalNameSinhala || ''}
                onChange={(e) => handleTextChange('vicePrincipalNameSinhala', e.target.value)}
                placeholder="පූජ්‍ය මුද්දුවේ ධම්මික හිමි"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Name (English)
              </label>
              <input id="aboutsettingstab-input-36" name="aboutsettingstab-input-36"
                type="text"
                value={settingsForm.vicePrincipalName || ''}
                onChange={(e) => handleTextChange('vicePrincipalName', e.target.value)}
                placeholder="Ven. Mudduwe Dhammika Thero"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                තනතුර (Title - Sinhala)
              </label>
              <input id="aboutsettingstab-input-37" name="aboutsettingstab-input-37"
                type="text"
                value={settingsForm.vicePrincipalTitleSinhala || ''}
                onChange={(e) => handleTextChange('vicePrincipalTitleSinhala', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Title (English)
              </label>
              <input id="aboutsettingstab-input-38" name="aboutsettingstab-input-38"
                type="text"
                value={settingsForm.vicePrincipalTitle || ''}
                onChange={(e) => handleTextChange('vicePrincipalTitle', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 3. Senior Teacher Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 space-y-3">
          <div className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-stone-800 pb-1.5">
            <span>☸ 3. ජ්‍යෙෂ්ඨ ආචාර්ය හිමි (Senior Head of Pali & Tripitaka)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                නම (Sinhala Name)
              </label>
              <input id="aboutsettingstab-input-39" name="aboutsettingstab-input-39"
                type="text"
                value={settingsForm.seniorTeacherNameSinhala || ''}
                onChange={(e) => handleTextChange('seniorTeacherNameSinhala', e.target.value)}
                placeholder="පූජ්‍ය සබරගමුවේ සුමනසාර හිමි"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Name (English)
              </label>
              <input id="aboutsettingstab-input-40" name="aboutsettingstab-input-40"
                type="text"
                value={settingsForm.seniorTeacherName || ''}
                onChange={(e) => handleTextChange('seniorTeacherName', e.target.value)}
                placeholder="Ven. Sabaragamuwe Sumanasara Thero"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                තනතුර (Title - Sinhala)
              </label>
              <input id="aboutsettingstab-input-41" name="aboutsettingstab-input-41"
                type="text"
                value={settingsForm.seniorTeacherTitleSinhala || ''}
                onChange={(e) => handleTextChange('seniorTeacherTitleSinhala', e.target.value)}
                placeholder="පාලි හා ත්‍රිපිටක අංශ භාර ජ්‍යෙෂ්ඨ ආචාර්ය"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Title (English)
              </label>
              <input id="aboutsettingstab-input-42" name="aboutsettingstab-input-42"
                type="text"
                value={settingsForm.seniorTeacherTitle || ''}
                onChange={(e) => handleTextChange('seniorTeacherTitle', e.target.value)}
                placeholder="Senior Head of Pali & Tripitaka"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ──────── SECTION 6: CONTACT INFORMATION ──────── */}
      <div className="bg-slate-50/70 dark:bg-stone-800/50 border border-slate-200/80 dark:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-stone-700 pb-2">
          <Phone className="w-4 h-4 text-amber-600" />
          <span>6. සම්බන්ධතා සහ ලිපිනය (Contact Information)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              දුරකථන අංකය (Phone)
            </label>
            <input id="aboutsettingstab-input-43" name="aboutsettingstab-input-43"
              type="text"
              value={settingsForm.phone || ''}
              onChange={(e) => handleTextChange('phone', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              විද්‍යුත් තැපෑල (Email)
            </label>
            <input id="aboutsettingstab-input-44" name="email_44"
              type="email"
              value={settingsForm.email || ''}
              onChange={(e) => handleTextChange('email', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ලිපිනය (Address)
            </label>
            <input id="aboutsettingstab-input-45" name="aboutsettingstab-input-45"
              type="text"
              value={settingsForm.address || ''}
              onChange={(e) => handleTextChange('address', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ──────── SECTION 7: OFFICIAL BANK DETAILS ──────── */}
      <div className="bg-slate-50/70 dark:bg-stone-800/50 border border-slate-200/80 dark:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-stone-700 pb-2">
          <Landmark className="w-4 h-4 text-amber-600" />
          <span>7. පිරිවෙන් නිල බැංකු ගිණුම් විස්තර (Official Bank Details)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              බැංකුවේ නම (Bank Name)
            </label>
            <input id="aboutsettingstab-input-46" name="aboutsettingstab-input-46"
              type="text"
              value={settingsForm.bankName || 'Bank of Ceylon (BOC)'}
              onChange={(e) => handleTextChange('bankName', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ශාඛාව (Branch Name)
            </label>
            <input id="aboutsettingstab-input-47" name="aboutsettingstab-input-47"
              type="text"
              value={settingsForm.bankBranch || 'Ratnapura Main Branch'}
              onChange={(e) => handleTextChange('bankBranch', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ගිණුමේ නම (Account Name)
            </label>
            <input id="aboutsettingstab-input-48" name="aboutsettingstab-input-48"
              type="text"
              value={settingsForm.bankAccountName || 'Sri Sumana Maha Pirivena Development Trust'}
              onChange={(e) => handleTextChange('bankAccountName', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ගිණුම් අංකය (Account Number)
            </label>
            <input id="aboutsettingstab-input-49" name="aboutsettingstab-input-49"
              type="text"
              value={settingsForm.bankAccountNumber || '000789456123'}
              onChange={(e) => handleTextChange('bankAccountNumber', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono font-extrabold text-amber-600 dark:text-amber-400"
            />
          </div>
        </div>
      </div>

      {/* 💾 BOTTOM SAVE ACTION */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-2xl shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition"
        >
          <Save className="w-4 h-4" />
          <span>වෙනස්කම් සුරකින්න (Save About Settings)</span>
        </button>
      </div>
    </form>
  );
};
