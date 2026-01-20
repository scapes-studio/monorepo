<script setup lang="ts">
import type { ScapeRecord } from '~/composables/useScapesByOwner'
import type { ListingSource } from '~/composables/useListedScapes'

type ScapeWithPrice = ScapeRecord & {
  price?: bigint | null
  source?: ListingSource
}

const props = defineProps<{
  scapes: ScapeWithPrice[]
  hasMore?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const { columns, rowHeight, gutter } = useScapeGrid()

const scapesRef = toRef(props, 'scapes')

const {
  virtualRows,
  totalHeight,
  rowCount,
  getRowItems,
  scrollToTop,
} = useVirtualGrid({
  items: scapesRef,
  columns,
  rowHeight,
  overscan: 5,
})

// Trigger load more when near the bottom
watch(virtualRows, (rows) => {
  if (!props.hasMore || props.loading || rows.length === 0) return

  const lastVisibleRow = rows[rows.length - 1]
  if (lastVisibleRow && lastVisibleRow.index >= rowCount.value - 3) {
    emit('loadMore')
  }
}, { immediate: true })

// Reset scroll position when scapes array is replaced (filter/sort change)
const previousLength = ref(props.scapes.length)
watch(() => props.scapes, (newScapes, oldScapes) => {
  // If scapes were replaced (not appended), scroll to top
  if (oldScapes && newScapes.length < previousLength.value) {
    scrollToTop()
  }
  previousLength.value = newScapes.length
})

defineExpose({ scrollToTop })
</script>

<template>
  <div class="scapes-virtual-grid" :style="{ height: `${totalHeight}px` }">
    <div
      v-for="virtualRow in virtualRows"
      :key="virtualRow.index"
      class="scapes-virtual-grid__row"
      :style="{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }"
    >
      <ScapesGridRow :items="getRowItems(virtualRow.index)" />
    </div>
  </div>
  <div v-if="loading && scapes.length > 0" class="scapes-virtual-grid__loading">
    Loading more...
  </div>
</template>

<style scoped>
.scapes-virtual-grid {
  position: relative;
  width: 100%;
  padding-top: v-bind('`${gutter}px`');
}

.scapes-virtual-grid__row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.scapes-virtual-grid__loading {
  text-align: center;
  padding: var(--spacer);
  color: var(--muted);
}
</style>
