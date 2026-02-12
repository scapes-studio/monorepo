<template>
  <nav
    ref="navRef"
    class="profile-tabs grid-shadow"
  >
    <NuxtLink
      :to="`/people/${props.accountId}`"
      class="profile-tabs__tab"
      :class="{ 'profile-tabs__tab--active': currentTab === 'scapes' }"
    >
      Scapes
    </NuxtLink>
    <NuxtLink
      :to="`/people/${props.accountId}/twenty-seven-year-scapes`"
      class="profile-tabs__tab"
      :class="{ 'profile-tabs__tab--active': currentTab === 'gallery27' }"
    >
      <span class="profile-tabs__text--mobile">27y Scapes</span>
      <span class="profile-tabs__text--desktop">Twenty Seven Year Scapes</span>
    </NuxtLink>
    <span
      class="profile-tabs__indicator"
      :style="indicatorStyle"
    />
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  accountId: string
}>()

const route = useRoute()
const { scapeWidth, gutter } = useScapeGrid()

const navRef = ref<HTMLElement | null>(null)
const indicatorStyle = ref({
  transform: 'translateX(0)',
  width: '0px',
  opacity: '0',
})

const currentTab = computed(() => {
  const path = route.path
  if (path.endsWith('/twenty-seven-year-scapes')) return 'gallery27'
  return 'scapes'
})

const snapToGrid = (naturalWidth: number) => {
  const unit = scapeWidth.value + gutter.value
  const n = Math.max(1, Math.ceil((naturalWidth + gutter.value) / unit))
  return n * unit - gutter.value
}

const snapTabWidths = () => {
  if (!navRef.value) return

  const tabs = navRef.value.querySelectorAll<HTMLElement>('.profile-tabs__tab')

  // Reset to measure natural content width
  tabs.forEach((tab) => {
    tab.style.width = 'auto'
    tab.style.minWidth = '0'
  })

  // Read natural widths in one batch
  const widths = Array.from(tabs).map((tab) => tab.scrollWidth)

  // Apply grid-snapped widths
  tabs.forEach((tab, i) => {
    tab.style.minWidth = ''
    tab.style.width = `${snapToGrid(widths[i]!)}px`
  })
}

const updateIndicator = () => {
  if (!navRef.value) return

  const activeLink = navRef.value.querySelector('.profile-tabs__tab--active')
  if (!activeLink) {
    indicatorStyle.value = {
      transform: 'translateX(0)',
      width: '0px',
      opacity: '0',
    }
    return
  }

  const navRect = navRef.value.getBoundingClientRect()
  const linkRect = activeLink.getBoundingClientRect()
  const x = linkRect.left - navRect.left + navRef.value.scrollLeft

  indicatorStyle.value = {
    transform: `translateX(${x}px)`,
    width: `${linkRect.width}px`,
    opacity: '1',
  }
}

const refresh = () => {
  nextTick(() => {
    snapTabWidths()
    updateIndicator()
  })
}

watch(() => route.path, refresh)
watch([scapeWidth, gutter], refresh)
onMounted(refresh)
</script>

<style scoped>
.profile-tabs {
  position: relative;
  display: flex;
  gap: var(--grid-gutter);
  margin-top: var(--scape-height-gutter);
  height: var(--scape-height);
  max-width: var(--content-width);
  text-align: center;
}

.profile-tabs__tab {
  text-decoration: none;
  color: var(--muted);
  min-width: var(--scape-width);
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--background);
}

.profile-tabs__tab--active {
  color: inherit;
}

.profile-tabs__text--mobile {
  display: none;
}

@media (max-width: 575px) {
  .profile-tabs__text--mobile {
    display: inline;
  }

  .profile-tabs__text--desktop {
    display: none;
  }
}

.profile-tabs__indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: calc(var(--grid-gutter) * 2);
  background: var(--color);
  border-radius: var(--grid-gutter) var(--grid-gutter) 0 0;
  transition:
    transform 0.3s ease,
    width 0.3s ease,
    opacity 0.3s ease;
  pointer-events: none;
  will-change: transform, width;
}
</style>
