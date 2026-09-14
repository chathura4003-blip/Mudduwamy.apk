import React, { useState } from 'react';
import { SiteSettings } from '../../context/PublicSiteContext';
import {
  Globe,
  Save,
  Upload,
  Image as ImageIcon,
  BarChart3,
  Share2,
  ShieldCheck,
  RotateCcw,
  Building,
  GraduationCap,
  Calendar,
  Loader2,
} from 'lucide-react';
import { uploadFileWithProgress, type UploadProgressInfo } from '../../utils/fileUpload';

interface GeneralSettingsTabProps {
  settingsForm: SiteSettings;
  setSettingsForm: React.Dispatch<React.SetStateAction<SiteSettings>>;
  setFormDirty: (dirty: boolean) => void;
  onSave: (e: React.FormEvent) => void;
  showNotification: (msg: string) => void;
  updateSiteSettings?: (newSettings: Partial<SiteSettings>) => void;
  handleFileUploadHelper?: (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string, sizeStr?: string) => void
  ) => void;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  settingsForm,
  setSettingsForm,
  setFormDirty,
  onSave,
  showNotification,
  updateSiteSettings,
}) => {
  const [logoUploadProgress, setLogoUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [heroUploadProgress, setHeroUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [isUploadingHero, setIsUploadingHero] = useState<boolean>(false);
  return (
    <form
      onSubmit={onSave}
      className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-8"
    >
      {/* SECTION 1: PIRIVENA BASIC INFORMATION */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-stone-800 pb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>වෙබ් අඩවි මූලික තොරතුරු</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="generalsettingstab-pirivenaNameSinhala" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              පිරිවෙනේ නම (සිංහල)
            </label>
            <input autoComplete="name" id="generalsettingstab-pirivenaNameSinhala" name="pirivenaNameSinhala"
              type="text"
              value={settingsForm.pirivenaNameSinhala}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, pirivenaNameSinhala: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500 font-bold text-amber-950 dark:text-amber-100"
              required
            />
          </div>

          <div>
            <label htmlFor="generalsettingstab-pirivenaName" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              පිරිවෙනේ නම (English)
            </label>
            <input autoComplete="name" id="generalsettingstab-pirivenaName" name="pirivenaName"
              type="text"
              value={settingsForm.pirivenaName}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, pirivenaName: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="generalsettingstab-registrationNo" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ලියාපදිංචි අංකය (Registration No)
            </label>
            <input autoComplete="name" id="generalsettingstab-registrationNo" name="registrationNo"
              type="text"
              value={settingsForm.registrationNo}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, registrationNo: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="generalsettingstab-heroTitleSinhala" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              Hero Title (සිංහල ශීර්ෂය)
            </label>
            <input autoComplete="name" id="generalsettingstab-heroTitleSinhala" name="heroTitleSinhala"
              type="text"
              value={settingsForm.heroTitleSinhala}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, heroTitleSinhala: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="generalsettingstab-heroSubtitleSinhala" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              Hero Subtitle (සිංහල උප ශීර්ෂය)
            </label>
            <input autoComplete="name" id="generalsettingstab-heroSubtitleSinhala" name="heroSubtitleSinhala"
              type="text"
              value={settingsForm.heroSubtitleSinhala}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, heroSubtitleSinhala: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="generalsettingstab-heroMottoSinhala" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              Hero Motto (සිංහල දැක්ම / තේමා පාඨය)
            </label>
            <textarea autoComplete="name" id="generalsettingstab-heroMottoSinhala" name="heroMottoSinhala"
              value={settingsForm.heroMottoSinhala}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, heroMottoSinhala: e.target.value });
              }}
              rows={2}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>


      {/* SECTION 2: PIRIVENA OFFICIAL LOGO / EMBLEM MANAGER */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-orange-50/50 dark:from-stone-800/80 dark:via-stone-800/60 dark:to-stone-900 border-2 border-amber-400/80 dark:border-amber-500/30 rounded-3xl p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 dark:border-amber-800/60 pb-3">
          <h3 className="font-serif font-bold text-base sm:text-lg text-amber-950 dark:text-amber-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span>පිරිවෙන් නිල මුද්‍රාව / ලාංඡනය කළමනාකරණය (Pirivena Official Emblem & Logo)</span>
          </h3>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 rounded-full border border-amber-300 dark:border-amber-700">
            සජීවී ලාංඡනය (Live Emblem)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Logo Live Preview Cards (Light & Dark Mode Previews) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            {/* Light Mode Preview Card */}
            <div className="flex flex-col items-center justify-center p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/80 rounded-2xl text-center shadow-xs">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 bg-white rounded-xl shadow-xs border border-amber-200 mb-2">
                <img
                  src={settingsForm.heroLogoUrl || '/pirivena-logo.svg'}
                  alt="Logo Preview Light"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pirivena-logo.svg';
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-amber-950 dark:text-amber-200">Light Mode</span>
            </div>

            {/* Dark Mode Preview Card */}
            <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-amber-500/40 rounded-2xl text-center shadow-xs">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 bg-stone-950 rounded-xl shadow-xs border border-stone-800 mb-2">
                <img
                  src={settingsForm.heroLogoUrl || '/pirivena-logo.svg'}
                  alt="Logo Preview Dark"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pirivena-logo.svg';
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-amber-300">Dark Mode</span>
            </div>
          </div>

          {/* Logo Upload & URL Controls */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <label htmlFor="generalsettingstab-heroLogoUrl" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                ලියාපදිංචි ලාංඡන රූපයේ URL එක (Logo Image URL or Path)
              </label>
              <input autoComplete="name" id="generalsettingstab-heroLogoUrl" name="heroLogoUrl"
                type="text"
                value={settingsForm.heroLogoUrl || ''}
                onChange={(e) => {
                  setFormDirty(true);
                  const val = e.target.value;
                  setSettingsForm((prev) => ({ ...prev, heroLogoUrl: val }));
                  if (updateSiteSettings) updateSiteSettings({ heroLogoUrl: val });
                }}
                placeholder="උදා: /pirivena-logo.svg හෝ uploaded logo URL"
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="generalsettingstab-file-8" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95">
                {isUploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isUploadingLogo ? 'ලාංඡනය Upload වෙමින් පවතී...' : 'නව ලාංඡනයක් Upload කරන්න (Upload Logo)'}</span>
                <input autoComplete="off" id="generalsettingstab-file-8" name="file-8"
                  type="file"
                  accept="image/*,.svg"
                  disabled={isUploadingLogo}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        setIsUploadingLogo(true);
                        setLogoUploadProgress(null);
                        showNotification('පිරිවෙන් ලාංඡනය Upload වෙමින් පවතී...');
                        const url = await uploadFileWithProgress(file, (prog) => {
                          setLogoUploadProgress(prog);
                        });
                        if (url) {
                          setFormDirty(true);
                          setSettingsForm((prev) => ({ ...prev, heroLogoUrl: url }));
                          if (updateSiteSettings) updateSiteSettings({ heroLogoUrl: url });
                          showNotification('✅ පිරිවෙන් නිල ලාංඡනය (Pirivena Logo) සාර්ථකව Upload වී යාවත්කාලීන විය!');
                        }
                      } catch (err) {
                        showNotification('❌ ලාංඡනය Upload දෝෂයක් මතු විය.');
                      } finally {
                        setIsUploadingLogo(false);
                        setLogoUploadProgress(null);
                      }
                    }
                  }}
                />
              </label>

              <button
                type="button"
                disabled={isUploadingLogo}
                onClick={() => {
                  setFormDirty(true);
                  const defaultUrl = '/pirivena-logo.svg';
                  setSettingsForm((prev) => ({ ...prev, heroLogoUrl: defaultUrl }));
                  if (updateSiteSettings) updateSiteSettings({ heroLogoUrl: defaultUrl });
                  showNotification('පිරිවෙන් මුල් නිල ලාංඡනයට (Default SVG) සාර්ථකව මාරු විය!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>මුල් ලාංඡනයට Reset කරන්න</span>
              </button>
            </div>

            {/* Logo Upload Live Progress Indicator */}
            {isUploadingLogo && logoUploadProgress && (
              <div className="mt-2 p-3 bg-amber-500/10 dark:bg-stone-800 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                    <span>ලාංඡනය සර්වර් වෙත උඩුගත වෙමින් පවතී...</span>
                  </span>
                  <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{logoUploadProgress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-150"
                    style={{ width: `${logoUploadProgress.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>උඩුගත ප්‍රමාණය:</span>
                  <span className="font-bold text-amber-800 dark:text-amber-300">
                    {logoUploadProgress.loadedFormatted} / {logoUploadProgress.totalFormatted} ({logoUploadProgress.loaded.toLocaleString()} Bytes)
                  </span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed font-medium">
              ✨ <b>සටහන:</b> මෙහි ලාංඡනය (Logo) වෙනස් කළ විට එය මුළු වෙබ් අඩවියේම Header Navbar, Footer, ශිෂ්‍ය QR හැඳුනුම්පත්, සහතික සහ සියලුම පිටුවල සජීවීව වෙනස් වේ. (නිර්දේශිතයි: Transparent PNG / SVG).
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: HERO BACKGROUND IMAGE & MEDIA MANAGER */}
      <div className="bg-amber-50/70 dark:bg-stone-800/60 border-2 border-amber-300/80 dark:border-stone-700 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-200 border-b border-amber-200 dark:border-stone-700 pb-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          <span>ප්‍රධාන පසුබිම් රූපය සංස්කරණය (Hero Background Photo Manager)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Image Preview Box */}
          <div className="md:col-span-5 relative h-44 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-stone-900 group">
            <img
              src={settingsForm.heroImageUrl || '/public.jpg'}
              alt="Hero Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/public.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 text-white text-[11px] font-bold">
              <span>සජීවී පෙරදසුන (Live Preview)</span>
            </div>
          </div>

          <div className="md:col-span-7 space-y-3">
            <div>
              <label htmlFor="generalsettingstab-heroImageUrl" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                ඡායාරූප මාර්ගය / URL (Image URL)
              </label>
              <div className="flex gap-2">
                <input autoComplete="name" id="generalsettingstab-heroImageUrl" name="heroImageUrl"
                  type="text"
                  value={settingsForm.heroImageUrl || ''}
                  onChange={(e) => {
                    setFormDirty(true);
                    const val = e.target.value;
                    setSettingsForm((prev) => ({ ...prev, heroImageUrl: val }));
                    if (updateSiteSettings) updateSiteSettings({ heroImageUrl: val });
                  }}
                  placeholder="උදා: /public.jpg හෝ uploaded image URL"
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="generalsettingstab-statMonksCount150" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                ඔබේ උපාංගයෙන් නව ඡායාරූපයක් Upload කරන්න (Upload Photo)
              </label>
              <label htmlFor="generalsettingstab-file-10" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95">
                {isUploadingHero ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isUploadingHero ? 'ඡායාරූපය Upload වෙමින් පවතී...' : 'ඡායාරූපය තෝරන්න (Browse & Upload)'}</span>
                <input autoComplete="off" id="generalsettingstab-file-10" name="file-10"
                  type="file"
                  accept="image/*"
                  disabled={isUploadingHero}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        setIsUploadingHero(true);
                        setHeroUploadProgress(null);
                        showNotification('Hero Background ඡායාරූපය Upload වෙමින් පවතී...');
                        const url = await uploadFileWithProgress(file, (prog) => {
                          setHeroUploadProgress(prog);
                        });
                        if (url) {
                          setFormDirty(true);
                          setSettingsForm((prev) => ({ ...prev, heroImageUrl: url }));
                          if (updateSiteSettings) updateSiteSettings({ heroImageUrl: url });
                          showNotification('✅ Hero Background Photo Upload වී සාර්ථකව සුරැකිණි! (Saved)');
                        }
                      } catch (err) {
                        showNotification('❌ ඡායාරූපය Upload දෝෂයක් මතු විය.');
                      } finally {
                        setIsUploadingHero(false);
                        setHeroUploadProgress(null);
                      }
                    }
                  }}
                />
              </label>

              {/* Hero Image Upload Live Progress Indicator */}
              {isUploadingHero && heroUploadProgress && (
                <div className="mt-2 p-3 bg-amber-500/10 dark:bg-stone-800 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                      <span>ඡායාරූපය සර්වර් වෙත උඩුගත වෙමින් පවතී...</span>
                    </span>
                    <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{heroUploadProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-150"
                      style={{ width: `${heroUploadProgress.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>උඩුගත ප්‍රමාණය:</span>
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                      {heroUploadProgress.loadedFormatted} / {heroUploadProgress.totalFormatted} ({heroUploadProgress.loaded.toLocaleString()} Bytes)
                    </span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              💡 නිර්දේශිත ඡායාරූප ප්‍රමාණය: 1920 x 1080 high quality JPG/PNG (උදා: ඡායාරූපය public/
              ලෙස හෝ upload කර භාවිතා කළ හැක).
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: PUBLIC STATS COUNTERS */}
      <div className="bg-amber-50/70 dark:bg-stone-800/60 border border-amber-200 dark:border-stone-700 rounded-3xl p-6 space-y-4">
        <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-200 border-b border-amber-200 dark:border-stone-700 pb-2 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          <span>ප්‍රධාන සංඛ්‍යාලේඛන කවුන්ටර (Public Statistics Counters)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label htmlFor="generalsettingstab-statMonksCount150" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ශිෂ්‍ය හිමිවරුන් (Monks)
            </label>
            <input autoComplete="name" id="generalsettingstab-statMonksCount150" name="statMonksCount150"
              type="text"
              value={settingsForm.statMonksCount || '150+'}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, statMonksCount: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            />
          </div>

          <div>
            <label htmlFor="generalsettingstab-statTeachersCount25" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ගුරු මණ්ඩලය (Teachers)
            </label>
            <input autoComplete="name" id="generalsettingstab-statTeachersCount25" name="statTeachersCount25"
              type="text"
              value={settingsForm.statTeachersCount || '25+'}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, statTeachersCount: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            />
          </div>

          <div>
            <label htmlFor="generalsettingstab-5" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              විභාග සමත් ප්‍රතිශතය
            </label>
            <input autoComplete="name" id="generalsettingstab-5" name="5"
              type="text"
              value={settingsForm.statExamPassRate || '98.5%'}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, statExamPassRate: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            />
          </div>

          <div>
            <label htmlFor="generalsettingstab-statEstablishedYear1984" className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ආරම්භ කළ වර්ෂය
            </label>
            <input autoComplete="name" id="generalsettingstab-statEstablishedYear1984" name="statEstablishedYear1984"
              type="text"
              value={settingsForm.statEstablishedYear || '1984'}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, statEstablishedYear: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: CONTACT INFORMATION & PHYSICAL ADDRESS */}
      <div className="bg-white dark:bg-stone-800/40 border border-amber-200 dark:border-stone-700 rounded-3xl p-6 space-y-4">
        <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-200 border-b border-amber-200 dark:border-stone-700 pb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          <span>ලිපිනය සහ සබඳතා තොරතුරු (Address & Contact Details)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ප්‍රධාන දුරකථන අංකය (Primary Phone)
            </label>
            <input id="generalsettingstab-input-15" name="generalsettingstab-input-15"
              type="text"
              value={settingsForm.phonePrimary || settingsForm.phone || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({
                  ...settingsForm,
                  phonePrimary: e.target.value,
                  phone: e.target.value,
                });
              }}
              placeholder="+94 45 222 3450"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ද්විතීයික දුරකථන / WhatsApp අංකය (Secondary Phone)
            </label>
            <input id="generalsettingstab-input-16" name="generalsettingstab-input-16"
              type="text"
              value={settingsForm.phoneSecondary || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, phoneSecondary: e.target.value });
              }}
              placeholder="+94 77 123 4567"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              විද්‍යුත් තැපෑල (Email Address)
            </label>
            <input id="generalsettingstab-input-17" name="email_17"
              type="email"
              value={settingsForm.email || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, email: e.target.value });
              }}
              placeholder="info@pirivena.edu.lk"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              කාර්යාල වේලාවන් (Office / Opening Hours)
            </label>
            <input id="generalsettingstab-input-18" name="generalsettingstab-input-18"
              type="text"
              value={settingsForm.openingHours || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, openingHours: e.target.value });
              }}
              placeholder="Monday - Saturday: 7:30 AM - 4:30 PM"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              පිරිවෙනේ සම්පූර්ණ ලිපිනය (Official Physical Address)
            </label>
            <input id="generalsettingstab-input-19" name="generalsettingstab-input-19"
              type="text"
              value={settingsForm.address || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, address: e.target.value });
              }}
              placeholder="ශ්‍රී සුමන මහා පිරිවෙන, මුද්දුව, රත්නපුර"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              Google Maps Embed URL (සිතියම් සබැඳිය)
            </label>
            <input id="generalsettingstab-input-20" name="generalsettingstab-input-20"
              type="text"
              value={settingsForm.googleMapEmbedUrl || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, googleMapEmbedUrl: e.target.value });
              }}
              placeholder="https://maps.google.com/maps?q=...&output=embed"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION 7: SOCIAL MEDIA LINKS (සමාජ මාධ්‍ය සබැඳි) */}
      <div className="bg-amber-50/70 dark:bg-stone-800/60 border border-amber-200 dark:border-stone-700 rounded-3xl p-6 space-y-4">
        <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-200 border-b border-amber-200 dark:border-stone-700 pb-2 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          <span>සමාජ මාධ්‍ය සබැඳි (Official Social Media Links & Channels)</span>
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          වෙබ් අඩවියේ Footer එකෙහි සහ අනෙකුත් ස්ථානවල දිස්වන නිල සමාජ මාධ්‍ය ගිණුම්වල සබැඳි (Links) මෙතැනින් කළමනාකරණය කරන්න.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              Facebook පිටුව (Facebook Page URL)
            </label>
            <input id="generalsettingstab-input-21" name="url_21"
              type="url"
              value={settingsForm.facebookUrl || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, facebookUrl: e.target.value });
              }}
              placeholder="https://facebook.com/srisumanapirivena"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              YouTube නාලිකාව (YouTube Channel URL)
            </label>
            <input id="generalsettingstab-input-22" name="url_22"
              type="url"
              value={settingsForm.youtubeUrl || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value });
              }}
              placeholder="https://youtube.com/@srisumanapirivena"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              විද්‍යුත් තැපෑල / Gmail (Official Email)
            </label>
            <input id="generalsettingstab-input-23" name="email_23"
              type="email"
              value={settingsForm.email || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, email: e.target.value });
              }}
              placeholder="info@pirivena.edu.lk / pirivena@gmail.com"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 8: BANK ACCOUNT FOR DONATIONS & CHARITY */}
      <div className="bg-amber-50/70 dark:bg-stone-800/60 border border-amber-200 dark:border-stone-700 rounded-3xl p-6 space-y-4">
        <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-200 border-b border-amber-200 dark:border-stone-700 pb-2 flex items-center gap-2">
          <Building className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          <span>පින්කම් හා ශාසනික ආධාර බැංකු ගිණුම් තොරතුරු (Donation Bank Account Details)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              බැංකුවේ නම (Bank Name)
            </label>
            <input id="generalsettingstab-input-24" name="generalsettingstab-input-24"
              type="text"
              value={settingsForm.bankName || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, bankName: e.target.value });
              }}
              placeholder="Bank of Ceylon / People's Bank"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ගිණුමේ නම (Account Name)
            </label>
            <input id="generalsettingstab-input-25" name="generalsettingstab-input-25"
              type="text"
              value={settingsForm.bankAccountName || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, bankAccountName: e.target.value });
              }}
              placeholder="Sri Sumana Pirivena Development Fund"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ගිණුම් අංකය (Account Number)
            </label>
            <input id="generalsettingstab-input-26" name="generalsettingstab-input-26"
              type="text"
              value={settingsForm.bankAccountNumber || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, bankAccountNumber: e.target.value });
              }}
              placeholder="000789456123"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ශාඛාව (Bank Branch)
            </label>
            <input id="generalsettingstab-input-27" name="generalsettingstab-input-27"
              type="text"
              value={settingsForm.bankBranch || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, bankBranch: e.target.value });
              }}
              placeholder="Ratnapura Main Branch"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              SWIFT / Branch Code
            </label>
            <input id="generalsettingstab-input-28" name="generalsettingstab-input-28"
              type="text"
              value={settingsForm.bankSwiftCode || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, bankSwiftCode: e.target.value });
              }}
              placeholder="BCEYLKLX"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 8: ADMISSIONS SETTINGS */}
      <div className="bg-white dark:bg-stone-800/40 border border-amber-200 dark:border-stone-700 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 dark:border-stone-700 pb-2">
          <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-200 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span>මාර්ගගත ශිෂ්‍ය ඇතුළත් කිරීම් සැකසුම් (Online Admissions Settings)</span>
          </h3>

          <label className="flex items-center gap-2 cursor-pointer bg-amber-50 dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-stone-700 shadow-xs">
            <input id="generalsettingstab-input-29" name="checkbox_29"
              type="checkbox"
              checked={settingsForm.admissionIsOpen !== false}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, admissionIsOpen: e.target.checked });
              }}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
              {settingsForm.admissionIsOpen !== false ? '🟢 ඇතුළත්වීම් විවෘතයි (Open)' : '🔴 ඇතුළත්වීම් වසා ඇත (Closed)'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              අයදුම්පත් භාරගන්නා අවසන් දිනය (Admission Deadline)
            </label>
            <input id="generalsettingstab-input-30" name="generalsettingstab-input-30"
              type="text"
              value={settingsForm.admissionDeadline || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, admissionDeadline: e.target.value });
              }}
              placeholder="උදා: 2026 අප්‍රේල් 30"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              ඇතුළත් වීමේ විශේෂ නිවේදනය (Sinhala Notice)
            </label>
            <input id="generalsettingstab-input-31" name="generalsettingstab-input-31"
              type="text"
              value={settingsForm.admissionNoticeSinhala || ''}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, admissionNoticeSinhala: e.target.value });
              }}
              placeholder="ප්‍රාචීන හා මූලික පිරිවෙන් නවක සිසුන් බඳවා ගැනීම් දැන් ක්‍රියාත්මකයි"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900"
            />
          </div>
        </div>
      </div>

      {/* SECTION 9: GLOBAL ACADEMIC YEAR & TERM */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-stone-900 border-2 border-amber-400/80 dark:border-amber-700/80 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 dark:border-stone-700 pb-2">
          <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-200 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span>වත්මන් අධ්‍යයන වර්ෂය සහ වාරය (Current Academic Year & Term Settings)</span>
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-800 text-white font-bold">
            🎓 Global Setting
          </span>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          මෙහි සකසන අධ්‍යයන වර්ෂය සහ වාරය මුළු පද්ධතියේම (Admin Dashboard, Teacher Portal, ශිෂ්‍ය වාර්තා පොත්, විභාග ලකුණු සහ මාර්ගගත අයදුම්පත්) ප්‍රධාන කාලරාමුව ලෙස ක්‍රියාත්මක වේ.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              අධ්‍යයන වර්ෂය (Academic Year) *
            </label>
            <select id="generalsettingstab-select-32" name="generalsettingstab-select-32"
              value={settingsForm.currentAcademicYear || '2026'}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({ ...settingsForm, currentAcademicYear: e.target.value });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            >
              <option value="2026">2026 අධ්‍යයන වර්ෂය</option>
              <option value="2027">2027 අධ්‍යයන වර්ෂය</option>
              <option value="2028">2028 අධ්‍යයන වර්ෂය</option>
              <option value="2029">2029 අධ්‍යයන වර්ෂය</option>
              <option value="2030">2030 අධ්‍යයන වර්ෂය</option>
              <option value="2031">2031 අධ්‍යයන වර්ෂය</option>
              <option value="2032">2032 අධ්‍යයන වර්ෂය</option>
              <option value="2033">2033 අධ්‍යයන වර්ෂය</option>
              <option value="2034">2034 අධ්‍යයන වර්ෂය</option>
              <option value="2035">2035 අධ්‍යයන වර්ෂය</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              වත්මන් වාරය (Academic Term Code) *
            </label>
            <select id="generalsettingstab-select-33" name="generalsettingstab-select-33"
              value={settingsForm.currentAcademicTerm || 'Term 1'}
              onChange={(e) => {
                const termCode = e.target.value;
                const termLabels: Record<string, string> = {
                  'Term 1': 'ප්‍රථම වාරය (1st Term)',
                  'Term 2': 'දෙවන වාරය (2nd Term)',
                  'Term 3': 'තෙවන වාරය (3rd Term)',
                };
                setFormDirty(true);
                setSettingsForm({
                  ...settingsForm,
                  currentAcademicTerm: termCode,
                  currentAcademicTermSinhala: termLabels[termCode] || termCode,
                });
              }}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            >
              <option value="Term 1">🌱 1st Term (ප්‍රථම වාරය)</option>
              <option value="Term 2">☀️ 2nd Term (දෙවන වාරය)</option>
              <option value="Term 3">🏆 3rd Term (තෙවන වාරය)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
              වාරයේ සිංහල නාමය (Display Sinhala Name)
            </label>
            <input id="generalsettingstab-input-34" name="generalsettingstab-input-34"
              type="text"
              value={settingsForm.currentAcademicTermSinhala || 'ප්‍රථම වාරය (1st Term)'}
              onChange={(e) => {
                setFormDirty(true);
                setSettingsForm({
                  ...settingsForm,
                  currentAcademicTermSinhala: e.target.value,
                });
              }}
              placeholder="උදා: ප්‍රථම වාරය (1st Term)"
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 font-bold"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-6 py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>වෙනස්කම් සියල්ල සුරකින්න (Save General Settings)</span>
        </button>
      </div>
    </form>
  );
};

