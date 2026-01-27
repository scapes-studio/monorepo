<template>
  <Dialog v-model:open="open" title="Scape Entertainment System" class="ses-modal large">
    <div class="ses-modal__iframe-wrapper">
      <iframe v-if="open" :src="animationUrl" class="ses-modal__iframe" allow="autoplay" frameborder="0" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  tokenId: string;
}>();

const open = defineModel<boolean>("open", { required: true });

const MERGE_TOKEN_ID_START = 10001;
const SES_APP_URL = "https://dev-scapes.scapes.xyz/ses";

const isMerge = computed(() => {
  const id = Number(props.tokenId);
  return !isNaN(id) && id >= MERGE_TOKEN_ID_START;
});

const animationUrl = computed(() => {
  if (isMerge.value) {
    return `${SES_APP_URL}/?merge=${props.tokenId}`;
  }
  return `${SES_APP_URL}/#${props.tokenId}`;
});
</script>

<style>
.ses-modal__iframe-wrapper {
  margin: calc(-1 * var(--spacer));
  width: calc(100% + var(--spacer) * 2);
}

.ses-modal__iframe {
  width: 100%;
  aspect-ratio: 4 / 3;
  border: none;
  display: block;
}
</style>
