<script setup lang="ts">
const {
  isPlaying,
  isLoading,
  currentScape,
  mode,
  progress,
  isExpanded,
  hasStarted,
  toggle,
  skip,
  toggleExpanded,
  collapse,
} = useScapeRadio();

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".scape-radio-inline")) {
    collapse();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="scape-radio-inline" :class="{ 'scape-radio-inline--expanded': isExpanded }">
    <!-- Collapsed state: button -->
    <button v-if="!isExpanded" type="button" class="scape-radio-inline__trigger" @click.stop="toggleExpanded">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
      <span class="scape-radio-inline__trigger-label">Radio</span>
    </button>

    <!-- Expanded state: player panel -->
    <div v-else class="scape-radio-inline__panel" @click.stop>
      <!-- Progress ring around cover -->
      <div class="scape-radio-inline__cover-wrapper">
        <svg class="scape-radio-inline__progress-ring" viewBox="0 0 100 100">
          <circle class="scape-radio-inline__progress-ring-bg" cx="50" cy="50" r="45" />
          <circle
            class="scape-radio-inline__progress-ring-fill"
            cx="50"
            cy="50"
            r="45"
            :style="{ strokeDashoffset: 283 - (283 * progress) / 100 }"
          />
        </svg>
        <NuxtLink
          v-if="currentScape"
          :to="`/scapes/${currentScape.id}`"
          class="scape-radio-inline__cover"
          @click="collapse"
        >
          <img :src="currentScape.coverUrl" :alt="currentScape.title" />
        </NuxtLink>
        <div v-else class="scape-radio-inline__cover scape-radio-inline__cover--empty" />
      </div>

      <!-- Info and controls -->
      <div class="scape-radio-inline__content">
        <NuxtLink
          v-if="currentScape"
          :to="`/scapes/${currentScape.id}`"
          class="scape-radio-inline__title"
          @click="collapse"
        >
          {{ currentScape.title }}
        </NuxtLink>
        <span v-else class="scape-radio-inline__title scape-radio-inline__title--empty">
          Scape Radio
        </span>

        <span v-if="mode === 'fixed'" class="scape-radio-inline__mode">
          Playing this scape
        </span>

        <div class="scape-radio-inline__controls">
          <button
            type="button"
            class="scape-radio-inline__btn scape-radio-inline__btn--play"
            :disabled="isLoading"
            @click="toggle"
          >
            <span v-if="isLoading">...</span>
            <svg v-else-if="isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>

          <button
            v-if="mode === 'random' && hasStarted"
            type="button"
            class="scape-radio-inline__btn scape-radio-inline__btn--skip"
            :disabled="isLoading || !isPlaying"
            @click="skip"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,4 15,12 5,20" />
              <rect x="15" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Close button -->
      <button type="button" class="scape-radio-inline__close" @click="collapse">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.scape-radio-inline {
  position: relative;
}

/* Trigger button (collapsed) */
.scape-radio-inline__trigger {
  display: flex;
  align-items: center;
  gap: var(--spacer-xs);
  padding: var(--spacer-xs) var(--spacer-sm);
  background: var(--color-bg, #fff);
  border: 1px solid var(--gray-z-3, #ccc);
  cursor: pointer;
  transition: background 0.2s;
}

.scape-radio-inline__trigger:hover {
  background: var(--gray-z-1, #f5f5f5);
}

.scape-radio-inline__trigger-label {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
}

/* Expanded panel */
.scape-radio-inline__panel {
  position: absolute;
  bottom: calc(100% + var(--spacer-sm));
  right: 0;
  display: flex;
  align-items: center;
  gap: var(--spacer-sm);
  padding: var(--spacer-sm);
  padding-right: var(--size-5);
  background: var(--color-bg, #fff);
  border: 2px solid #000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 240px;
}

/* Cover with progress ring */
.scape-radio-inline__cover-wrapper {
  position: relative;
  width: var(--size-5);
  height: var(--size-5);
  flex-shrink: 0;
}

.scape-radio-inline__progress-ring {
  position: absolute;
  inset: -3px;
  width: calc(100% + 6px);
  height: calc(100% + 6px);
  transform: rotate(-90deg);
}

.scape-radio-inline__progress-ring-bg {
  fill: none;
  stroke: var(--gray-z-2, #e5e5e5);
  stroke-width: 3;
}

.scape-radio-inline__progress-ring-fill {
  fill: none;
  stroke: var(--color-accent, #000);
  stroke-width: 3;
  stroke-dasharray: 283;
  stroke-dashoffset: 283;
  transition: stroke-dashoffset 0.1s linear;
}

.scape-radio-inline__cover {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--gray-z-1, #f5f5f5);
}

.scape-radio-inline__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.scape-radio-inline__cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted, #999);
}

/* Content */
.scape-radio-inline__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scape-radio-inline__title {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scape-radio-inline__title:hover {
  text-decoration: underline;
}

.scape-radio-inline__title--empty {
  color: var(--muted, #999);
}

.scape-radio-inline__mode {
  font-size: var(--font-size-xs);
  color: var(--muted, #999);
}

/* Controls */
.scape-radio-inline__controls {
  display: flex;
  gap: var(--spacer-xs);
}

.scape-radio-inline__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size-4);
  height: var(--size-4);
  padding: 0;
  background: var(--gray-z-1, #f5f5f5);
  border: 1px solid var(--gray-z-3, #ccc);
  cursor: pointer;
  transition: background 0.2s;
}

.scape-radio-inline__btn:hover:not(:disabled) {
  background: var(--gray-z-2, #e5e5e5);
}

.scape-radio-inline__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scape-radio-inline__btn--play {
  background: var(--color-accent, #000);
  border-color: var(--color-accent, #000);
  color: var(--color-bg, #fff);
}

.scape-radio-inline__btn--play:hover:not(:disabled) {
  opacity: 0.9;
  background: var(--color-accent, #000);
}

/* Close button */
.scape-radio-inline__close {
  position: absolute;
  top: var(--spacer-xs);
  right: var(--spacer-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size-3);
  height: var(--size-3);
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--muted, #999);
  opacity: 0.6;
  transition: opacity 0.2s;
}

.scape-radio-inline__close:hover {
  opacity: 1;
}

@media (max-width: 500px) {
  .scape-radio-inline__trigger-label {
    display: none;
  }

  .scape-radio-inline__panel {
    min-width: 200px;
  }
}
</style>
