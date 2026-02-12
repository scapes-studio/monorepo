<template>
  <div
    class="scape-radio-inline"
    @mouseenter="onHover(true)"
    @mouseleave="onHover(false)"
  >
    <!-- Hover popover (only when playing) -->
    <Transition name="fade-up">
      <div
        v-if="isHovered && isPlaying"
        class="scape-radio-inline__popover"
      >
        <!-- Link to scape (only if not on that page) -->
        <NuxtLink
          v-if="currentScape && !isOnScapePage"
          :to="`/${currentScape.id}`"
          class="scape-radio-inline__link border"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
            <polyline points="15 3 21 3 21 9" />
            <line
              x1="10"
              y1="14"
              x2="21"
              y2="3"
            />
          </svg>
        </NuxtLink>

        <!-- Volume slider -->
        <div class="scape-radio-inline__volume border">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            class="scape-radio-inline__slider"
            @input="handleVolumeChange"
          />
        </div>
      </div>
    </Transition>

    <!-- Main button -->
    <button
      type="button"
      class="scape-radio-inline__btn border"
      :disabled="isLoading"
      @click.stop="handlePlayPause"
    >
      <!-- Background image (when playing) -->
      <img
        v-if="isPlaying && currentScape"
        :src="currentScape.coverUrl"
        :alt="currentScape.title"
        class="scape-radio-inline__cover"
      />

      <!-- Play/pause icon -->
      <span class="scape-radio-inline__icon">
        <span
          v-if="isLoading"
          class="scape-radio-inline__loading"
          >...</span
        >
        <IconPause v-else-if="isPlaying" />
        <IconPlay v-else />
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { isPlaying, isLoading, currentScape, volume, play, pause, setVolume } =
  useScapeRadio()

const isHovered = ref(false)

// Check if currently on the scape's detail page
const isOnScapePage = computed(() => {
  if (!currentScape.value) return false
  return route.path === `/${currentScape.value.id}`
})

const onHover = (hovered: boolean) => {
  isHovered.value = hovered
}

const handlePlayPause = async () => {
  if (isPlaying.value) {
    await pause()
  } else {
    await play()
  }
}

const handleVolumeChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  setVolume(parseFloat(input.value))
}
</script>

<style scoped>
.scape-radio-inline {
  position: relative;
  width: var(--scape-height);
  height: var(--scape-height);
}

.scape-radio-inline__btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--color-background);
}

.scape-radio-inline__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scape-radio-inline__cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.scape-radio-inline__icon {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.scape-radio-inline__loading {
  font-size: var(--font-size-sm);
}

.scape-radio-inline__popover {
  position: absolute;
  bottom: 100%;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: var(--grid-gutter);
  padding-bottom: var(--grid-gutter);
  background: var(--background);
}

.scape-radio-inline__link {
  width: var(--scape-height);
  height: var(--scape-height);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
}

.scape-radio-inline__volume {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--scape-height) / 4) 0;
  background: var(--color-background);
  height: calc(2 * var(--scape-height-gutter));
  width: var(--scape-height);
}

.scape-radio-inline__slider {
  writing-mode: vertical-lr;
  direction: rtl;
  width: calc(var(--scape-height) / 4);
  height: calc(100%);
  appearance: none;
  background: var(--gray-z-2, #e5e5e5);
  cursor: pointer;
}

.scape-radio-inline__slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-accent, #000);
  border-radius: 0;
  cursor: pointer;
}

.scape-radio-inline__slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--color-accent, #000);
  border: none;
  border-radius: 0;
  cursor: pointer;
}

/* Fade-up transition */
.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
