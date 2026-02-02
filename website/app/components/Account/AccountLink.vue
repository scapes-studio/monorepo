<template>
  <NuxtLink :to="account.url" class="account-link" :title="account.displayName">
    {{ displayName }}
  </NuxtLink>
</template>

<script setup lang="ts">
import { shortenENS } from "~/composables/useENSResolution";

const props = withDefaults(
  defineProps<{
    address: string;
    shortenEns?: boolean | number;
  }>(),
  { shortenEns: false },
);

const account = useAccountDisplay(() => props.address as `0x${string}`);

const displayName = computed(() => {
  const name = account.value.displayName;
  if (!props.shortenEns || !account.value.ens) return name;

  const maxLength = typeof props.shortenEns === "number" ? props.shortenEns : 40;
  return shortenENS(name, maxLength);
});
</script>

<style scoped>
.account-link {
  color: inherit;
  text-decoration: none;
}

.account-link:hover {
  text-decoration: underline;
}
</style>
