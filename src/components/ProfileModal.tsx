import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Check, 
  Camera, 
  Upload, 
  Type, 
  Sparkles, 
  History as HistoryIcon, 
  Bell, 
  Volume2, 
  VolumeX, 
  User as UserIcon, 
  Globe, 
  LogOut, 
  MapPin, 
  RefreshCw, 
  Trash2, 
  Smile, 
  AlertCircle,
  Dices,
  Coins,
  Zap,
  Eye,
  TrendingUp,
  Megaphone
} from 'lucide-react';
import { SponsorBadge } from './SponsorBadge';
import { User, Poop } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { COUNTRIES, getCountryByCode } from '../utils/countries';
import { 
  MONOGRAM_GRADIENTS, 
  WHATSAPP_AVATAR_COLORS,
  getInitialFromName, 
  parseLetterAvatar, 
  createLetterAvatarString, 
  isLetterAvatar, 
  isCustomPhoto,
  getDefaultGradientForName,
  PERSONAJILLO_AVATARS,
  getUserPhoto
} from '../utils/avatarUtils';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  requestWebPushPermission, 
  unsubscribeWebPush,
  playNotificationSound,
  NotificationSettings 
} from '../utils/notificationService';
import { getMyPoops, updateProfile } from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser: (updated: User) => void;
  onOpenPaymentModal: () => void;
  onOpenWrapped?: () => void;
  onLogout?: () => void;
}

