<template>
  <div class="merge-preview">
    <div class="merge-preview__canvas">
      <div
        v-if="isLoading"
        class="merge-preview__loading"
      >
        Loading preview...
      </div>
      <div
        v-else-if="error"
        class="merge-preview__error"
      >
        {{ error.message }}
      </div>
      <img
        v-else-if="previewUrl && hasPreview"
        class="merge-preview__image"
        :src="previewUrl"
        alt="Merge preview"
      />
      <div
        v-else-if="hasScapes"
        class="merge-preview__placeholder"
      >
        Select at least 2 Scapes to preview
      </div>
      <div
        v-else
        class="merge-preview__placeholder"
      >
        Select Scapes to merge
      </div>
    </div>

    <div
      v-if="hasScapes"
      class="merge-preview__scapes"
    >
      <div
        v-for="(scape, index) in scapes"
        :key="String(scape[0])"
        class="merge-preview__scape"
      >
        <ScapeImage :id="scape[0]" />
        <div class="merge-preview__controls">
          <button
            type="button"
            class="merge-preview__btn"
            :class="{ active: scape[1] }"
            title="Flip horizontal"
            @click="emit('toggleFlipX', index)"
          >
            H
          </button>
          <button
            type="button"
            class="merge-preview__btn merge-preview__btn--remove"
            title="Remove"
            @click="emit('remove', index)"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MergePart } from '~/utils/merges'

const props = defineProps<{
  scapes: MergePart[]
  previewUrl: string | null
  isLoading: boolean
  error: Error | null
}>()

const emit = defineEmits<{
  toggleFlipX: [index: number]
  remove: [index: number]
}>()

const hasScapes = computed(() => props.scapes.length > 0)
const hasPreview = computed(() => props.scapes.length >= 2)
</script>

<style scoped>
.merge-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}

.merge-preview__canvas {
  aspect-ratio: 1;
  background: var(--gray-z-1);
  border-radius: var(--spacer-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.merge-preview__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.merge-preview__placeholder,
.merge-preview__loading {
  color: var(--muted);
  font-size: var(--font-sm);
  text-align: center;
  padding: var(--spacer);
}

.merge-preview__error {
  color: var(--error);
  font-size: var(--font-sm);
  text-align: center;
  padding: var(--spacer);
}

.merge-preview__scapes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--spacer-xs);
}

.merge-preview__scape {
  position: relative;
}

.merge-preview__scape img {
  border-radius: var(--spacer-xs);
}

.merge-preview__controls {
  position: absolute;
  bottom: var(--spacer-xs);
  left: var(--spacer-xs);
  right: var(--spacer-xs);
  display: flex;
  gap: 2px;
  justify-content: center;
}

.merge-preview__btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: var(--background);
  color: var(--color);
  font-size: var(--font-xs);
  cursor: pointer;
  opacity: 0.8;
}

.merge-preview__btn:hover {
  opacity: 1;
}

.merge-preview__btn.active {
  background: var(--color);
  color: var(--background);
}

.merge-preview__btn--remove {
  background: var(--error);
  color: white;
}
</style>
