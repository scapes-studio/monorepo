import { Gapless5 } from "@regosen/gapless-5";
import {
  FADE_INTERVAL,
  FADE_INCREMENT,
  SCAPE_DURATION,
  SONG_DURATION,
  getAudioUrl,
  getCoverUrl,
  type ScapeInfo,
  createScapeInfo,
} from "./radio";

class Scape {
  private player: Gapless5;
  readonly id: number;

  constructor(id: number) {
    this.id = id;
    // Use HTML5 Audio mode for MediaSession API compatibility
    // See: https://github.com/regosen/Gapless-5/issues/22
    this.player = new Gapless5({
      loop: true,
      volume: 0,
      useWebAudio: false,
      useHTML5Audio: true,
    });
    this.player.addTrack(getAudioUrl(id));
  }

  get info(): ScapeInfo {
    return createScapeInfo(this.id);
  }

  get mediaArtwork(): MediaImage[] {
    return [
      {
        src: getCoverUrl(this.id),
        sizes: "512x512",
        type: "image/png",
      },
    ];
  }

  play(): void {
    this.player.play();
  }

  stop(): void {
    this.player.pause();
  }

  getPosition(): number {
    return this.player.getPosition();
  }

  setPosition(ms: number): void {
    this.player.setPosition(ms);
  }

  setVolume(volume: number): void {
    this.player.setVolume(volume);
  }

  syncTo(other: Scape): void {
    this.setPosition(other.getPosition() % 125);
  }

  fadeIn(basedOnScape?: Scape): Promise<void> {
    // Ensure volume starts at 0 before fading in
    this.setVolume(0);
    this.play();
    if (basedOnScape) {
      this.syncTo(basedOnScape);
    }

    let volume = 0;
    return new Promise((resolve) => {
      const fade = () => {
        volume = Math.min(volume + FADE_INCREMENT, 1);
        this.setVolume(volume);
        if (volume >= 1) {
          resolve();
          return;
        }
        setTimeout(fade, FADE_INTERVAL);
      };
      fade();
    });
  }

  fadeOut(interval = FADE_INTERVAL): Promise<void> {
    let volume = 1;
    return new Promise((resolve) => {
      const fade = () => {
        volume = Math.max(volume - FADE_INCREMENT, 0);
        this.setVolume(volume);
        if (volume <= 0) {
          this.stop();
          resolve();
          return;
        }
        setTimeout(fade, interval);
      };
      fade();
    });
  }

  destroy(): void {
    this.player.removeAllTracks();
  }
}

export type RadioStateCallback = (state: {
  isPlaying?: boolean;
  currentScape?: ScapeInfo | null;
  progress?: number;
}) => void;

export class RadioPlayer {
  private previousScape: Scape | null = null;
  private currentScape: Scape | null = null;
  private nextScape: Scape | null = null;
  private hasMediaSession = false;
  private wakeLock: WakeLockSentinel | null = null;
  private autoSkipTimeout: ReturnType<typeof setTimeout> | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  isPlaying = false;
  onStateChange?: RadioStateCallback;
  getNextScapeId?: () => number;

  setup(prevId: number | null, currId: number, nextId: number): void {
    this.destroy();

    if (prevId !== null) {
      this.previousScape = new Scape(prevId);
    }
    this.currentScape = new Scape(currId);
    this.nextScape = new Scape(nextId);
    this.hasMediaSession = "mediaSession" in navigator;

    this.notifyStateChange({
      currentScape: this.currentScape.info,
    });
  }

  private notifyStateChange(state: Parameters<RadioStateCallback>[0]): void {
    this.onStateChange?.(state);
  }

