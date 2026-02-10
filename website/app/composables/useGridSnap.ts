import type { ComponentPublicInstance, Ref } from 'vue'

export function useGridSnap(target: Ref<HTMLElement | undefined> | Ref<ComponentPublicInstance | undefined>) {
  const { scapeHeight, gutter } = useScapeGrid()

  const resolveEl = (): HTMLElement | undefined => {
    const val = target.value
    if (!val) return undefined
    if (val instanceof HTMLElement) return val
    return val.$el
  }

  const snap = () => {
    const el = resolveEl()
    if (!el) return

    const unit = scapeHeight.value + gutter.value
    el.style.minHeight = ''
    const naturalHeight = el.offsetHeight
    const rows = Math.max(1, Math.ceil((naturalHeight + gutter.value) / unit))
    el.style.minHeight = `${rows * unit - gutter.value}px`
  }

  watch([scapeHeight, gutter], snap)
  onMounted(snap)
}
