<script setup lang="ts">
const route = useRoute()
const { getAccountDisplay } = useENSResolution()

const isLoaded = ref(false)

onMounted(() => {
  isLoaded.value = true
})
</script>

<template>
  <nav class="main-menu border-drop" :class="{ 'is-loaded': isLoaded }">
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
      <ScapeRadio />
      <EvmConnect class-name="main-menu__actions-connect">
        <template #default>
          <AccountAvatar />
        </template>
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
  --offset-min: max(calc(var(--grid-margin-offset) / 2 + var(--grid-gutter)), calc(var(--scape-height)/2));

  position: fixed;
  bottom: max(var(--offset-min), env(safe-area-inset-bottom));
  left: max(var(--offset-min), env(safe-area-inset-left));
  right: max(var(--offset-min), env(safe-area-inset-right));
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--grid-gutter);
  height: var(--scape-height);
  padding: 0;
  background: var(--color-background, #fff);
  display: none;
  opacity: 0;
}

.main-menu.is-loaded {
  display: flex;
  opacity: 1;
  transition: opacity var(--speed) ease, display var(--speed) ease allow-discrete;

  @starting-style {
    opacity: 0;
  }
}

.main-menu__brand {
  flex-shrink: 0;
  width: var(--scape-height);
  height: var(--scape-height);
}

.main-menu__nav {
  display: flex;
  align-items: center;
  gap: calc(var(--scape-height)/2);
  flex: 1;
  height: 100%;
  justify-content: center;
  padding: 0 calc(var(--scape-height)/2);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.main-menu__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--grid-gutter);

  &:deep(.main-menu__actions-connect) {
    padding: 0 !important;
  }
}

.main-menu__brand a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.main-menu__brand img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Mobile styles */
@media (max-width: 48rem) {
  .main-menu__nav {
    justify-content: flex-start;
    padding: 0 var(--spacer-md);
    gap: var(--spacer-md);
  }

  .main-menu__nav li a {
    white-space: nowrap;
  }
}
</style>
