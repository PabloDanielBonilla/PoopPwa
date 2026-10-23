/**
 * Safely opens an external URL without returning a Window object,
 * exposing cross-origin properties, or executing malicious URI schemes.
 */
export function safeOpenUrl(rawUrl: string): void {
  if (!rawUrl || typeof rawUrl !== 'string') return;

  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  // Security: Block XSS / URI exploits like javascript: or data:
  if (
    lower.startsWith('javascript:') || 
    lower.startsWith('data:') || 
    lower.startsWith('vbscript:') || 
    lower.startsWith('file:')
  ) {
    console.warn('[Security Guard] Blocked potentially unsafe protocol:', url);
    return;
  }

  // Ensure HTTP/HTTPS or allowed social protocols
  let targetUrl = url;
  if (
    !lower.startsWith('http://') && 
    !lower.startsWith('https://') && 
    !lower.startsWith('mailto:') && 
    !lower.startsWith('tel:') && 
    !lower.startsWith('whatsapp:')
  ) {
    targetUrl = `https://${url}`;
  }

  try {
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (win) {
      try {
        win.opener = null;
      } catch (_) {}
    }
  } catch (err) {
    console.error('Failed to open URL safely:', err);
  }
}
