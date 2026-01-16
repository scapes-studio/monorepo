<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  image?: string | null;
}>();
</script>

<template>
  <div
    style="
      width: 1200px;
      height: 600px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 64px;
      font-family: Inter, ui-sans-serif, system-ui;
    "
  >
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="font-size: 54px; font-weight: 700; color: #111111;">
        {{ title }}
      </div>
      <div style="font-size: 28px; color: #555555;">
        {{ subtitle }}
      </div>
    </div>
    <div v-if="image" style="display: flex; justify-content: flex-start;">
      <img
        :src="image"
        style="
          width: 360px;
          height: 240px;
          object-fit: cover;
          border-radius: 24px;
          border: 2px solid #111111;
        "
      />
    </div>
  </div>
</template>
