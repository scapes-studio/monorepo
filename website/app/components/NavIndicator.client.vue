<template>
  <ul
    ref="navRef"
    class="nav-indicator"
  >
    <slot />
    <span
      class="nav-indicator__bar"
      :style="indicatorStyle"
    />
  </ul>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

const route = useRoute()

const navRef = ref<HTMLElement | null>(null)
const indicatorStyle = ref({
  transform: 'translateX(0)',
  width: '0px',
  opacity: '0',
})
let resizeFrame: number | null = null

const updateIndicator = () => {
  if (!navRef.value) return

  const activeLink = navRef.value.querySelector('.router-link-active')
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

const onResize = () => {
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => {
    updateIndicator()
    resizeFrame = null
  })
}

watch(
  () => route.path,
  () => {
    nextTick(updateIndicator)
  },
)

useEventListener(window, 'resize', onResize, { passive: true })

onMounted(() => {
  nextTick(updateIndicator)
})

defineExpose({ navRef })
</script>

<style scoped>
.nav-indicator {
  position: relative;
  display: flex;
  align-items: center;
  gap: calc(var(--scape-height) / 2);
  flex: 1;
  height: 100%;
  justify-content: center;
  padding: 0 calc(var(--scape-height) / 2);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-indicator__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: calc(var(--grid-gutter) * 2);
  background: black;
  border-radius: var(--grid-gutter) var(--grid-gutter) 0 0;
  transition:
    transform 0.3s ease,
    width 0.3s ease,
    opacity 0.3s ease;
  pointer-events: none;
  will-change: transform, width;
}

@media (max-width: 48rem) {
  .nav-indicator {
    justify-content: flex-start;
    padding: 0 var(--spacer-md);
    gap: var(--spacer-md);
  }

  .nav-indicator :deep(li a) {
    white-space: nowrap;
  }
}
</style>
