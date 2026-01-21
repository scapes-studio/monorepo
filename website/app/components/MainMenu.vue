<script setup lang="ts">
const route = useRoute()
const { getAccountDisplay } = useENSResolution()

const isMenuOpen = ref(false)

const navItems = [
  { path: '/', label: 'Home', match: (p: string) => p === '/' },
  { path: '/people', label: 'Owners', match: (p: string) => p.startsWith('/people') },
  { path: '/activity', label: 'Activity', match: (p: string) => p.startsWith('/activity') },
  { path: '/gallery27', label: 'Gallery27', match: (p: string) => p.startsWith('/gallery27') },
  { path: '/merge', label: 'Merge', match: (p: string) => p.startsWith('/merge') },
]

const currentPageLabel = computed(() => {
  const item = navItems.find(item => item.match(route.path))
  return item?.label ?? 'Menu'
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.main-menu')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <nav class="main-menu border-drop">
    <!-- Mobile menu panel -->
    <Transition name="slide-up-menu">
      <div v-if="isMenuOpen" class="main-menu__mobile-panel border-drop">
        <ul class="main-menu__mobile-nav">
          <li>
            <NuxtLink to="/" :class="{ active: route.path === '/' }" @click="closeMenu">
              Home
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/people" :class="{ active: route.path.startsWith('/people') }" @click="closeMenu">
              Owners
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/activity" :class="{ active: route.path.startsWith('/activity') }" @click="closeMenu">
              Activity
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/gallery27" :class="{ active: route.path.startsWith('/gallery27') }" @click="closeMenu">
              Gallery27
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/merge" :class="{ active: route.path.startsWith('/merge') }" @click="closeMenu">
              Merge
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>

    <div class="main-menu__brand border">
      <NuxtLink to="/">
        <img src="/icon.png" alt="Scapes Logo" />
      </NuxtLink>
    </div>

    <!-- Mobile: page title trigger -->
    <Button type="button" class="main-menu__page-title unstyled" @click.stop="toggleMenu">
      {{ currentPageLabel }}
    </Button>

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
  --offset-min: calc(var(--grid-margin-offset) / 2 + var(--grid-gutter));

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
}

.main-menu__brand {
  flex-shrink: 0;
  width: var(--scape-height);
  height: var(--scape-height);
}

.main-menu__nav {
  display: flex;
  gap: var(--spacer-sm);
  flex: 1;
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

/* Page title trigger - hidden on desktop */
.main-menu__page-title {
  display: none;
}

/* Mobile menu panel - hidden on desktop */
.main-menu__mobile-panel {
  display: none;
}

/* Mobile styles */
@media (max-width: 48rem) {

  /* Hide desktop nav */
  .main-menu__nav {
    display: none;
  }

  /* Show page title trigger */
  .main-menu__page-title {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    padding: 0 var(--spacer-sm);
    border: none;
    background: transparent;
    font-size: var(--font-size-sm);
    cursor: pointer;
  }

  /* Mobile menu panel */
  .main-menu__mobile-panel {
    display: block;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-background, #fff);
    z-index: 99;
    margin-bottom: var(--grid-gutter);
    min-width: calc(var(--scape-width) * 1.5);
  }

  .main-menu__mobile-nav {
    display: flex;
    flex-direction: column;
    padding: var(--spacer-sm);
    gap: var(--spacer-xs);
  }

  .main-menu__mobile-nav li {
    list-style: none;
  }

  .main-menu__mobile-nav a {
    display: block;
    padding: var(--spacer-xs) var(--spacer-sm);
    text-decoration: none;
    font-size: var(--font-size-sm);
  }

  .main-menu__mobile-nav a:hover,
  .main-menu__mobile-nav a.active {
    background: var(--gray-z-2, #e5e5e5);
  }

  /* Slide up transition */
  .slide-up-menu-enter-active,
  .slide-up-menu-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .slide-up-menu-enter-from,
  .slide-up-menu-leave-to {
    transform: translateY(10px);
    opacity: 0;
  }
}
</style>
