/**
 * Temporary open access: no watermarks, no quota enforcement.
 * Turn off later with OGKIT_OPEN_ACCESS=0 (or false/off) when billing ships.
 */
export function isOpenAccess(): boolean {
  const raw = process.env.OGKIT_OPEN_ACCESS?.trim().toLowerCase()
  if (raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') return false
  // Default ON until paid plans are intentionally re-enabled.
  return true
}
