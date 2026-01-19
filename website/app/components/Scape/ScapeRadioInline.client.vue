<script setup lang="ts">
const {
  isPlaying,
  isLoading,
  currentScape,
  volume,
  play,
  pause,
  collapse,
  setVolume,
} = useScapeRadio();

const isVolumeOpen = ref(false);

// Show expanded when playing
const showExpanded = computed(() => isPlaying.value);

const handlePlayPause = async () => {
  if (isPlaying.value) {
    await pause();
    collapse();
    isVolumeOpen.value = false;
  } else {
    await play();
  }
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".scape-radio-inline")) {
    isVolumeOpen.value = false;
  }
};

const handleVolumeChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  setVolume(parseFloat(input.value));
};

const toggleVolume = () => {
  isVolumeOpen.value = !isVolumeOpen.value;
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="scape-radio-inline" :class="{ 'scape-radio-inline--expanded': showExpanded }">
    <!-- Scape cover (slides out left when expanded) -->
    <Transition name="slide-left">
      <NuxtLink
        v-if="showExpanded && currentScape"
        :to="`/scapes/${currentScape.id}`"
        class="scape-radio-inline__cover"
      >
        <img :src="currentScape.coverUrl" :alt="currentScape.title" />
      </NuxtLink>
    </Transition>

    <!-- Play/pause button (always visible) -->
    <button
      type="button"
      class="scape-radio-inline__play"
      :disabled="isLoading"
      @click.stop="handlePlayPause"
    >
      <span v-if="isLoading" class="scape-radio-inline__loading">...</span>
      <svg v-else-if="isPlaying" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="currentColor">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="currentColor">
        <polygon points="5,3 19,12 5,21" />
      </svg>
    </button>

    <!-- Volume control (slides out right when expanded) -->
    <Transition name="slide-right">
      <div v-if="showExpanded" class="scape-radio-inline__volume-wrapper" @click.stop>
        <button
          type="button"
          class="scape-radio-inline__volume-btn"
          @click="toggleVolume"
        >
          <svg v-if="volume > 0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          <svg v-else-if="volume > 0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        </button>

        <!-- Vertical volume slider -->
        <Transition name="slide-up">
          <div v-if="isVolumeOpen" class="scape-radio-inline__volume-slider">
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
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scape-radio-inline {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
}

/* Play button */
.scape-radio-inline__play {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size-5);
  height: var(--size-5);
  padding: 0;
  background: var(--color-bg, #fff);
  border: 1px solid var(--gray-z-3, #ccc);
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  z-index: 2;
}

.scape-radio-inline__play:hover:not(:disabled) {
  background: var(--gray-z-1, #f5f5f5);
}

.scape-radio-inline__play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scape-radio-inline__loading {
  font-size: var(--font-size-sm);
}

/* Cover image */
.scape-radio-inline__cover {
  display: block;
  width: var(--size-5);
  height: var(--size-5);
  overflow: hidden;
  background: var(--gray-z-1, #f5f5f5);
  flex-shrink: 0;
  border: 1px solid var(--gray-z-3, #ccc);
  border-right: none;
}

.scape-radio-inline__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

/* Volume wrapper */
.scape-radio-inline__volume-wrapper {
  position: relative;
}

.scape-radio-inline__volume-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size-5);
  height: var(--size-5);
  padding: 0;
  background: var(--color-bg, #fff);
  border: 1px solid var(--gray-z-3, #ccc);
  border-left: none;
  cursor: pointer;
  transition: background 0.2s;
}

.scape-radio-inline__volume-btn:hover {
  background: var(--gray-z-1, #f5f5f5);
}

/* Vertical volume slider */
.scape-radio-inline__volume-slider {
  position: absolute;
  bottom: calc(100% + var(--spacer-xs));
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg, #fff);
  border: 1px solid var(--gray-z-3, #ccc);
  padding: var(--spacer-sm) var(--spacer-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scape-radio-inline__slider {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 8px;
  height: 80px;
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

/* Transitions */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(10px);
  opacity: 0;
}
</style>
