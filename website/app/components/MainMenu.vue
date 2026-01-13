<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <nav class="main-menu">
    <div class="main-menu__brand">
      <NuxtLink to="/">
        <slot name="logo">Scapes</slot>
      </NuxtLink>
    </div>

    <ul class="main-menu__nav">
      <slot name="nav">
        <li>
          <NuxtLink to="/" :class="{ active: route.path === '/' }">
            Home
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/accounts" :class="{ active: route.path.startsWith('/accounts') }">
            Owners
          </NuxtLink>
        </li>
      </slot>
    </ul>

    <div class="main-menu__actions">
      <EvmConnect>
        <template #connected="{ address }">
          <NuxtLink :to="`/accounts/${address}`">
            <EvmAccount :address="address" />
          </NuxtLink>
        </template>
      </EvmConnect>
    </div>
  </nav>
</template>

<style scoped>
.main-menu {
  display: flex;
  align-items: center;
  gap: var(--spacer);
  padding: var(--spacer-sm) var(--spacer);
}

.main-menu__nav {
  display: flex;
  gap: var(--spacer-sm);
  flex: 1;
}
</style>
