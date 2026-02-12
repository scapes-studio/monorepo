<template>
  <div
    class="scapes-virtual-grid"
    :style="{ height: `${totalHeight + gutter}px` }"
  >
    <div
      v-for="virtualRow in virtualRows"
      :key="virtualRow.index"
      class="scapes-virtual-grid__row"
      :style="{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }"
    >
      <ScapesGridRow
        :items="getRowItems(virtualRow.index)"
        :show-prices="showPrices"
      />
    </div>
  </div>
  <div
    v-if="loading && scapes.length > 0"
    class="scapes-virtual-grid__loading"
  >
    Loading more...
  </div>
</template>

<script setup lang="ts">
import type { ScapeRecord } from '~/composables/useScapesByOwner'
import type { ListingSource } from '~/types/listings'

type ScapeWithPrice = ScapeRecord & {
  price?: bigint | null
  source?: ListingSource
}

const props = defineProps<{
  scapes: ScapeWithPrice[]
  hasMore?: boolean
  loading?: boolean
  columns?: number
  showPrices?: boolean
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const { columns, rowHeight, gutter, scapeHeight } = useScapeGrid()
const columnCount = computed(() => props.columns ?? columns.value)
const rowHeightWithPrices = computed(() =>
  props.showPrices ? scapeHeight.value * 2 + gutter.value * 2 : rowHeight.value,
)

const scapesRef = toRef(props, 'scapes')

const { virtualRows, totalHeight, rowCount, getRowItems, scrollToTop } =
  useVirtualGrid({
    items: scapesRef,
    columns: columnCount,
    rowHeight: rowHeightWithPrices,
    overscan: 20,
  })

// Trigger load more when near the bottom
watch(
  virtualRows,
  (rows) => {
    if (!props.hasMore || props.loading || rows.length === 0) return

    const lastVisibleRow = rows[rows.length - 1]
    if (lastVisibleRow && lastVisibleRow.index >= rowCount.value - 3) {
      emit('loadMore')
    }
  },
  { immediate: true },
)

// Reset scroll position when scapes array is replaced (filter/sort change)
const previousLength = ref(props.scapes.length)
watch(
  () => props.scapes,
  (newScapes, oldScapes) => {
    // If scapes were replaced (not appended), scroll to top
    if (oldScapes && newScapes.length < previousLength.value) {
      scrollToTop()
    }
    previousLength.value = newScapes.length
  },
)

defineExpose({ scrollToTop })
</script>

<style scoped>
.scapes-virtual-grid {
  position: relative;
  width: 100%;
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
