// These touch localStorage and navigator, so callers must guard isPlatformBrowser themselves.
export function getOrCreateDeviceId(): string {
  const key = 'kaf_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

// iPhone and iPad UAs contain "like Mac OS X", so they must be matched before Mac.
// iPadOS 13+ Safari sends a desktop Mac UA; only the touch points tell it apart.
export function parseDeviceName(ua: string, maxTouchPoints = 0): string {
  let os = 'Unknown OS';
  if (/iPhone|iPod/.test(ua))        os = 'iPhone';
  else if (/iPad/.test(ua))          os = 'iPad';
  else if (/Android/.test(ua))       os = 'Android';
  else if (/Windows NT 10/.test(ua)) os = 'Windows 10';
  else if (/Windows NT 6/.test(ua))  os = 'Windows';
  else if (/Macintosh/.test(ua) && maxTouchPoints > 1) os = 'iPad';
  else if (/Mac OS X/.test(ua))      os = 'Mac';
  else if (/Linux/.test(ua))         os = 'Linux';

  let browser = 'Browser';
  if (/Edg\/|EdgiOS\//.test(ua))         browser = 'Edge';
  else if (/OPR\//.test(ua))             browser = 'Opera';
  else if (/Chrome\/|CriOS\//.test(ua))  browser = 'Chrome';
  else if (/Firefox\/|FxiOS\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua))          browser = 'Safari';

  return `${browser} / ${os}`;
}
