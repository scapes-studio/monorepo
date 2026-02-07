<template>
  <div style="
    width: 1200px;
    height: 1200px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div v-if="image">
      <img :src="image" :style="{
        display: 'flex',
        width: `${imgWidth}px`,
        height: `${imgHeight}px`,
      }" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  subtitle: string;
  image?: string | null;
  scapeCount?: number;
}>();

const count = props.scapeCount ?? 1;
const ratio = 3 * count;
const maxW = 960;
const maxH = 144;
const imgWidth = Math.min(maxW, maxH * ratio);
const imgHeight = Math.round(imgWidth / ratio);
</script>
