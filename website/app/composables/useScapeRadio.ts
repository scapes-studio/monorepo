import type { RadioPlayer } from "~/utils/RadioPlayer";
import { randomScape, type ScapeInfo } from "~/utils/radio";

export type RadioMode = "random" | "fixed";

interface RadioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentScape: ScapeInfo | null;
  mode: RadioMode;
  fixedScapeId: number | null;
  progress: number;
  isExpanded: boolean;
  hasStarted: boolean;
  volume: number;
}

// Module-level state - persists across all component instances and page navigation
const state = reactive<RadioState>({
  isPlaying: false,
  isLoading: false,
  currentScape: null,
  mode: "random",
  fixedScapeId: null,
  progress: 0,
  isExpanded: false,
  hasStarted: false,
  volume: 1,
});

// Single RadioPlayer instance (lazy initialized on first play)
let player: RadioPlayer | null = null;

const initializePlayer = async (): Promise<RadioPlayer> => {
  if (player) return player;

  // Dynamic import to avoid SSR issues with Gapless5
  const { RadioPlayer } = await import("~/utils/RadioPlayer");
  player = new RadioPlayer();

  player.onStateChange = (update) => {
    if (update.isPlaying !== undefined) {
      state.isPlaying = update.isPlaying;
      state.isLoading = false;
    }
    if (update.currentScape !== undefined) {
      state.currentScape = update.currentScape;
    }
    if (update.progress !== undefined) {
      state.progress = update.progress;
    }
  };

  player.getNextScapeId = () => {
    // In fixed mode, return the same scape ID
    if (state.mode === "fixed" && state.fixedScapeId !== null) {
      return state.fixedScapeId;
    }
    return randomScape();
  };

  return player;
};

export const useScapeRadio = () => {
  // Computed refs for read-only access
  const isPlaying = computed(() => state.isPlaying);
  const isLoading = computed(() => state.isLoading);
  const currentScape = computed(() => state.currentScape);
  const mode = computed(() => state.mode);
  const progress = computed(() => state.progress);
  const isExpanded = computed(() => state.isExpanded);
  const hasStarted = computed(() => state.hasStarted);

  const play = async (): Promise<void> => {
    if (state.isPlaying) return;

    state.isLoading = true;
    const radioPlayer = await initializePlayer();

    // Initialize if not already setup
    if (!radioPlayer.getCurrentScape()) {
      const currentId = state.fixedScapeId ?? randomScape();
      const nextId = state.mode === "fixed" && state.fixedScapeId !== null
        ? state.fixedScapeId
        : randomScape();
      radioPlayer.setup(null, currentId, nextId);
    }

    state.hasStarted = true;
    await radioPlayer.start();
  };

  const pause = async (): Promise<void> => {
    if (!state.isPlaying || !player) return;
    await player.stop();
  };

  const toggle = async (): Promise<void> => {
    if (state.isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const skip = (): void => {
    if (!player || state.mode === "fixed") return;
    player.next();
  };

  const setFixedScape = (scapeId: number): void => {
    const previousMode = state.mode;
    state.mode = "fixed";
    state.fixedScapeId = scapeId;

    if (player && player.getCurrentScape()) {
      player.switchToScape(scapeId);
    }
  };

  const clearFixedScape = (): void => {
    if (state.mode !== "fixed") return;

    state.mode = "random";
    state.fixedScapeId = null;

    if (player && player.getCurrentScape()) {
      player.resumeRandomMode(randomScape());
    }
  };

  const expand = (): void => {
    state.isExpanded = true;
  };

  const collapse = (): void => {
    state.isExpanded = false;
  };

  const toggleExpanded = (): void => {
    state.isExpanded = !state.isExpanded;
  };

  const setVolume = (vol: number): void => {
    state.volume = Math.max(0, Math.min(1, vol));
    player?.setVolume(state.volume);
  };

  const volume = computed(() => state.volume);

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
  };
};
