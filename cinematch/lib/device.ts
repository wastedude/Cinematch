/**
 * Anonymous device identity — client-side only.
 * Generates or retrieves a stable UUID stored in localStorage.
 * This is used instead of authentication.
 */

const STORAGE_KEY = 'cinematch_device_id'

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
