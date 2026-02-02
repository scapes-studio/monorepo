<template>
  <div class="scape-animated-image" :class="{ 'scape-animated-image--play': play }">
    <ScapeImage :id="id" :scape-count="scapeCount" @loaded="handleScapeLoaded" />
    <div v-if="play" class="scape-animated-image__iframe">
      <iframe :src="embedUrl" frameborder="0"></iframe>
    </div>
  </div>
  <Button v-if="scapeImageLoaded && !play" @click="startPlay" class="small">
    <IconPlay />
  </Button>
  <Button v-if="play" @click="stopPlay" class="small">
    <IconPause />
  </Button>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
  id: {
    type: [String, Number, BigInt] as PropType<string | number | bigint>,
    required: true,
  },
  scapeCount: {
    type: Number,
    default: 1,
  },
});

const play = ref(false);
const scapeImageLoaded = ref(false);
const embedUrl = computed(
  () =>
    `https://embed.scapes.xyz/?simple&autoplay&chapter-switch=false&sound-control=false#${props.id}`,
);

const handleScapeLoaded = () => {
  scapeImageLoaded.value = true;
};

const startPlay = () => {
  if (!scapeImageLoaded.value) return;
  play.value = true;
};

const stopPlay = () => {
  play.value = false;
};

watch(
  () => props.id,
  () => {
    play.value = false;
    scapeImageLoaded.value = false;
  },
);
</script>

<style scoped>
.scape-animated-image {
  position: relative;
  width: 100%;
  display: grid;
  place-items: center;
  container-type: inline-size;
}

.scape-animated-image__iframe,
.scape-animated-image__iframe iframe {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.scape-animated-image__iframe {
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: var(--border-radius-sm);
  transition: opacity var(--speed-slow);
  z-index: 5;
}

.scape-animated-image__iframe iframe {
  border: 0;
}

button.small {
  position: absolute;
  right: var(--grid-gutter);
  top: var(--grid-gutter);
  right: 0;
  top: 0;
  /* bottom: calc(100% + var(--grid-gutter)); */
  width: calc(var(--scape-height) / 2);
  height: calc(var(--scape-height) / 2);
  /* width: calc(100cqw / 3 / 5); */
  /* height: calc(100cqw / 3 / 5); */
  padding: 0;
  box-shadow: none;
  background: var(--gray-z-1);

  &>svg {
    width: calc(var(--scape-height) / 4);
    height: calc(var(--scape-height) / 4);
    color: var(--gray-z-5);
    --border-color: var(--gray-z-5);
    /* width: calc(100cqw / 3 / 7); */
    /* height: calc(100cqw / 3 / 7); */
  }
}

.scape-animated-image--play .scape-animated-image__iframe {
  opacity: 1;
  pointer-events: auto;
}
</style>
