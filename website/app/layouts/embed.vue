<template>
  <slot />
</template>

<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'embed-ready',
  },
})
</script>

<style>
body.embed-ready {
  background: #000;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100dvh;
  opacity: 1;
}
</style>
