<template>
  <div style="
      width: 1200px;
      height: 600px;
      background: #ffffff;
      display: flex;
      align-items: center;
      gap: 48px;
      padding: 64px;
      font-family: Inter, ui-sans-serif, system-ui;
    ">
    <div v-if="image" style="
        width: 220px;
        height: 220px;
        border-radius: 999px;
        border: 4px solid #111111;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f2f2f2;
      ">
      <img :src="image" style="width: 100%; height: 100%; object-fit: cover;" width="220px" height="220px" />
    </div>
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <div style="font-size: 56px; font-weight: 700; color: #111111;">
        {{ title }}
      </div>
      <div style="font-size: 30px; color: #555555;">
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  image?: string | null;
}>();
</script>
