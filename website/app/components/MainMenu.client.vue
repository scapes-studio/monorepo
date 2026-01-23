<script setup lang="ts">
const route = useRoute()
const { getAccountDisplay } = useENSResolution()

const isLoaded = ref(false)
const navRef = ref<HTMLElement | null>(null)
const indicatorStyle = ref({ left: '0px', width: '0px' })

const updateIndicator = () => {
  if (!navRef.value) return

  const activeLink = navRef.value.querySelector('.router-link-active')
  if (!activeLink) {
    indicatorStyle.value = { left: '0px', width: '0px' }
    return
  }

  const navRect = navRef.value.getBoundingClientRect()
  const linkRect = activeLink.getBoundingClientRect()

  indicatorStyle.value = {
    left: `${linkRect.left - navRect.left + navRef.value.scrollLeft}px`,
    width: `${linkRect.width}px`,
  }
}

watch(() => route.path, () => {
  nextTick(updateIndicator)
})

onMounted(() => {
  isLoaded.value = true
  nextTick(updateIndicator)
})
</script>

<template>
  <nav class="main-menu border-drop" :class="{ 'is-loaded': isLoaded }">
    <div class="main-menu__brand border">
      <NuxtLink to="/">
        <img src="/icon.png" alt="Scapes Logo" />
      </NuxtLink>
    </div>

    <ul ref="navRef" class="main-menu__nav">
      <slot name="nav">
        <li><NuxtLink to="/scapes">Scapes</NuxtLink></li>
        <li><NuxtLink to="/people">Owners</NuxtLink></li>
        <li><NuxtLink to="/activity">Activity</NuxtLink></li>
        <li><NuxtLink to="/gallery27">Gallery27</NuxtLink></li>
        <li><NuxtLink to="/merge">Merge</NuxtLink></li>
      </slot>
      <span class="main-menu__indicator" :style="indicatorStyle" />
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
  position: relative;
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

.main-menu__indicator {
  position: absolute;
  bottom: 0;
  height: calc(var(--grid-gutter) * 2);
  background: black;
  border-radius: var(--grid-gutter) var(--grid-gutter) 0 0;
  transition: left 0.3s ease, width 0.3s ease;
  pointer-events: none;
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
