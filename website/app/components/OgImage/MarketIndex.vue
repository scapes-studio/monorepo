<template>
  <div style="
      width: 1200px;
      height: 600px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 64px;
      font-family: Inter, ui-sans-serif, system-ui;
    ">
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="font-size: 60px; font-weight: 700; color: #111111;">
        {{ title }}
      </div>
      <div style="font-size: 28px; color: #555555;">
        {{ subtitle }}
      </div>
    </div>
    <div style="display: flex; justify-content: flex-end;">
      <img v-if="image" :src="image" style="
          width: 300px;
          height: 300px;
          object-fit: cover;
          border-radius: 18px;
          border: 2px solid #111111;
        " width="300px" height="300px" />
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
