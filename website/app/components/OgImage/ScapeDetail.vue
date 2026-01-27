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
      <img :src="image" style="
        display: block;
        width: 576px;
        height: 192px;
        object-fit: cover;
      " />
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
