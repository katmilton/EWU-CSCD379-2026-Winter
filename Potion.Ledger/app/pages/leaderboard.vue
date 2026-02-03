<template>
  <section class="card">
    <h1>Leaderboard</h1>
    <p class="muted">Next step we’ll load this from the API.</p>

    <div class="row">
      <NuxtLink class="btn" to="/play">Play</NuxtLink>
      <NuxtLink class="btn" to="/testimonials">Testimonials</NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.card { background:#fff; border:1px solid #e6e6e6; border-radius:16px; padding:16px; }
h1 { margin:0 0 8px; font-size: 1.6rem; }
.muted { margin:0; opacity:0.75; }
.row { display:flex; gap:10px; flex-wrap: wrap; margin-top: 16px; }
.btn { display:inline-block; padding:10px 14px; border-radius: 12px; border:1px solid #222; text-decoration:none; color:#222; background:#fff; }
</style>
