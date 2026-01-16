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
    <div style="display: flex; flex-direction: column; gap: 16px; max-width: 520px;">
      <div style="font-size: 56px; font-weight: 700; color: #111111;">
        {{ title }}
      </div>
      <div style="font-size: 28px; color: #555555;">
        {{ subtitle }}
      </div>
    </div>
    <div v-if="image" style="display: flex; align-items: center;">
      <img
        :src="image"
        style="
          width: 360px;
          height: 360px;
          object-fit: cover;
          border-radius: 20px;
          border: 2px solid #111111;
        "
      />
    </div>
  </div>
</template>
