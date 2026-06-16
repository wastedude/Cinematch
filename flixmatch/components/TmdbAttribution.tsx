/**
 * REQUIRED: TMDB attribution footer.
 * Must be rendered on every page — TMDB Terms of Use §3.
 * Keep the TMDB logo less prominent than the CineMatch logo.
 */
export function TmdbAttribution() {
  return (
    <footer
      className="w-full flex flex-col items-center gap-1 py-4 px-4"
      style={{ opacity: 0.55 }}
      aria-label="TMDB attribution"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tmdb-logo.svg"
        alt="The Movie Database (TMDB) logo"
        height={12}
        style={{ display: 'inline-block' }}
      />
      <p className="text-center" style={{ fontSize: 11, color: 'var(--app-text-2)' }}>
        This application uses TMDB and the TMDB APIs but is not endorsed,
        certified, or otherwise approved by TMDB.
      </p>
    </footer>
  )
}
