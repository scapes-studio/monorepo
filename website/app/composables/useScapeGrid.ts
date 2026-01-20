import { useCssVar, useWindowSize } from '@vueuse/core'
import { computed, watchEffect } from 'vue'

const MIN_SCAPE_WIDTH = 144
const MIN_SCAPE_WIDTH_MOBILE = 144
const BREAKPOINT_SM = MIN_SCAPE_WIDTH * 4
const BREAKPOINT_LG = MIN_SCAPE_WIDTH * 8

const COLUMNS = {
  SM: {
    DETAIL: {
      EVEN: 2,
      ODD: 1.5,
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
      EVEN: 4,
      ODD: 5,
    },
  },
  LG: {
    DETAIL: {
      EVEN: 2,
      ODD: 3,
    },
    CONTENT: {
      EVEN: 4,
      ODD: 5,
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
  const marginOffsetVar = useCssVar('--grid-margin-offset')

  const minScapeWidth = computed(() =>
    windowWidth.value < BREAKPOINT_SM ? MIN_SCAPE_WIDTH_MOBILE : MIN_SCAPE_WIDTH
  )

  const columns = computed(() => {
    return Math.max(1, Math.floor((windowWidth.value - 2) / (minScapeWidth.value + 2)))
  })

  const isEven = computed(() => columns.value % 2 === 0)

  const breakpoint = computed(() => {
    if (windowWidth.value < BREAKPOINT_SM) return 'SM'
    if (windowWidth.value < BREAKPOINT_LG) return 'MD'
    return 'LG'
  })

  const contentColumns = computed(() => {
    const config = COLUMNS[breakpoint.value].CONTENT
    const max = isEven.value ? config.EVEN : config.ODD
    return Math.min(columns.value, max)
  })

  const detailColumns = computed(() => {
    const config = COLUMNS[breakpoint.value].DETAIL
    const max = isEven.value ? config.EVEN : config.ODD
    return Math.min(columns.value, max)
  })

  const scapeWidth = computed(() => {
    const n = columns.value
    const raw = (windowWidth.value * 72) / (73 * n + 1)
    const rounded = Math.floor(raw / 72) * 72
    return Math.max(minScapeWidth.value, rounded)
  })

  const gutter = computed(() => scapeWidth.value / 72)
  const scapeHeight = computed(() => scapeWidth.value / 3)
  const rowHeight = computed(() => Math.round(scapeHeight.value + gutter.value))

  const gridWidth = computed(() => {
    const n = columns.value
    return n * scapeWidth.value + (n + 1) * gutter.value
  })

  const marginOffset = computed(() => (windowWidth.value - gridWidth.value) / 2)

  watchEffect(() => {
    scapeWidthVar.value = `${scapeWidth.value}px`
    scapeHeightVar.value = `${scapeHeight.value}px`
    gridGutterVar.value = `${gutter.value}px`
    gridColumnsVar.value = `${columns.value}`
    contentColumnsVar.value = `${contentColumns.value}`
    detailColumnsVar.value = `${detailColumns.value}`
    marginOffsetVar.value = `${marginOffset.value}px`
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
    marginOffset,
  }
}
