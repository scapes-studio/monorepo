<script setup lang="ts">
const props = defineProps<{
  address: string;
}>();

const account = useAccountDisplay(() => props.address as `0x${string}`);
</script>

<template>
  <NuxtLink :to="account.url" class="account-link">
    {{ account.displayName }}
  </NuxtLink>
</template>

<style scoped>
.account-link {
  color: inherit;
  text-decoration: none;
  font-weight: var(--font-weight-bold);
}

.account-link:hover {
  text-decoration: underline;
}
</style>
