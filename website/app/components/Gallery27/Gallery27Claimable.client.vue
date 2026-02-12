<template>
  <template v-if="showClaimable">
    <header class="gallery27-claimable__header grid-shadow">
      <h2>Claimable</h2>
      <span>{{ claimableScapes.length }} to claim</span>
    </header>
    <Gallery27Grid :scapes="claimableScapes" />
  </template>
  <div
    v-else-if="isOwnProfile && claimablePending"
    class="gallery27-claimable__status"
  >
    Checking for claimable scapes…
  </div>
</template>

<script setup lang="ts">
import { useAccount } from '@wagmi/vue'

const props = defineProps<{
  resolvedAddress: string | null
}>()

const { address: connectedAddress } = useAccount()
const isOwnProfile = computed(
  () =>
    connectedAddress.value?.toLowerCase() ===
    props.resolvedAddress?.toLowerCase(),
)

const claimableOwner = computed(() =>
  isOwnProfile.value ? props.resolvedAddress : null,
)
const { data: claimableData, pending: claimablePending } =
  await useGallery27ClaimableByOwner(claimableOwner)
const claimableScapes = computed(() => claimableData.value?.scapes ?? [])
const showClaimable = computed(
  () => isOwnProfile.value && claimableScapes.value.length > 0,
)
</script>

<style scoped>
.gallery27-claimable__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--scape-height);
  margin: var(--scape-height-gutter) 0 0;
  background: var(--background);
  padding: var(--spacer);

  &:first-of-type {
    margin-top: 0;
  }
}

.gallery27-claimable__header h2 {
  margin: 0;
}

.gallery27-claimable__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}
</style>
