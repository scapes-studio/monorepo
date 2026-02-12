<template>
  <div
    style="
      width: 1200px;
      height: 630px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      font-family: 'Space Mono', monospace;
      align-items: center;
      font-style: italic;
      text-transform: uppercase;
    "
  >
    <!-- Scape grid -->
    <div
      style="
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 32px 32px 0;
        overflow: hidden;
        align-content: center;
        justify-content: center;
      "
    >
      <img
        v-for="id in scapeIds"
        :key="id"
        :src="`https://cdn.scapes.xyz/scapes/lg/${id}.png`"
        :style="{
          width: `${tileWidth}px`,
          height: `${Math.round(tileWidth / 3)}px`,
          objectFit: 'cover',
          borderRadius: '2px',
        }"
      />
    </div>

    <!-- Profile bar -->
    <div
      style="
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 32px 32px 80px;
      "
    >
      <img
        v-if="image"
        :src="image"
        style="
          width: 48px;
          height: 48px;
          border-radius: 999px;
          object-fit: cover;
          border: 2px solid #e5e5e5;
        "
        width="48"
        height="48"
      />
      <div
        v-else
        style="
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: #e5e5e5;
        "
      />
      <div
        style="
          font-size: 24px;
          font-weight: 700;
          color: #111111;
          font-style: italic;
          height: 28px;
        "
      >
        {{ title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  image?: string | null
  scapeIds?: number[]
  count?: number
}>()

const cols = 6
const gap = 4
const padding = 32
const contentWidth = 1200 - padding * 2
const tileWidth = Math.floor((contentWidth - (cols - 1) * gap) / cols)
</script>
