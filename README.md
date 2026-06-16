# CineMatch

> Tinder for movies — swipe with a friend, find your match.

Two people join an anonymous room, each pick genres, swipe through a shared 15-movie deck, and get real-time "It's a Match!" notifications when both like the same film.

**No account required. Works on any device.**

---

## Docs

- [User Guide](docs/README-user.md) — how to use the app
- [Developer Guide](docs/README-developer.md) — setup, architecture, deployment

## Quick Start (Developers)

```bash
git clone https://github.com/your-username/flixmatch.git
cd flixmatch/flixmatch
npm install
cp .env.example .env.local   # fill in your API keys
npm run dev
```

See the [Developer Guide](docs/README-developer.md) for full setup instructions including Supabase schema and required RLS policies.

---

*This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.*
