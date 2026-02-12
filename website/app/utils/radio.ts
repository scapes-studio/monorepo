// Radio utilities for random scape selection and audio URLs

export const SONG_DURATION = 64000 // 64 seconds per scape song
export const FADE_DURATION = 2000 // 2 second crossfade
export const SCAPE_DURATION = SONG_DURATION - FADE_DURATION // 62 seconds play duration

const FADE_STEPS = 20
export const FADE_INTERVAL = FADE_DURATION / FADE_STEPS
export const FADE_INCREMENT = 1 / FADE_STEPS

export const MIN_SCAPE_ID = 1
export const MAX_SCAPE_ID = 10000

export const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

export const randomScape = (): number =>
  randomBetween(MIN_SCAPE_ID, MAX_SCAPE_ID)

// Formula for synchronized live radio (same scape plays for all users at same time)
export const liveRadioScape = (): number =>
  Math.floor(
    ((Math.floor(Date.now() / 1000 / 64) * 444444443) % MAX_SCAPE_ID) + 1,
  )

export const nextLiveRadioScape = (): number =>
  Math.floor(
    ((Math.floor((Date.now() / 1000 + 64) / 64) * 444444443) % MAX_SCAPE_ID) +
      1,
  )

export const getAudioUrl = (id: number): string =>
  `https://nyc3.digitaloceanspaces.com/punkscapes/radio/composite/${id}.mp3`

export const getCoverUrl = (id: number): string =>
  `https://nyc3.digitaloceanspaces.com/punkscapes/radio/covers/${id}.png`

export interface ScapeInfo {
  id: number
  title: string
  coverUrl: string
  audioUrl: string
}

export const createScapeInfo = (id: number): ScapeInfo => ({
  id,
  title: `Scape #${id}`,
  coverUrl: getCoverUrl(id),
  audioUrl: getAudioUrl(id),
})
