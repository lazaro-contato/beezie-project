const MOBILE_UA_PATTERN = /Mobi|Android|iPhone|iPod/;

export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  return MOBILE_UA_PATTERN.test(userAgent);
}
