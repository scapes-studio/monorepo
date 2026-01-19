<script setup lang="ts">
const route = useRoute()
const { getAccountDisplay } = useENSResolution()
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
          <NuxtLink to="/scapes" :class="{ active: route.path.startsWith('/scapes') }">
            Scapes
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/people" :class="{ active: route.path.startsWith('/people') }">
            Owners
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/market" :class="{ active: route.path.startsWith('/market') }">
            Market
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/activity" :class="{ active: route.path.startsWith('/activity') }">
            Activity
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/gallery27" :class="{ active: route.path.startsWith('/gallery27') }">
            Gallery27
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/merge" :class="{ active: route.path.startsWith('/merge') }">
            Merge
          </NuxtLink>
        </li>
      </slot>
    </ul>

    <div class="main-menu__actions">
      <ScapeRadioInline />
      <EvmConnect>
        <template #connected="{ address }">
          <NuxtLink :to="getAccountDisplay(address).url">
            <EvmAccount :address="address" />
          </NuxtLink>
        </template>
      </EvmConnect>
    </div>
  </nav>
</template>

<style scoped>
.main-menu {
  position: fixed;
  bottom: var(--spacer-md);
  left: var(--spacer-md);
  right: var(--spacer-md);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--spacer);
  padding: var(--spacer-sm) var(--spacer);
  background: var(--color-background, #fff);
  border: 3px solid #000;
}

.main-menu__nav {
  display: flex;
  gap: var(--spacer-sm);
  flex: 1;
}

.main-menu__actions {
  display: flex;
  align-items: center;
  gap: var(--spacer);
}
</style>