const CLASSIC_POOP_AVATARS = [
  { id: 'popo1', src: '/avatar1.jpg', name: 'Happy Poop' },
  { id: 'popo2', src: '/avatar2.jpg', name: 'Classic Poop' },
  { id: 'popo3', src: '/avatar3.jpg', name: 'Cool Poop' },
  { id: 'popo4', src: '/avatar4.jpg', name: 'Gamer Poop' },
  { id: 'popo5', src: '/avatar5.jpg', name: 'Ninja Poop' },
  { id: 'popo6', src: '/avatar6.jpg', name: 'Royal King' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenPaymentModal,
  onLogout,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'notifications'>('profile');
  
  // Avatar editor mode
  const [avatarMode, setAvatarMode] = useState<'personajillos' | 'upload' | 'camera'>('personajillos');
  
  // Form fields
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('/popohero1_transparent.png');
  const [editCountryCode, setEditCountryCode] = useState('US');
  const [editCountry, setEditCountry] = useState('United States');
  const [editSponsorUrl, setEditSponsorUrl] = useState('');
  const [editSponsorText, setEditSponsorText] = useState('');
  
  // Monogram customization
  const [monoLetter, setMonoLetter] = useState('P');
  const [monoStyleId, setMonoStyleId] = useState('sunset-amber');

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }, []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // States
  const [history, setHistory] = useState<Poop[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings());

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        setEditUsername(currentUser.username || '');
        const av = currentUser.avatar && !currentUser.avatar.includes('dicebear')
          ? currentUser.avatar
          : '/popohero1_transparent.png';
        setEditAvatar(av);
        setEditCountryCode(currentUser.countryCode || 'US');
        setEditCountry(currentUser.country || 'United States');
        setEditSponsorUrl(currentUser.sponsorUrl || '');
        setEditSponsorText(currentUser.sponsorText || '');
        
        // Determine initial avatar sub-mode
        if (isCustomPhoto(av)) {
          setAvatarMode('upload');
        } else {
          setAvatarMode('personajillos');
        }

        fetchHistoryData();
      }
    } else if (!isOpen) {
      hasInitializedRef.current = false;
      setCapturedPhoto(null);
    }
  }, [isOpen, currentUser]);

  // Auto-start or stop camera depending on active avatar tab and modal openness
  useEffect(() => {
    if (avatarMode === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [avatarMode, isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (facing: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setCapturedPhoto(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t('Camera is not supported on this device.', 'La cámara no es compatible en este dispositivo.'));
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? t('Camera access denied. Please grant permission in browser settings.', 'Permiso de cámara denegado. Actívalo en la configuración de tu navegador.')
          : t('Could not connect to camera.', 'No se pudo conectar con la cámara.')
      );
      setCameraActive(false);
    }
  };

  const flipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;
    const minDim = Math.min(vWidth, vHeight);
    const startX = (vWidth - minDim) / 2;
    const startY = (vHeight - minDim) / 2;

    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    setCapturedPhoto(dataUrl);
    setEditAvatar(dataUrl);
    stopCamera();
  };

  const handleStartCountdownCapture = () => {
    setIsCountingDown(true);
    setCountdownNum(3);

    let current = 3;
    const timer = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdownNum(current);
      } else {
        clearInterval(timer);
        setIsCountingDown(false);
        capturePhoto();
      }
    }, 700);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setEditAvatar(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyMonogram = (letter: string, styleId: string) => {
    const cleanLetter = (letter || getInitialFromName(editUsername)).trim().slice(0, 2).toUpperCase() || 'P';
    setMonoLetter(cleanLetter);
    setMonoStyleId(styleId);
    const monoStr = createLetterAvatarString(cleanLetter, styleId);
    setEditAvatar(monoStr);
  };

  const handleRandomizeMonogram = () => {
    const randomGrad = MONOGRAM_GRADIENTS[Math.floor(Math.random() * MONOGRAM_GRADIENTS.length)];
    handleApplyMonogram(monoLetter, randomGrad.id);
  };

  const fetchHistoryData = async () => {
    if (!currentUser) return;
    try {
      const items = await getMyPoops(200, 0);
      setHistory(items);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCountryChange = (code: string) => {
    setEditCountryCode(code);
    const selected = getCountryByCode(code);
    if (selected) {
      setEditCountry(selected.name);
    }
  };

  const handleAvatarChangeAndSave = async (newAvatar: string) => {
    setEditAvatar(newAvatar);
    if (!currentUser) return;
    try {
      const finalUsername = editUsername.trim() || currentUser.username || 'Pooper';
      const data = await updateProfile({
        username: finalUsername,
        avatar: newAvatar,
        country: editCountry,
        countryCode: editCountryCode
      });

      const updatedUser: User = {
        ...currentUser,
        ...data.user
      };

      localStorage.setItem('poop_user_profile', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving avatar:', e);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    const finalUsername = (editUsername || '').trim() || currentUser.username || 'Pooper';
    const safeSponsorUrl = (editSponsorUrl || '').trim();
    const safeSponsorText = (editSponsorText || '').trim();

    try {
      setIsSaving(true);

      const data = await updateProfile({
        username: finalUsername,
        avatar: editAvatar,
        country: editCountry,
        countryCode: editCountryCode,
        sponsorUrl: safeSponsorUrl,
        sponsorText: safeSponsorText
      });

      const updatedUser: User = {
        ...currentUser,
        ...data.user,
        sponsorUrl: safeSponsorUrl,
        sponsorText: safeSponsorText,
        isSponsored: !!safeSponsorUrl
      };

      localStorage.setItem('poop_user_profile', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsSaving(false);
    } catch (e) {
      console.error('Error saving profile:', e);
      setIsSaving(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-[#18181b] text-neutral-900 dark:text-neutral-100 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 z-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden transition-colors">
        
        {/* Mobile Pull Handle */}
        <div className="w-10 h-1 bg-neutral-300/80 dark:bg-neutral-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Clean Header Bar */}
        <div className="p-4 sm:p-5 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-neutral-950 dark:text-white">
              {t('Profile Settings', 'Configuración de Perfil')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {t('Manage your photo, personal details and alerts', 'Personaliza tu avatar, datos personales y alertas')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t('Close', 'Cerrar')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Toast Banner */}
        {saveSuccess && (
          <div className="px-4 py-2 bg-emerald-500 text-white flex items-center justify-between text-xs font-bold animate-in fade-in duration-150">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{t('Changes saved successfully!', '¡Cambios guardados con éxito!')}</span>
            </span>
            <button onClick={() => setSaveSuccess(false)} className="text-white/80 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top 3 Navigation Tabs */}
        <div className="flex px-4 sm:px-6 pt-2.5 border-b border-neutral-100 dark:border-neutral-800 gap-5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'border-neutral-950 dark:border-amber-400 text-neutral-950 dark:text-amber-300 font-black'
                : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{t('Profile', 'Perfil')}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'history'
                ? 'border-neutral-950 dark:border-amber-400 text-neutral-950 dark:text-amber-300 font-black'
                : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>{t(`History (${history.length})`, `Historial (${history.length})`)}</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'notifications'
                ? 'border-neutral-950 dark:border-amber-400 text-neutral-950 dark:text-amber-300 font-black'
                : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{t('Notifications', 'Notificaciones')}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 overscroll-contain">
          
          {/* ============================================================ */}
          {/* TAB 1: UNIFIED PROFILE TAB */}
          {/* ============================================================ */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* SECTION 1: AVATAR CUSTOMIZER - PERSONAJILLOS OFICIALES */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-neutral-50 dark:from-amber-950/30 dark:via-[#1f1f23] dark:to-[#18181b] border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{t('Choose Your Character Avatar', 'Elige tu Personajillo de Avatar')}</span>
                  </label>
                  <span className="text-[10px] font-bold bg-amber-200/80 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full border border-transparent dark:border-amber-700/50">
                    {t('Official Collection', 'Colección Oficial')}
                  </span>
                </div>

                {/* Selected Avatar Preview Header */}
                <div className="flex items-center gap-3 bg-white dark:bg-neutral-900/90 p-3 rounded-xl border border-amber-200/80 dark:border-amber-500/30">
                  <div className="relative shrink-0">
                    <img 
                      src={editAvatar} 
                      alt="Avatar preview" 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 dark:bg-neutral-800 border-2 border-amber-400 shadow-xs object-contain p-1"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-neutral-950 text-amber-300 rounded-full p-1 border border-amber-400">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black text-neutral-900 dark:text-white block">
                      {t('Current Avatar', 'Avatar Seleccionado')}
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block mt-0.5">
                      {t('Select any character below to instantly update your look in all rooms and rankings.', 'Selecciona cualquiera de los personajillos abajo para actualizar tu imagen en todas las salas y clasificaciones.')}
                    </span>
                  </div>
                </div>

                {/* Mode Selector (Personajillos / Upload / Camera) */}
                <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAvatarMode('personajillos')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarMode === 'personajillos'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-amber-300 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('Personajillos', 'Personajillos')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('upload')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarMode === 'upload'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-amber-300 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t('Upload Photo', 'Subir Foto')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('camera')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarMode === 'camera'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-amber-300 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t('Camera', 'Cámara')}</span>
                  </button>
                </div>

                {/* Mode 1: Personajillos Gallery */}
                {avatarMode === 'personajillos' && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      {t('Tap a character to choose:', 'Toca un personajillo para elegirlo:')}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1.5 bg-amber-500/5 dark:bg-neutral-900/50 rounded-xl border border-amber-200/60 dark:border-neutral-800">
                      {PERSONAJILLO_AVATARS.map((p) => {
                        const isSelected = editAvatar === p.src;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              handleAvatarChangeAndSave(p.src);
                            }}
                            className={`group relative p-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-500 ring-2 ring-amber-400 shadow-md scale-[1.02]'
                                : 'bg-white dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-amber-300'
                            }`}
                            title={p.name}
                          >
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-amber-50 dark:bg-neutral-900 p-1 mb-1.5 flex items-center justify-center">
                              <img 
                                src={p.src} 
                                alt={p.name} 
                                className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform" 
                              />
                            </div>
                            <span className="text-[11px] font-black truncate max-w-full text-center text-neutral-900 dark:text-white">
                              {p.nameEs}
                            </span>
                            {p.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-300 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 mt-1">
                                {p.badge}
                              </span>
                            )}
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-amber-500 text-neutral-950 rounded-full p-1 shadow-xs ring-1 ring-white">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mode 2: Upload Photo */}
                {avatarMode === 'upload' && (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-2xl p-6 text-center cursor-pointer hover:bg-amber-50/50 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {t('Click to upload photo from your device', 'Toca para subir una foto de tu dispositivo')}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1">PNG, JPG o WEBP (máx. 5MB)</p>
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          handleFileChange(e);
                          if (e.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (typeof ev.target?.result === 'string') {
                                handleAvatarChangeAndSave(ev.target.result);
                              }
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Mode 3: Camera */}
                {avatarMode === 'camera' && (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-neutral-950 aspect-square max-w-[260px] mx-auto border-2 border-amber-400">
                      <video 
                        ref={videoCallbackRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                      {isCountingDown && (
                        <div className="absolute inset-0 bg-neutral-950/60 flex items-center justify-center text-5xl font-black text-amber-400 animate-pulse">
                          {countdownNum}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleStartCountdownCapture}
                        disabled={isCountingDown}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{t('Take Photo (3s timer)', 'Tomar Foto (3s)')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: PERSONAL INFORMATION & PREFERENCES */}
              <div className="bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
                
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    {t('Username', 'Nombre de Usuario')}
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    maxLength={30}
                    placeholder={t('Your name in the room', 'Tu nombre en la sala')}
                    className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>{t('Country / Flag', 'País / Bandera')}</span>
                  </label>
                  <div className="relative">
                    <select
                      value={editCountryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 text-neutral-900 dark:text-white appearance-none cursor-pointer pr-10"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {language === 'es' ? c.nameEs : c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 font-bold text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>{t('App Language', 'Idioma de la Web')}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('es')}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                        language === 'es'
                          ? 'bg-amber-400 text-neutral-950 border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span>ES</span>
                      <span>Español</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                        language === 'en'
                          ? 'bg-amber-400 text-neutral-950 border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span>EN</span>
                      <span>English</span>
                    </button>
                  </div>
                </div>

                {/* Room Sponsor Badge / Sponsor Link */}
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('Room Sponsor Badge', 'Patrocinio de tu Puesto')}</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-950 dark:text-amber-300 bg-amber-200 dark:bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                      {t('Sponsor Link', 'Enlace Patrocinado')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                      {t('Link / Website URL:', 'Enlace / URL de tu web o red social:')}
                    </label>
                    <input
                      type="url"
                      value={editSponsorUrl}
                      onChange={(e) => setEditSponsorUrl(e.target.value)}
                      placeholder="https://instagram.com/tu_cuenta o tu web"
                      className="w-full text-xs font-bold px-3.5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                      {t('Promotional Badge Text (Max 20 chars):', 'Texto del botón / Anuncio (Máx 20 caracteres):')}
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={editSponsorText}
                      onChange={(e) => setEditSponsorText(e.target.value)}
                      placeholder={t('e.g. Mi Canal / Mi Tienda', 'ej. Mi Canal / Mi Tienda')}
                      className="w-full text-xs font-bold px-3.5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 text-neutral-900 dark:text-white"
                    />
                  </div>

                  {/* Live Badge Preview */}
                  {editSponsorUrl && (
                    <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-amber-200 dark:border-neutral-700 space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
                        <span>{t('Live Badge Preview:', 'Vista previa de tu anuncio:')}</span>
                        <span className="text-[9px] text-amber-600 dark:text-amber-400">{t('Auto-detected style', 'Estilo automático')}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <SponsorBadge
                          userId={currentUser?.id}
                          username={editUsername || 'Pooper'}
                          rank={1}
                          isKing={false}
                          sponsorUrl={editSponsorUrl}
                          sponsorText={editSponsorText}
                          sponsorClicks={currentUser?.sponsorClicks || 0}
                          showEmptyState={false}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metrics & Click Counter Card */}
                  <div className="p-3.5 bg-gradient-to-r from-neutral-100/90 to-amber-50/50 dark:from-neutral-800/80 dark:to-amber-950/20 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-xs">
                        <Eye className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <span>{currentUser?.sponsorClicks || 0} {t('clicks received', 'visitas recibidas')}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium truncate">
                          {t('Comparte tu sala para conseguir más visitas', 'Comparte tu sala para ganar más clics')}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        {editSponsorUrl ? t('Active', 'Activo') : t('Inactive', 'Inactivo')}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION 3: SINGLE PRIMARY SAVE BUTTON */}
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving || !editUsername.trim()}
                className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 dark:bg-[#facc15] dark:hover:bg-[#eab308] active:scale-[0.99] text-white dark:text-neutral-950 font-black text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('Saving...', 'Guardando...')}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-800" />
                    <span>{t('Save Changes', 'Guardar Cambios')}</span>
                  </>
                )}
              </button>

              {/* SECTION 4: CLEAN LOG OUT */}
              {onLogout && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline cursor-pointer py-1.5 px-3 rounded-lg"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('Log Out of Account', 'Cerrar Sesión de la Cuenta')}</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: HISTORY */}
          {/* ============================================================ */}
          {activeTab === 'history' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>{t('Record History', 'Historial de Registros')}</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">{t('Total', 'Total')}: {history.length}</span>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-10 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-medium space-y-2">
                  <p>{t("You haven't logged any drops yet.", 'Aún no has registrado ningún lanzamiento.')}</p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPaymentModal();
                    }}
                    className="px-4 py-2 bg-neutral-950 dark:bg-[#facc15] text-white dark:text-neutral-950 font-black text-xs rounded-xl hover:bg-neutral-800 dark:hover:bg-[#eab308] transition-colors cursor-pointer"
                  >
                    {t('Log 1 Poop', 'Registrar 1 Popó')}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900">
                  {history.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-neutral-800 border border-amber-200 dark:border-amber-700/40 flex items-center justify-center p-1.5 shrink-0 text-amber-600 dark:text-amber-400">
                          <HistoryIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-neutral-950 dark:text-white">
                            {t('+1 Log on poop.lol', '+1 Registro en poop.lol')}
                          </div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                            {new Date(item.createdAt).toLocaleDateString()} · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-0.5">
                          <Check className="w-3 h-3" />
                          <span>{t('Verified', 'Verificado')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: NOTIFICATIONS */}
          {/* ============================================================ */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Push Notifications Card */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center text-amber-900 dark:text-amber-300 font-bold">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-neutral-950 dark:text-white">
                        {t('Screen Alerts (Web Push)', 'Alertas en Pantalla (Web Push)')}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {t('Notifications when someone in your room logs a poop.', 'Notificaciones cuando alguien de tu sala registra un popó.')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (notifSettings.webPushEnabled) {
                        await unsubscribeWebPush(currentUser?.id);
                        setNotifSettings(saveNotificationSettings({ webPushEnabled: false }));
                        return;
                      }
                      const granted = await requestWebPushPermission(currentUser?.id);
                      setNotifSettings(saveNotificationSettings({ webPushEnabled: granted }));
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                      notifSettings.webPushEnabled
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {notifSettings.webPushEnabled ? t('Enabled', 'Activado') : t('Disabled', 'Desactivado')}
                  </button>
                </div>
              </div>

              {/* Sound Effects Card */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center text-amber-900 dark:text-amber-300 font-bold">
                      {notifSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-neutral-950 dark:text-white">
                        {t('Sound Effects', 'Efectos de Sonido')}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {t('Real-time audio alerts.', 'Alertas de audio en tiempo real.')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = saveNotificationSettings({ soundEnabled: !notifSettings.soundEnabled });
                      setNotifSettings(updated);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                      notifSettings.soundEnabled
                        ? 'bg-amber-400 text-neutral-950 border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {notifSettings.soundEnabled ? t('Sound ON', 'Sonido ACTIVADO') : t('Muted', 'Silenciado')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => playNotificationSound('alert')}
                    className="p-2 bg-white dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer transition-colors text-center"
                  >
                    {t('Test Alert', 'Probar Alerta')}
                  </button>
                  <button
                    type="button"
                    onClick={() => playNotificationSound('fanfare')}
                    className="p-2 bg-white dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer transition-colors text-center"
                  >
                    {t('Test Fanfare', 'Probar Fanfarria')}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
