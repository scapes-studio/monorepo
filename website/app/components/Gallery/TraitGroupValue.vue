<template>
  <li
    class="trait-value"
    :class="{
      'trait-value--selected': selected,
      'trait-value--loading': loading,
    }"
    @click="emit('toggle')"
  >
    <div class="trait-value__icon">
      <img
        :src="iconUrl"
        :alt="value"
      />
    </div>
    <span class="trait-value__label">
      <span>
        {{ value }}
      </span>

      <Icon
        v-if="selected"
        type="check"
      />
    </span>
    <span class="trait-value__count">{{ count }}</span>
  </li>
</template>

<script setup lang="ts">
import { getTraitIconUrl } from '~/data/traits'

const props = defineProps<{
  category: string
  value: string
  count: number
  selected: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const iconUrl = computed(() => getTraitIconUrl(props.category, props.value))
</script>

<style scoped>
.trait-value {
  display: grid;
  grid-template-columns: 2rem 1fr auto auto;
  gap: var(--spacer-sm);
  align-items: center;
  padding: var(--spacer-sm) var(--spacer);
  cursor: pointer;
  transition: background 0.15s ease;
}

.trait-value:hover {
  background: var(--gray-z-1);
}

.trait-value--selected {
  background: var(--gray-z-2);
}

.trait-value--loading {
  opacity: 0.7;
}

.trait-value__icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--size-0);
  overflow: hidden;
}

.trait-value__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  border: var(--border);
  background: var(--color);
}

.trait-value__label {
  font-size: var(--font-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: var(--spacer);
}

.trait-value__count {
  font-size: var(--font-xs);
  color: var(--muted);
}

.trait-value__check {
  width: 1rem;
  text-align: center;
  font-size: var(--font-sm);
  color: var(--color);
}
</style>
