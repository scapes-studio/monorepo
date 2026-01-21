<script setup lang="ts">
const route = useRoute()
const { getAccountDisplay } = useENSResolution()
</script>

<template>
  <nav class="main-menu border-drop">
    <div class="main-menu__brand border">
      <NuxtLink to="/">
        <img src="/icon.png" alt="Scapes Logo" />
      </NuxtLink>
    </div>

    <ul class="main-menu__nav">
      <slot name="nav">
        <li>
          <NuxtLink to="/" :class="{ active: route.path === '/' }">
            Home
          </NuxtLink>
        </li>
        <!-- <li> -->
        <!--   <NuxtLink to="/scapes" :class="{ active: route.path.startsWith('/scapes') }"> -->
        <!--     Scapes -->
        <!--   </NuxtLink> -->
        <!-- </li> -->
        <li>
          <NuxtLink to="/people" :class="{ active: route.path.startsWith('/people') }">
            Owners
          </NuxtLink>
        </li>
        <!-- <li> -->
        <!--   <NuxtLink to="/market" :class="{ active: route.path.startsWith('/market') }"> -->
        <!--     Market -->
        <!--   </NuxtLink> -->
        <!-- </li> -->
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
          <NuxtLink :to="getAccountDisplay(address).url" class="border">
            <AccountAvatar :address="address" />
          </NuxtLink>
        </template>
      </EvmConnect>
    </div>
  </nav>
</template>

<style scoped>
.main-menu {
  --offset-min: calc(var(--grid-margin-offset) / 2 + var(--grid-gutter));

  position: fixed;
  bottom: max(var(--offset-min), env(safe-area-inset-bottom));
  left: max(var(--offset-min), env(safe-area-inset-left));
  right: max(var(--offset-min), env(safe-area-inset-right));
  z-index: 100;
  display: flex;
  align-items: center;
  height: var(--scape-height);
  padding: 0;
  background: var(--color-background, #fff);
}

.main-menu__brand {
  width: var(--scape-height);
  height: var(--scape-height);
}

.main-menu__nav {
  display: flex;
  gap: var(--spacer-sm);
  flex: 1;
}

.main-menu__actions {
  display: flex;
  align-items: center;
}
</style>
