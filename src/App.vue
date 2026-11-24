<template>
  <header class="site-header">
    <div class="shell header-row">
      <RouterLink to="/" class="brand"><span class="brand-symbol" aria-hidden="true">/a/</span>每日雅思口语练习站</RouterLink>
      <nav aria-label="主导航">
        <RouterLink to="/">今日一练</RouterLink>
        <RouterLink to="/phonemes">48 音素</RouterLink>
        <RouterLink to="/practice">拆词与跟读</RouterLink>
      </nav>
    </div>
  </header>
  <main class="shell"><RouterView /></main>
  <nav class="bottom-tabs" aria-label="底部导航">
    <RouterLink to="/"><span aria-hidden="true">📅</span>今日一练</RouterLink>
    <RouterLink to="/phonemes"><span aria-hidden="true">/a/</span>音标表</RouterLink>
    <RouterLink to="/practice"><span aria-hidden="true">🎙</span>拆词跟读</RouterLink>
  </nav>
</template>
