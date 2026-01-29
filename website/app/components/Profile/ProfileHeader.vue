<template>
  <section class="profile-header">
    <div v-if="resolvedHeader" class="profile-header__banner">
      <img :src="resolvedHeader" alt="Profile header" />
      <Button v-if="onRefresh" class="profile-header__refresh" :disabled="isRefreshing"
        :title="isRefreshing ? 'Refreshing...' : 'Refresh from ENS'" @click="handleRefresh">
        <Icon type="lucide:refresh-cw" />
      </Button>
    </div>

    <div class="profile-header__content">
      <div class="profile-header__avatar">
        <AccountAvatar :address="address as `0x${string}`" />
      </div>

      <div class="profile-header__meta">
        <h1>{{ displayName }}</h1>
        <a :href="etherscanUrl" target="_blank" class="profile-header__address">{{ shortenAddress(address) }}</a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  address: string;
  ens: string | null;
  avatar: string | null;
  header: string | null;
  onRefresh?: () => Promise<void>;
}>();

const { resolveIpfsUrl } = useIpfs();

const displayName = computed(() => props.ens || props.address);
const resolvedHeader = computed(() => resolveIpfsUrl(props.header));
const etherscanUrl = computed(() => `https://etherscan.io/address/${props.address}`);

const isRefreshing = ref(false);
const handleRefresh = async () => {
  if (!props.onRefresh) return;
  isRefreshing.value = true;
  try {
    await props.onRefresh();
  } finally {
    isRefreshing.value = false;
  }
};
</script>

<style scoped>
.profile-header {
  position: relative;
  display: grid;
  gap: var(--grid-gutter);
}

.profile-header__refresh {
  position: absolute;
  bottom: 0;
  right: 0;
  min-width: calc(var(--scape-height) / 2 - var(--grid-gutter));
  min-height: calc(var(--scape-height) / 2 - var(--grid-gutter));
  width: calc(var(--scape-height) / 2 - var(--grid-gutter));
  height: calc(var(--scape-height) / 2 - var(--grid-gutter));
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  z-index: 1;
  box-shadow: none;
}

.profile-header__refresh:hover {
  background: var(--gray-z-1);
}

.profile-header__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.profile-header__refresh-icon--spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.profile-header__banner {
  width: 100%;
  height: calc(var(--content-columns) * var(--scape-height-gutter) - var(--grid-gutter));
  background: var(--gray-z-1);
  position: relative;
}

.profile-header__banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.profile-header__content {
  display: flex;
  gap: var(--spacer);
  align-items: center;
  padding: var(--spacer);
  height: calc(2 * var(--scape-height-gutter) - var(--grid-gutter));
  background: var(--background);
  position: relative;
}

.profile-header__avatar {
  width: var(--size-9);
  height: var(--size-9);
  border-radius: 50%;
  overflow: hidden;
  background: var(--gray-z-1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-header__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-header__avatar-fallback {
  font-size: var(--font-xl);
}

.profile-header__meta h1 {
  margin: 0 0 var(--spacer-xs);
}

.profile-header__address {
  font-size: var(--font-xs);
  color: var(--muted);
  line-height: 1;
  text-decoration: none;
}

.profile-header__address:hover {
  text-decoration: underline;
}
</style>