  private setupMediaSession(): void {
    if (!this.hasMediaSession || !this.currentScape) return;

    navigator.mediaSession.playbackState = "playing";
    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.currentScape.info.title,
      artist: "Ben Cronin",
      album: "Scape.Radio",
      artwork: this.currentScape.mediaArtwork,
    });

    navigator.mediaSession.setActionHandler("play", () => this.start());
    navigator.mediaSession.setActionHandler("pause", () => this.stop());
    navigator.mediaSession.setActionHandler("nexttrack", () => this.next());
    navigator.mediaSession.setActionHandler("previoustrack", () => this.restartOrPrevious());
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined && this.currentScape) {
        this.currentScape.setPosition(details.seekTime * 1000);
        this.updateMediaSessionPosition();
      }
    });

    this.updateMediaSessionPosition();
  }

  private updateMediaSessionPosition(): void {
    if (!this.hasMediaSession || !this.currentScape) return;
    if (!("setPositionState" in navigator.mediaSession)) return;

    const positionMs = this.currentScape.getPosition();
    const positionSec = Math.max(0, positionMs / 1000);
    const durationSec = SONG_DURATION / 1000;

    try {
      navigator.mediaSession.setPositionState({
        duration: durationSec,
        playbackRate: 1.0,
        position: Math.min(positionSec, durationSec),
      });
    } catch {
      // Some browsers may throw if position > duration
    }
  }

  private async requestWakeLock(): Promise<void> {
    if (!("wakeLock" in navigator)) return;

    try {
      this.wakeLock = await navigator.wakeLock.request("screen");
    } catch {
      // Device may refuse wake lock (low battery, etc.)
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  private startProgressTracking(): void {
    this.stopProgressTracking();
    let updateCounter = 0;
    this.progressInterval = setInterval(() => {
      if (!this.currentScape) return;
      const position = this.currentScape.getPosition();
      const progress = Math.min((position / SCAPE_DURATION) * 100, 100);
      this.notifyStateChange({ progress });

      // Update media session position every second (every 10 intervals)
      updateCounter++;
      if (updateCounter >= 10) {
        updateCounter = 0;
        this.updateMediaSessionPosition();
      }
    }, 100);
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private scheduleAutoSkip(): void {
    this.cancelAutoSkip();
    this.autoSkipTimeout = setTimeout(() => {
      this.next();
    }, SCAPE_DURATION);
  }

  private cancelAutoSkip(): void {
    if (this.autoSkipTimeout) {
      clearTimeout(this.autoSkipTimeout);
      this.autoSkipTimeout = null;
    }
  }

  async start(): Promise<void> {
    if (!this.currentScape) return;

    this.isPlaying = true;
    this.notifyStateChange({ isPlaying: true });
    this.setupMediaSession();
    await this.requestWakeLock();
    await this.currentScape.fadeIn();
    this.startProgressTracking();
    this.scheduleAutoSkip();
  }

  async stop(duration = 150): Promise<void> {
    if (!this.currentScape) return;

    this.isPlaying = false;
    this.cancelAutoSkip();
    this.stopProgressTracking();
    this.notifyStateChange({ isPlaying: false });

    const fadeInterval = duration / 20;
    await this.currentScape.fadeOut(fadeInterval);
    await this.releaseWakeLock();

    if (this.hasMediaSession) {
      navigator.mediaSession.playbackState = "paused";
    }
  }

  async toggle(): Promise<void> {
    if (this.isPlaying) {
      await this.stop();
    } else {
      await this.start();
    }
  }

  next(): void {
    if (!this.currentScape || !this.nextScape) return;

    this.cancelAutoSkip();
    this.currentScape.fadeOut();
    this.nextScape.fadeIn(this.currentScape);

    // Rotate scapes
    this.previousScape?.destroy();
    this.previousScape = this.currentScape;
    this.currentScape = this.nextScape;

    // Queue next scape
    const nextId = this.getNextScapeId?.() ?? Math.floor(Math.random() * 10000) + 1;
    this.nextScape = new Scape(nextId);

    // Update state
    this.notifyStateChange({
      currentScape: this.currentScape.info,
      progress: 0,
    });
    this.setupMediaSession();
    this.scheduleAutoSkip();
  }

  queueNext(id: number): void {
    this.nextScape?.destroy();
    this.nextScape = new Scape(id);
  }

  restartOrPrevious(): void {
    if (!this.currentScape) return;

    // If more than 3 seconds in, restart current track
    if (this.currentScape.getPosition() > 3000) {
      this.currentScape.setPosition(0);
      this.notifyStateChange({ progress: 0 });
      this.updateMediaSessionPosition();
      return;
    }

    // Otherwise go to previous if available
    if (this.previousScape) {
      this.cancelAutoSkip();
      this.currentScape.fadeOut();
      this.previousScape.fadeIn(this.currentScape);

      // Rotate scapes backwards
      this.nextScape?.destroy();
      this.nextScape = this.currentScape;
      this.currentScape = this.previousScape;
      this.previousScape = null;

      this.notifyStateChange({
        currentScape: this.currentScape.info,
        progress: 0,
      });
      this.setupMediaSession();
      this.scheduleAutoSkip();
    } else {
      // No previous, just restart
      this.currentScape.setPosition(0);
      this.notifyStateChange({ progress: 0 });
      this.updateMediaSessionPosition();
    }
  }

  switchToScape(id: number): void {
    if (!this.currentScape) {
      this.setup(null, id, id);
      return;
    }

    if (this.currentScape.id === id) return;

    this.cancelAutoSkip();

    // Create new scape and crossfade
    const newScape = new Scape(id);

    if (this.isPlaying) {
      this.currentScape.fadeOut();
      newScape.fadeIn(this.currentScape);
    }

    this.previousScape?.destroy();
    this.previousScape = this.currentScape;
    this.currentScape = newScape;
    this.nextScape?.destroy();
    this.nextScape = new Scape(id); // In fixed mode, next is same scape

    this.notifyStateChange({
      currentScape: this.currentScape.info,
      progress: 0,
    });
    this.setupMediaSession();
    // No auto-skip in fixed mode
  }

  resumeRandomMode(nextId: number): void {
    if (!this.currentScape) return;

    // Queue a random next and resume auto-skip
    this.queueNext(nextId);
    if (this.isPlaying) {
      this.scheduleAutoSkip();
    }
  }

  getCurrentScape(): ScapeInfo | null {
    return this.currentScape?.info ?? null;
  }

  destroy(): void {
    this.cancelAutoSkip();
    this.stopProgressTracking();
    this.releaseWakeLock();
    this.previousScape?.destroy();
    this.currentScape?.destroy();
    this.nextScape?.destroy();
    this.previousScape = null;
    this.currentScape = null;
    this.nextScape = null;
  }
}
