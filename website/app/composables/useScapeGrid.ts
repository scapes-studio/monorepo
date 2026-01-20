import { useCssVar, useWindowSize } from '@vueuse/core'
import { computed, watchEffect } from 'vue'

const MIN_SCAPE_WIDTH = 144

export function useScapeGrid() {
  const { width: windowWidth } = useWindowSize()

  const scapeWidthVar = useCssVar('--scape-width')
  const scapeHeightVar = useCssVar('--scape-height')
  const gridGutterVar = useCssVar('--grid-gutter')
  const gridColumnsVar = useCssVar('--grid-columns')

  const columns = computed(() => {
    return Math.max(1, Math.floor((windowWidth.value - 2) / 146))
  })

  const scapeWidth = computed(() => {
    const n = columns.value
    return (windowWidth.value * 72) / (73 * n + 1)
  })

  const gutter = computed(() => scapeWidth.value / 72)
  const scapeHeight = computed(() => scapeWidth.value / 3)

  watchEffect(() => {
    scapeWidthVar.value = `${scapeWidth.value}px`
    scapeHeightVar.value = `${scapeHeight.value}px`
    gridGutterVar.value = `${gutter.value}px`
    gridColumnsVar.value = `${columns.value}`
  })

  return {
    columns,
    scapeWidth,
    scapeHeight,
    gutter,
  }
}
