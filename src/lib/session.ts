/**
 * Session Storage for PIN - stores PIN only in memory for current session
 * PIN is cleared when:
 * - User closes the Mini App
 * - Tab is closed
 * - 15 minutes of inactivity
 * 
 * Security:
 * - PIN never stored in localStorage
 * - PIN never sent to server
 * - PIN only in memory (sessionStorage)
 */

const SESSION_KEY = 'uzum_session_pin';
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface PINSession {
  pin: string;
  timestamp: number;
}

/**
 * Store PIN in session
 */
export function setSessionPIN(pin: string): void {
  const session: PINSession = {
    pin,
    timestamp: Date.now()
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Get PIN from session (if not expired)
 */
export function getSessionPIN(): string | null {
  const data = sessionStorage.getItem(SESSION_KEY);
  if (!data) return null;
  
  try {
    const session: PINSession = JSON.parse(data);
    const age = Date.now() - session.timestamp;
    
    if (age > SESSION_TIMEOUT_MS) {
      clearSessionPIN();
      return null;
    }
    
    return session.pin;
  } catch (error) {
    console.error('Failed to parse session PIN:', error);
    clearSessionPIN();
    return null;
  }
}

/**
 * Clear PIN from session
 */
export function clearSessionPIN(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Check if PIN exists in session
 */
export function hasSessionPIN(): boolean {
  return getSessionPIN() !== null;
}

/**
 * Update session timestamp (keep session alive)
 */
export function refreshSessionPIN(): void {
  const pin = getSessionPIN();
  if (pin) {
    setSessionPIN(pin);
  }
}
