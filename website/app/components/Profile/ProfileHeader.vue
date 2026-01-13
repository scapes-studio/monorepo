<script setup lang="ts">
const props = defineProps<{ address: string; ens: string | null; avatar: string | null }>();

const displayName = computed(() => props.ens || props.address);
</script>

<template>
  <section class="profile-header">
    <div class="profile-header__avatar">
      <img v-if="avatar" :src="avatar" alt="Profile avatar" />
      <div v-else class="profile-header__avatar-fallback">
        {{ displayName.slice(0, 2).toUpperCase() }}
      </div>
    </div>

    <div class="profile-header__meta">
      <h1>{{ displayName }}</h1>
      <p class="profile-header__address">{{ address }}</p>
    </div>
  </section>
</template>

<style scoped>
.profile-header {
  display: flex;
  gap: var(--spacer);
  align-items: center;
  padding: var(--spacer);
  border: var(--border);
  border-radius: var(--spacer);
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
  font-weight: var(--font-weight-bold);
}

.profile-header__meta h1 {
  margin: 0 0 var(--spacer-xs);
}

.profile-header__address {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--muted);
  word-break: break-all;
}
</style>
