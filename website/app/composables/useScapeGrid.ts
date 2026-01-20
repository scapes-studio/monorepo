import { useCssVar, useWindowSize } from '@vueuse/core'
import { computed, watchEffect } from 'vue'

const MIN_SCAPE_WIDTH = 144
const MIN_SCAPE_WIDTH_MOBILE = 120
const BREAKPOINT_SM = 480
const BREAKPOINT_LG = 720

const COLUMNS = {
  SM: {
    DETAIL: {
      EVEN: 2,
      ODD: 3,
    },
    CONTENT: {
      EVEN: 4,
      ODD: 3,
    },
  },
  MD: {
    DETAIL: {
      EVEN: 2,
      ODD: 3,
    },
    CONTENT: {
      EVEN: 6,
      ODD: 5,
    },
  },
  LG: {
    DETAIL: {
      EVEN: 2,
      ODD: 3,
    },
    CONTENT: {
      EVEN: 10,
      ODD: 11,
    },
  },
}

export function useScapeGrid() {
  const { width: windowWidth } = useWindowSize()

  const scapeWidthVar = useCssVar('--scape-width')
  const scapeHeightVar = useCssVar('--scape-height')
  const gridGutterVar = useCssVar('--grid-gutter')
  const gridColumnsVar = useCssVar('--grid-columns')
  const contentColumnsVar = useCssVar('--content-columns')
  const detailColumnsVar = useCssVar('--detail-columns')

  const minScapeWidth = computed(() =>
    windowWidth.value < BREAKPOINT_SM ? MIN_SCAPE_WIDTH_MOBILE : MIN_SCAPE_WIDTH
  )

  const columns = computed(() => {
    return Math.max(1, Math.floor((windowWidth.value - 2) / (minScapeWidth.value + 2)))
  })

  const isEven = computed(() => columns.value % 2 === 0)
  const contentColumns = computed(() => Math.min(columns.value, isEven.value ? 6 : 5))
  const detailColumns = computed(() => Math.min(columns.value, isEven.value ? 2 : 3))

  const scapeWidth = computed(() => {
    const n = columns.value
    return (windowWidth.value * 72) / (73 * n + 1)
  })

  const gutter = computed(() => scapeWidth.value / 72)
  const scapeHeight = computed(() => scapeWidth.value / 3)
  const rowHeight = computed(() => scapeHeight.value + gutter.value)

  watchEffect(() => {
    scapeWidthVar.value = `${scapeWidth.value}px`
    scapeHeightVar.value = `${scapeHeight.value}px`
    gridGutterVar.value = `${gutter.value}px`
    gridColumnsVar.value = `${columns.value}`
    contentColumnsVar.value = `${contentColumns.value}`
    detailColumnsVar.value = `${detailColumns.value}`
  })

  return {
    columns,
    scapeWidth,
    scapeHeight,
    gutter,
    rowHeight,
    isEven,
    contentColumns,
    detailColumns,
  }
}
