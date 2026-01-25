<script setup lang="ts">
const props = defineProps<{
  address: string;
  ens: string | null;
  avatar: string | null;
  header: string | null;
}>();

const { resolveIpfsUrl } = useIpfs();

const displayName = computed(() => props.ens || props.address);
const resolvedAvatar = computed(() => resolveIpfsUrl(props.avatar));
const resolvedHeader = computed(() => resolveIpfsUrl(props.header));
</script>

<template>
  <section class="profile-header">
    <div v-if="resolvedHeader" class="profile-header__banner">
      <img :src="resolvedHeader" alt="Profile header" />
    </div>

    <div class="profile-header__content">
      <div class="profile-header__avatar">
        <img v-if="resolvedAvatar" :src="resolvedAvatar" alt="Profile avatar" />
        <div v-else class="profile-header__avatar-fallback">
          {{ displayName.slice(0, 2).toUpperCase() }}
        </div>
      </div>

      <div class="profile-header__meta">
        <h1>{{ displayName }}</h1>
        <p class="profile-header__address">{{ address }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-header {
  height: calc((2 + var(--content-columns)) * var(--scape-height-gutter) - var(--grid-gutter));
  background: var(--background);
}

.profile-header__banner {
  width: 100%;
  height: calc(var(--content-columns) * var(--scape-height-gutter) - var(--grid-gutter));
  background: var(--gray-z-1);
}

.profile-header__banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-header__content {
  display: flex;
  gap: var(--spacer);
  align-items: center;
  padding: var(--spacer);
  height: calc(2 * var(--scape-height-gutter) - var(--grid-gutter));
  background: var(--background);
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
  margin: 0;
  font-size: var(--font-xs);
  color: var(--muted);
  word-break: break-all;
  line-height: 1;
}
</style>
