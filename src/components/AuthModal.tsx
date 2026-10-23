import React, { useState, useMemo } from 'react';
import {
  X, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  Mail, 
  User as UserIcon, 
  Globe, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Zap, 
  Check, 
  Loader2,
  ArrowRight,
  AlertTriangle,
  Info,
  Chrome,
  Apple,
  CheckCircle2
} from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CountryFlag } from './CountryFlag';
import { getDiceBearAvatar } from '../utils/avatarUtils';
import { COUNTRIES } from '../utils/countries';
import { ensureProfile } from '../lib/api';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onAuthSuccess,
}) => {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('CR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<{ 
    message: string; 
    title?: string;
    field?: 'email' | 'password' | 'username';
    action?: 'switch_login' | 'switch_signup';
  } | null>(null);

  // Real-time password strength calculation (Hook must be called BEFORE any early returns)
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  if (!isOpen) return null;

  // Translate Supabase/Auth errors into clear, actionable messages.
  const parseAuthError = (err: any): { 
    title: string; 
    message: string; 
    field?: 'email' | 'password' | 'username';
    action?: 'switch_login' | 'switch_signup';
  } => {
    const code = String(err?.code || '');
    const str = `${code} ${err?.message || ''}`.toLowerCase();

    if (str.includes('invalid_credentials') || str.includes('invalid login credentials')) {
      return {
        title: t('Incorrect Email or Password', 'Correo o Contraseña Incorrectos'),
        message: t(
          'The email or password does not match this account. Verify your credentials and try again.',
          'El correo o la contraseña no coinciden con esta cuenta. Verifica tus datos e inténtalo de nuevo.'
        ),
        field: 'password'
      };
    }
    if (str.includes('email_taken') || str.includes('already registered') || str.includes('already been registered')) {
      return {
        title: t('Email Already Registered', 'Correo Ya Registrado'),
        message: t(
          `The email "${email || 'you entered'}" is already registered. If this is your account, switch to "Log In" below.`,
          `El correo "${email || 'ingresado'}" ya tiene una cuenta registrada. Si es tuya, cambia a "Iniciar Sesión" abajo.`
        ),
        field: 'email',
        action: 'switch_login'
      };
    }
    if (str.includes('email_not_confirmed') || str.includes('email not confirmed')) {
      return {
        title: t('Confirm Your Email', 'Confirma tu Correo'),
        message: t(
          'We sent you a confirmation link. Open it, then log in again.',
          'Te enviamos un enlace de confirmación. Ábrelo y vuelve a iniciar sesión.'
        ),
        field: 'email'
      };
    }
    if (str.includes('weak_password') || str.includes('password should be at least')) {
      return {
        title: t('Password Too Short', 'Contraseña Muy Corta'),
        message: t(
          'Your password must be at least 6 characters long to protect your account.',
          'La contraseña debe tener al menos 6 caracteres para proteger tu cuenta.'
        ),
        field: 'password'
      };
    }
    if (str.includes('invalid_email') || str.includes('invalid email')) {
      return {
        title: t('Invalid Email Format', 'Formato de Correo Inválido'),
        message: t(
          'Please make sure your email contains an "@" and a valid domain (e.g. name@gmail.com).',
          'Por favor verifica que tu correo tenga un "@" y un dominio válido (ejemplo: tu_nombre@gmail.com).'
        ),
        field: 'email'
      };
    }
    if (str.includes('rate_limited') || str.includes('rate limit') || str.includes('too many')) {
      return {
        title: t('Too Many Attempts', 'Demasiados Intentos'),
        message: t(
          'For security reasons, attempts have been temporarily paused. Please wait a minute and try again.',
          'Por seguridad del sistema, se han pausado los intentos. Espera un minuto e inténtalo de nuevo.'
        ),
      };
    }
    if (str.includes('provider_not_enabled') || str.includes('provider is not enabled')) {
      return {
        title: t('Provider Not Configured', 'Proveedor No Configurado'),
        message: t(
          'This sign-in method is not enabled in Supabase yet. Configure it in Authentication → Providers.',
          'Este método de acceso aún no está activado en Supabase. Configúralo en Authentication → Providers.'
        ),
      };
    }
    if (str.includes('username_taken')) {
      return {
        title: t('Username Taken', 'Nombre de Usuario Ocupado'),
        message: t(
          'That username is already in use. Choose a different one.',
          'Ese nombre de usuario ya está en uso. Elige otro.'
        ),
        field: 'username'
      };
    }
    if (str.includes('supabase_not_configured')) {
      return {
        title: t('Supabase Not Configured', 'Supabase No Configurado'),
        message: t(
          'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the environment and restart the app.',
          'Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY al entorno y reinicia la app.'
        ),
      };
    }
    if (str.includes('network_error') || str.includes('failed to fetch') || str.includes('load failed') || str.includes('offline')) {
      return {
        title: t('Connection Issue', 'Error de Conexión'),
        message: t(
          'Unable to reach the server. Check your internet connection and try again.',
          'No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.'
        ),
      };
    }

    return {
      title: t('Authentication Notice', 'Aviso de Autenticación'),
      message: err?.message || t('Something went wrong during login. Please verify your data and try again.', 'Ocurrió un error al intentar ingresar. Revisa tus datos e intenta de nuevo.')
    };
  };

  const handleInputChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    if (error) setError(null);
    if (notice) setNotice(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(parseAuthError(err));
    }
  };

  const saveAndCompleteAuth = async (userObj: User) => {
    const authenticatedUser: User = {
      ...userObj,
      isRegistered: true,
    };
    try {
      localStorage.setItem('poop_is_registered', 'true');
      localStorage.setItem('poop_user_id', authenticatedUser.id);
      localStorage.setItem('poop_user_profile', JSON.stringify(authenticatedUser));
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
    } catch (e) {}

    setIsSubmitting(false);
    onAuthSuccess(authenticatedUser);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Sanitize inputs
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 30);
    const cleanPass = password.trim();

    // Client-side validations for security & fast UX
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError({
        message: t('Please enter a valid email address.', 'Ingresa un correo electrónico válido.'),
        field: 'email'
      });
      return;
    }

    if (mode === 'signup' && cleanUsername.length < 3) {
      setError({
        message: t('Username must be at least 3 characters long.', 'El nombre de usuario debe tener al menos 3 caracteres.'),
        field: 'username'
      });
      return;
    }

    if (cleanPass.length < 6) {
      setError({
        message: t('Password must be at least 6 characters long.', 'La contraseña debe tener al menos 6 caracteres.'),
        field: 'password'
      });
      return;
    }

    setIsSubmitting(true);

    const countryObj = COUNTRIES.find(c => c.code === countryCode);
    const countryName = countryObj?.name || 'Costa Rica';
    const userDisplay = cleanUsername || cleanEmail.split('@')[0] || 'Pooper';

    try {
      let authenticatedUser: User | null = null;

      if (mode === 'login') {
        await signInWithEmail(cleanEmail, cleanPass);
        const profile = await ensureProfile();
        authenticatedUser = { ...profile.user, isRegistered: true };
      } else {
        const defaultAvatar = getDiceBearAvatar(userDisplay, 'toon-head');
        const result = await signUpWithEmail({
          email: cleanEmail,
          password: cleanPass,
          username: userDisplay,
          country: countryName,
          countryCode,
          avatar: defaultAvatar
        });

        if (result.session) {
          const profile = await ensureProfile({
            username: userDisplay,
            avatar: defaultAvatar,
            country: countryName,
            countryCode
          });
          authenticatedUser = { ...profile.user, isRegistered: true };
        } else {
          setNotice(
            t(
              'Account created. Check your email for the confirmation link, then log in.',
              'Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.'
            )
          );
          setMode('login');
          setPassword('');
          setIsSubmitting(false);
          return;
        }
      }

      if (!authenticatedUser) throw new Error(t('Authentication failed', 'Error de autenticación'));
      await saveAndCompleteAuth(authenticatedUser);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(parseAuthError(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-[#18181b] text-neutral-950 dark:text-white rounded-3xl max-w-md w-full p-5 sm:p-7 my-auto shadow-2xl border border-neutral-200/80 dark:border-neutral-800 z-10 animate-in zoom-in-95 duration-150 overflow-hidden select-none">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge & Title */}
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 rounded-full text-xs font-black mb-2 shadow-2xs border border-amber-300/50">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
            <span>{t('Instant Registration • Fast & Free', 'Registro Rápido • 100% Gratis')}</span>
          </div>
          
          <h3 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight leading-tight">
            {mode === 'signup' 
              ? t('Create Your Profile', 'Crea tu Perfil de Juego') 
              : t('Welcome Back', 'Bienvenido de Nuevo')}
          </h3>
          
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">
            {t('Create a private room and compete only with your people.', 'Crea una sala privada y compite solo con los tuyos.')}
          </p>
        </div>

        {/* Segmented Mode Switcher (Crear Cuenta / Iniciar Sesión) */}
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-2xl mb-4 border border-neutral-200/80 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-amber-400 text-neutral-950 shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>{t('Create Account', 'Crear Cuenta')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-amber-400 text-neutral-950 shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>{t('Log In', 'Iniciar Sesión')}</span>
          </button>
        </div>

        {/* Social sign-in */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700 shadow-2xs disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Chrome className="w-4 h-4 text-[#4285F4]" />
            )}
            <span>{t('Continue with Google', 'Continuar con Google')}</span>
          </button>

          <button
            type="button"
            disabled
            title={t(
              'Apple sign-in will be enabled when Apple Developer credentials are configured.',
              'El acceso con Apple se activará cuando se configuren las credenciales de Apple Developer.'
            )}
            className="w-full py-3 px-4 bg-neutral-100 dark:bg-neutral-900/60 text-neutral-400 dark:text-neutral-500 font-bold text-xs rounded-2xl flex items-center justify-center gap-2.5 border border-neutral-200 dark:border-neutral-800 cursor-not-allowed"
          >
            <Apple className="w-4 h-4" />
            <span>{t('Continue with Apple', 'Continuar con Apple')}</span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full">
              {t('Soon', 'Pronto')}
            </span>
          </button>

          <div className="flex items-center gap-2 py-1">
            <div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              {t('or use email', 'o usa tu correo')}
            </span>
            <div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
          </div>
        </div>

        {notice && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-start gap-2 text-left animate-in fade-in slide-in-from-top-1 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200 leading-relaxed">
              {notice}
            </p>
          </div>
        )}

        {/* High-visibility Actionable Error Alert Box */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/70 border-2 border-red-300 dark:border-red-800 rounded-2xl flex flex-col gap-2.5 text-left animate-in fade-in slide-in-from-top-1 duration-150 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-black text-red-950 dark:text-red-200 block leading-tight">
                    {error.title}
                  </span>
                  <span className="text-xs font-semibold text-red-800 dark:text-red-300 mt-1 block leading-relaxed">
                    {error.message}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-700 dark:hover:text-red-200 p-1 cursor-pointer shrink-0"
                title={t('Dismiss Notice', 'Cerrar Aviso')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1-Tap Action Suggestion Button inside Error Banner */}
            {error.action === 'switch_login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('Switch to Log In Mode Now', 'Cambiar a Iniciar Sesión Ahora')}</span>
              </button>
            )}

            {error.action === 'switch_signup' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('Create Account Now', 'Crear Cuenta Ahora')}</span>
              </button>
            )}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Username Input (Sign Up Mode) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] font-extrabold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                {t('Username', 'Nombre de Usuario')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={handleInputChange(setUsername)}
                  placeholder={t('e.g. MasterPooper', 'ej. ElCagadorOficial')}
                  className={`w-full text-xs pl-10 pr-3.5 py-3 bg-neutral-50 dark:bg-neutral-900 border rounded-2xl focus:outline-none font-semibold text-neutral-900 dark:text-white transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500 ${
                    error?.field === 'username'
                      ? 'border-red-500 ring-2 ring-red-400/50'
                      : 'border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400'
                  }`}
                  required
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-[10px] font-extrabold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              {t('Email Address', 'Correo Electrónico')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={handleInputChange(setEmail)}
                placeholder="tu@ejemplo.com"
                className={`w-full text-xs pl-10 pr-3.5 py-3 bg-neutral-50 dark:bg-neutral-900 border rounded-2xl focus:outline-none font-semibold text-neutral-900 dark:text-white transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500 ${
                  error?.field === 'email'
                    ? 'border-red-500 ring-2 ring-red-400/50'
                    : 'border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400'
                }`}
                required
              />
            </div>
          </div>

          {/* Password Input + Strength Indicator & Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-extrabold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                {t('Password', 'Contraseña')}
              </label>
              {mode === 'signup' && password.length > 0 && (
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  passwordStrength >= 3 ? 'text-emerald-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {passwordStrength >= 3 
                    ? t('Strong', 'Segura') 
                    : passwordStrength === 2 
                      ? t('Medium', 'Media') 
                      : t('Weak (Min 6 chars)', 'Débil (Mín 6 car.)')}
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handleInputChange(setPassword)}
                placeholder="••••••••"
                className={`w-full text-xs pl-10 pr-10 py-3 bg-neutral-50 dark:bg-neutral-900 border rounded-2xl focus:outline-none font-semibold text-neutral-900 dark:text-white transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500 ${
                  error?.field === 'password'
                    ? 'border-red-500 ring-2 ring-red-400/50'
                    : 'border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                title={showPassword ? t('Hide Password', 'Ocultar Contraseña') : t('Show Password', 'Mostrar Contraseña')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Clear Password Length Requirement Helper Badge */}
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold">
              <span className={
                password.length >= 6 
                  ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' 
                  : password.length > 0 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-neutral-400 dark:text-neutral-500'
              }>
                {password.length >= 6 ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{t('Valid password (6+ characters)', 'Contraseña válida (6+ caracteres)')}</span>
                  </>
                ) : password.length > 0 ? (
                  <span>{t(`Minimum 6 characters (${6 - password.length} more needed)`, `Mínimo 6 caracteres (faltan ${6 - password.length})`)}</span>
                ) : (
                  <span>{t('Required: Minimum 6 characters', 'Requerido: Mínimo 6 caracteres')}</span>
                )}
              </span>

              {password.length > 0 && (
                <span className="text-neutral-400 font-mono">
                  {password.length}/6+
                </span>
              )}
            </div>

            {/* Visual Password Strength Bar (Sign Up Mode) */}
            {mode === 'signup' && password.length > 0 && (
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-300 ${
                    passwordStrength >= 3 
                      ? 'w-full bg-emerald-500' 
                      : passwordStrength === 2 
                        ? 'w-2/3 bg-amber-400' 
                        : 'w-1/3 bg-red-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Country Selection (Sign Up Mode) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] font-extrabold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                {t('Country Representation', 'País de Representación')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <CountryFlag countryCode={countryCode} className="w-4 shrink-0" />
                </div>
                <select
                  value={countryCode}
                  onChange={handleInputChange(setCountryCode)}
                  className="w-full text-xs pl-10 pr-3.5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 font-semibold text-neutral-900 dark:text-white cursor-pointer transition-all appearance-none"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                      {language === 'es' ? c.nameEs : c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-[#facc15] hover:bg-[#eab308] active:scale-[0.98] text-neutral-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border-2 border-amber-400/80 disabled:opacity-70 mt-3"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-950" />
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4 text-neutral-950" />
                <span>{t('Register & Enter Rooms', 'Registrarse y Entrar a Salas')}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-neutral-950" />
                <span>{t('Log In to Account', 'Iniciar Sesión')}</span>
              </>
            )}
          </button>
        </form>

        {/* Security & Trust Footer */}
        <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-neutral-400 dark:text-neutral-500 text-[10px] font-extrabold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{t('Instant Profile Creation • SSL Secured', 'Creación Instantánea • Cifrado SSL')}</span>
        </div>

      </div>
    </div>
  );
};
