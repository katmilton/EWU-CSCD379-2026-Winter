<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="logo">🧪</span>
        <span class="title">Potion Ledger</span>
      </div>

      <nav class="nav">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/play">Play</NuxtLink>
        <NuxtLink to="/leaderboard">Leaderboard</NuxtLink>
        <NuxtLink to="/testimonials">Testimonials</NuxtLink>
      </nav>
    </header>

    <main class="content">
      <NuxtPage />
    </main>

    <footer class="footer">
      <span class="muted">Potion Ledger</span>
    </footer>
  </div>
</template>

<style>
:root { color-scheme: light; }
.shell { min-height: 100vh; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #fbfbfb; color: #111; }
.topbar { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid #e6e6e6; background:#fff; position: sticky; top: 0; }
.brand { display:flex; align-items:center; gap:10px; }
.logo { font-size: 20px; }
.title { font-weight: 800; letter-spacing: 0.2px; }
.nav { display:flex; gap:10px; flex-wrap: wrap; justify-content: flex-end; }
.nav a { text-decoration:none; color:#222; padding:6px 10px; border-radius: 10px; border:1px solid transparent; }
.nav a.router-link-active { background:#f2f2f2; border-color:#e8e8e8; }
.content { max-width: 980px; margin: 0 auto; padding: 16px; }
.footer { padding: 14px 16px; border-top:1px solid #e6e6e6; background:#fff; }
.muted { opacity: 0.7; }
</style>
