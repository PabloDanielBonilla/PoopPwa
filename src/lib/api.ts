import type { Group, Poop, User } from '../types';
import { getSupabase } from './supabase/client';

export class AppError extends Error {
  code: string;
  details?: any;
  hint?: string;

  constructor(code: string, message: string, details?: any, hint?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: 'Inicia sesión para continuar.',
  COOLDOWN: 'Espera unos segundos antes de volver a registrar.',
  ROOM_FULL: 'La sala está llena. El anfitrión puede activar Premium para admitir más miembros.',
  ROOM_NOT_FOUND: 'No encontramos esa sala.',
  NOT_ROOM_MEMBER: 'No perteneces a esa sala.',
  NOT_ROOM_OWNER: 'Solo el anfitrión puede hacer eso.',
  OWNER_CANNOT_LEAVE: 'El anfitrión no puede salir mientras haya más miembros. Elimina la sala o espera a que se vayan.',
  USERNAME_TAKEN: 'Ese nombre de usuario ya está en uso.',
  INVALID_USERNAME: 'El nombre de usuario debe tener entre 3 y 30 caracteres.',
  INVALID_AVATAR: 'El avatar no es válido.',
  INVALID_SPONSOR_URL: 'El enlace del patrocinador debe empezar por https://',
  INVALID_CODE: 'El código de sala debe tener 8 caracteres.',
  INVALID_ROOM_NAME: 'El nombre de la sala debe tener al menos 3 caracteres.',
  RATE_LIMITED: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
  INVALID_SUBSCRIPTION: 'No pudimos registrar la suscripción de notificaciones.',
  NO_PUSH_SUBSCRIPTION: 'Activa las notificaciones en este dispositivo antes de probar.',
  PUSH_DEMO_RATE_LIMITED: 'Ya enviamos varias notificaciones de prueba. Espera una hora.',
  PUSH_DEMO_FAILED: 'No pudimos enviar la notificación de prueba.',
  VAPID_NOT_CONFIGURED: 'Web Push no está configurado todavía.',
  VAPID_INVALID_KEYS: 'Las claves VAPID no son válidas.',
  POLAR_NOT_CONFIGURED: 'Polar no está configurado todavía.',
  CHECKOUT_NOT_COMPLETED: 'El pago no se completó.',
  CHECKOUT_WITHOUT_SUBSCRIPTION: 'El pago no generó una suscripción.',
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  EMAIL_NOT_CONFIRMED: 'Confirma tu correo antes de iniciar sesión.',
  EMAIL_TAKEN: 'Ese correo ya tiene una cuenta.',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres.',
  INVALID_EMAIL: 'El correo no es válido.',
  NETWORK_ERROR: 'No pudimos conectar con el servidor. Revisa tu conexión.',
  SUPABASE_NOT_CONFIGURED: 'Supabase no está configurado. Añade las variables de entorno.',
  UNKNOWN_ERROR: 'Ocurrió un error. Inténtalo de nuevo.',
};

function friendly(code: string, fallback?: string): string {
  return FRIENDLY_MESSAGES[code] || fallback || FRIENDLY_MESSAGES.UNKNOWN_ERROR;
}

export function normalizeError(error: any): AppError {
  const rawMessage = String(error?.message || 'UNKNOWN_ERROR');
  let details = error?.details;

  if (typeof details === 'string') {
    try {
      details = JSON.parse(details);
    } catch {
      // Keep the original text.
    }
  }

  let code = String(error?.code || rawMessage);
  const known = Object.keys(FRIENDLY_MESSAGES);
  if (known.includes(rawMessage)) {
    code = rawMessage;
  }

  const lower = rawMessage.toLowerCase();
  if (error?.code === '23505' && lower.includes('username')) {
    code = 'USERNAME_TAKEN';
  } else if (lower.includes('invalid login credentials')) {
    code = 'INVALID_CREDENTIALS';
  } else if (lower.includes('email not confirmed')) {
    code = 'EMAIL_NOT_CONFIRMED';
  } else if (lower.includes('user already registered') || lower.includes('already been registered')) {
    code = 'EMAIL_TAKEN';
  } else if (lower.includes('password should be at least') || lower.includes('weak password')) {
    code = 'WEAK_PASSWORD';
  } else if (lower.includes('invalid email') || lower.includes('email address') && lower.includes('invalid')) {
    code = 'INVALID_EMAIL';
  } else if (lower.includes('failed to fetch') || lower.includes('network request failed') || lower.includes('load failed')) {
    code = 'NETWORK_ERROR';
  } else if (lower.includes('rate limit') || lower.includes('too many requests')) {
    code = 'RATE_LIMITED';
  } else if (lower.includes('provider is not enabled')) {
    code = 'PROVIDER_NOT_ENABLED';
  }

  return new AppError(
    code,
    friendly(code, rawMessage === 'UNKNOWN_ERROR' ? undefined : rawMessage),
    details,
    error?.hint
  );
}

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (getSupabase() as any).rpc(name, args);
  if (error) throw normalizeError(error);
  return data as T;
}

