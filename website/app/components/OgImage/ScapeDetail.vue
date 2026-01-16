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
      align-items: center;
      justify-content: space-between;
      padding: 64px;
      font-family: Inter, ui-sans-serif, system-ui;
    "
  >
    <div style="display: flex; flex-direction: column; gap: 16px; max-width: 640px;">
      <div style="font-size: 64px; font-weight: 700; color: #111111;">
        {{ title }}
      </div>
      <div style="font-size: 30px; color: #555555;">
        {{ subtitle }}
      </div>
    </div>
    <div v-if="image" style="display: flex; align-items: center;">
      <img
        :src="image"
        style="
          width: 320px;
          height: 320px;
          object-fit: cover;
          border-radius: 32px;
          border: 2px solid #111111;
        "
      />
    </div>
  </div>
</template>
