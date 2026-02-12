<template>
  <header class="gallery27-header">
    <NuxtLink
      v-if="tokenId > 1"
      :to="`/gallery27/${tokenId - 1}`"
      class="gallery27-header__nav"
    >
      Previous
    </NuxtLink>
    <div class="gallery27-header__title">
      <h1>Day {{ tokenId }}</h1>
      <p v-if="formattedDate">{{ formattedDate }}</p>
    </div>
    <NuxtLink
      v-if="tokenId < 10000"
      :to="`/gallery27/${tokenId + 1}`"
      class="gallery27-header__nav"
    >
      Next
    </NuxtLink>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  tokenId: number
  date: number | null
}>()

const formattedDate = computed(() => {
  if (!props.date) return null
  return new Date(props.date * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<style scoped>
.gallery27-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacer);
}

.gallery27-header__title {
  text-align: center;
}

.gallery27-header__title h1 {
  margin: 0;
}

.gallery27-header__title p {
  margin: 0;
  color: var(--muted);
}

.gallery27-header__nav {
  padding: var(--spacer-sm) var(--spacer);
}
</style>
