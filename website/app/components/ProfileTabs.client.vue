<script setup lang="ts">
const props = defineProps<{
  accountId: string
}>()

const route = useRoute()

const navRef = ref<HTMLElement | null>(null)
const indicatorStyle = ref({ transform: 'translateX(0)', width: '0px', opacity: '0' })

const currentTab = computed(() => {
  const path = route.path
  if (path.endsWith('/twenty-seven-year-scapes')) return 'gallery27'
  return 'scapes'
})

const updateIndicator = () => {
  if (!navRef.value) return

  const activeLink = navRef.value.querySelector('.profile-tabs__tab--active')
  if (!activeLink) {
    indicatorStyle.value = { transform: 'translateX(0)', width: '0px', opacity: '0' }
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

watch(() => route.path, () => {
  nextTick(updateIndicator)
})

onMounted(() => {
  nextTick(updateIndicator)
})
</script>

<template>
  <nav ref="navRef" class="profile-tabs">
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
      Twenty Seven Year Scapes
    </NuxtLink>
    <span class="profile-tabs__indicator" :style="indicatorStyle" />
  </nav>
</template>

<style scoped>
.profile-tabs {
  position: relative;
  display: flex;
  gap: var(--grid-gutter);
  margin-block: var(--scape-height-gutter);
  height: var(--scape-height);
}

.profile-tabs__tab {
  text-decoration: none;
  color: var(--muted);
  min-width: var(--scape-width);
  padding: var(--spacer);
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-tabs__tab--active {
  color: inherit;
}

.profile-tabs__indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: calc(var(--grid-gutter) * 2);
  background: black;
  border-radius: var(--grid-gutter) var(--grid-gutter) 0 0;
  transition: transform 0.3s ease, width 0.3s ease, opacity 0.3s ease;
  pointer-events: none;
  will-change: transform, width;
}
</style>
