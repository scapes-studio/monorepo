import { useWindowVirtualizer } from '@tanstack/vue-virtual'
import { computed, watch, type Ref } from 'vue'

export interface VirtualGridOptions<T> {
  items: Ref<T[]>
  columns: Ref<number>
  rowHeight: Ref<number>
  overscan?: number
}

export function useVirtualGrid<T>(options: VirtualGridOptions<T>) {
  const { items, columns, rowHeight, overscan = 5 } = options

  const rowCount = computed(() => Math.ceil(items.value.length / columns.value))

  const virtualizer = useWindowVirtualizer(
    computed(() => ({
      count: rowCount.value,
      estimateSize: () => rowHeight.value,
      overscan,
    })),
  )

  // Re-measure when columns or row height changes
  watch([columns, rowHeight], () => {
    virtualizer.value.measure()
  })

  const virtualRows = computed(() => virtualizer.value.getVirtualItems())
  const totalHeight = computed(() => virtualizer.value.getTotalSize())

  const getRowItems = (rowIndex: number): T[] => {
    const start = rowIndex * columns.value
    const end = start + columns.value
    return items.value.slice(start, end)
  }

  const scrollToTop = () => {
    virtualizer.value.scrollToIndex(0)
  }

  return {
    virtualizer,
    virtualRows,
    totalHeight,
    rowCount,
    getRowItems,
    scrollToTop,
  }
}