export async function invokeFunction<T>(
  name: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await (getSupabase() as any).functions.invoke(name, { body });
  if (error) {
    let message = error?.message || 'FUNCTION_ERROR';
    let details: any;
    try {
      const response = error?.context;
      if (response && typeof response.json === 'function') {
        const payload = await response.json();
        message = payload?.error || message;
        details = payload;
      }
    } catch {
      // Keep the original message.
    }
    const normalized = normalizeError({ message, details });
    throw normalized;
  }
  return data as T;
}

export interface EnsureProfileInput {
  username?: string;
  avatar?: string;
  country?: string;
  countryCode?: string;
}

export function ensureProfile(input: EnsureProfileInput = {}) {
  return rpc<{ user: User }>('ensure_profile', {
    p_username: input.username ?? null,
    p_avatar: input.avatar ?? null,
    p_country: input.country ?? null,
    p_country_code: input.countryCode ?? null,
  });
}

export interface UpdateProfileInput {
  username: string;
  avatar: string;
  country: string;
  countryCode: string;
  sponsorUrl?: string;
  sponsorText?: string;
}

export function updateProfile(input: UpdateProfileInput) {
  return rpc<{ user: User }>('update_profile', {
    p_username: input.username,
    p_avatar: input.avatar,
    p_country: input.country,
    p_country_code: input.countryCode,
    p_sponsor_url: input.sponsorUrl ?? '',
    p_sponsor_text: input.sponsorText ?? '',
  });
}

export function getMyRooms() {
  return rpc<Group[]>('get_my_rooms');
}

export function getRoomByCode(code: string) {
  return rpc<Group | null>('get_room_by_code', { p_code: code });
}

export function createRoom(input: {
  name: string;
  description?: string;
  category?: string;
  avatar?: string;
}) {
  return rpc<{ group: Group }>('create_room', {
    p_name: input.name,
    p_description: input.description ?? '',
    p_category: input.category ?? 'friends',
    p_avatar: input.avatar ?? '',
  });
}

export function joinRoom(code: string) {
  return rpc<{ group: Group; alreadyMember: boolean; premium: boolean; freeLimit: number }>(
    'join_room',
    { p_code: code }
  );
}

export function leaveRoom(roomId: string) {
  return rpc<{ left: boolean; deleted: boolean; groupId: string }>('leave_room', {
    p_room_id: roomId,
  });
}

export function deleteRoom(roomId: string) {
  return rpc<{ deleted: boolean; groupId: string }>('delete_room', {
    p_room_id: roomId,
  });
}

export function setDecree(roomId: string, decree: string) {
  return rpc<{ royalDecree: string }>('set_decree', {
    p_room_id: roomId,
    p_decree: decree,
  });
}

export interface LogPoopResponse {
  success: boolean;
  poopId: string;
  user: User;
  group: Group | null;
  previousRank: number;
  newRank: number;
  groupInfo: {
    groupId: string;
    groupName: string;
    groupRank: number;
    previousGroupRank: number;
    groupPoops: number;
    isGroupKing: boolean;
    totalMembers: number;
  } | null;
}

export function logPoop(roomId: string | null, timezoneOffset: number) {
  return rpc<LogPoopResponse>('log_poop', {
    p_room_id: roomId,
    p_note: '',
    p_timezone_offset: timezoneOffset,
  });
}

export function getMyPoops(limit = 200, offset = 0) {
  return rpc<Poop[]>('get_my_poops', {
    p_limit: limit,
    p_offset: offset,
  });
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  platform: string;
}

export function registerPushSubscription(input: PushSubscriptionInput) {
  return rpc<{ subscribed: boolean }>('register_push_subscription', {
    p_endpoint: input.endpoint,
    p_p256dh: input.p256dh,
    p_auth: input.auth,
    p_platform: input.platform,
  });
}

export function unregisterPushSubscription(endpoint: string) {
  return rpc<{ subscribed: boolean }>('unregister_push_subscription', {
    p_endpoint: endpoint,
  });
}

export interface DemoPushResult {
  ok: boolean;
  sent: number;
  reason?: string;
}

export function sendDemoPush() {
  return invokeFunction<DemoPushResult>('push-demo', {});
}

export function trackSponsorClick(userId: string) {
  return rpc<{ counted: boolean }>('track_sponsor_click', { p_user_id: userId });
}

export function markNotificationRead(notificationId: string) {
  return rpc<{ read: boolean }>('mark_notification_read', {
    p_notification_id: notificationId,
  });
}
