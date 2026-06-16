/**
 * Room-level layout.
 * Keeps the page wrapper minimal — realtime subscriptions live
 * in the hooks (useRoom, useMatches) inside the page component itself.
 */
export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
