import type { RadioPlayer } from '~/utils/RadioPlayer'
import { randomScape, type ScapeInfo } from '~/utils/radio'
import { mergeIdToScapeIds } from '~/utils/merges'

export type RadioMode = 'random' | 'fixed'

interface RadioState {
  isPlaying: boolean
  isLoading: boolean
  currentScape: ScapeInfo | null
  mode: RadioMode
  fixedScapeId: number | null
  fixedScapeIds: number[]
  fixedNextIndex: number
  progress: number
  isExpanded: boolean
  hasStarted: boolean
  volume: number
}

// Module-level state - persists across all component instances and page navigation
const state = reactive<RadioState>({
  isPlaying: false,
  isLoading: false,
  currentScape: null,
  mode: 'random',
  fixedScapeId: null,
  fixedScapeIds: [],
  fixedNextIndex: 0,
  progress: 0,
  isExpanded: false,
  hasStarted: false,
  volume: 1,
})

// Single RadioPlayer instance (lazy initialized on first play)
let player: RadioPlayer | null = null

const initializePlayer = async (): Promise<RadioPlayer> => {
  if (player) return player

  // Dynamic import to avoid SSR issues with Gapless5
  const { RadioPlayer } = await import('~/utils/RadioPlayer')
  player = new RadioPlayer()

  player.onStateChange = (update) => {
    if (update.isPlaying !== undefined) {
      state.isPlaying = update.isPlaying
      state.isLoading = false
    }
    if (update.currentScape !== undefined) {
      state.currentScape = update.currentScape
    }
    if (update.progress !== undefined) {
      state.progress = update.progress
    }
  }

  player.getNextScapeId = () => {
    if (state.mode === 'fixed') {
      // Merge: cycle through component scapes
      if (state.fixedScapeIds.length > 1) {
        const id =
          state.fixedScapeIds[
            state.fixedNextIndex % state.fixedScapeIds.length
          ]!
        state.fixedNextIndex++
        return id
      }
      // Single fixed scape: repeat
      if (state.fixedScapeId !== null) {
        return state.fixedScapeId
      }
    }
    return randomScape()
  }

  return player
}

export const useScapeRadio = () => {
  // Computed refs for read-only access
  const isPlaying = computed(() => state.isPlaying)
  const isLoading = computed(() => state.isLoading)
  const currentScape = computed(() => state.currentScape)
  const mode = computed(() => state.mode)
  const progress = computed(() => state.progress)
  const isExpanded = computed(() => state.isExpanded)
  const hasStarted = computed(() => state.hasStarted)

  const play = async (): Promise<void> => {
    if (state.isPlaying) return

    state.isLoading = true
    const radioPlayer = await initializePlayer()

    // Initialize if not already setup
    if (!radioPlayer.getCurrentScape()) {
      let currentId: number
      let nextId: number

      if (state.mode === 'fixed' && state.fixedScapeIds.length > 1) {
        // Merge: start with first component, queue second
        currentId = state.fixedScapeIds[0]!
        nextId = state.fixedScapeIds[1]!
        state.fixedNextIndex = 2
      } else if (state.mode === 'fixed' && state.fixedScapeId !== null) {
        currentId = state.fixedScapeId
        nextId = state.fixedScapeId
      } else {
        currentId = randomScape()
        nextId = randomScape()
      }

      radioPlayer.setup(null, currentId, nextId)
    }

    state.hasStarted = true
    await radioPlayer.start()
  }

  const pause = async (): Promise<void> => {
    if (!state.isPlaying || !player) return
    await player.stop()
  }

  const toggle = async (): Promise<void> => {
    if (state.isPlaying) {
      await pause()
    } else {
      await play()
    }
  }

  const skip = (): void => {
    if (!player) return
    // Allow skip for merges (multiple components) but not single fixed scape
    if (state.mode === 'fixed' && state.fixedScapeIds.length <= 1) return
    player.next()
  }

  const setFixedScape = (scapeId: number): void => {
    state.mode = 'fixed'

    if (scapeId > 10000) {
      // Merge: decode into component scape IDs
      const componentIds = mergeIdToScapeIds(BigInt(scapeId)).map(Number)
      state.fixedScapeIds = componentIds
      state.fixedNextIndex = 1
      state.fixedScapeId = componentIds[0]!

      if (player && player.getCurrentScape()) {
        player.switchToScape(state.fixedScapeId, { autoSkip: true })
      }
    } else {
      state.fixedScapeIds = [scapeId]
      state.fixedNextIndex = 0
      state.fixedScapeId = scapeId

      if (player && player.getCurrentScape()) {
        player.switchToScape(scapeId)
      }
    }
  }

  const clearFixedScape = (): void => {
    if (state.mode !== 'fixed') return

    state.mode = 'random'
    state.fixedScapeId = null
    state.fixedScapeIds = []
    state.fixedNextIndex = 0

    if (player && player.getCurrentScape()) {
      player.resumeRandomMode(randomScape())
    }
  }

  const expand = (): void => {
    state.isExpanded = true
  }

  const collapse = (): void => {
    state.isExpanded = false
  }

  const toggleExpanded = (): void => {
    state.isExpanded = !state.isExpanded
  }

  const setVolume = (vol: number): void => {
    state.volume = Math.max(0, Math.min(1, vol))
    player?.setVolume(state.volume)
  }

  const volume = computed(() => state.volume)

  return {
    // State
    isPlaying,
    isLoading,
    currentScape,
    mode,
    progress,
    isExpanded,
    hasStarted,
    volume,
    // Actions
    play,
    pause,
    toggle,
    skip,
    setFixedScape,
    clearFixedScape,
    expand,
    collapse,
    toggleExpanded,
    setVolume,
  }
}
