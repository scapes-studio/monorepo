<script setup lang="ts">
const props = defineProps<{
  address?: `0x${string}`
}>()

const runtimeConfig = useRuntimeConfig()

const asyncKey = computed(() => `avatar-${props.address?.toLowerCase() ?? "unknown"}`)

const { data: profile } = useAsyncData(
  asyncKey,
  async () => {
    if (!props.address) return null
    const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "")
    try {
      return await $fetch<import("~/composables/useProfile").ProfileResponse>(
        `${baseUrl}/profiles/${props.address}`
      )
    } catch {
      return null
    }
  },
)

const avatarSrc = computed(() => profile.value?.data?.avatar || "/scapepe-square.png")
</script>

<template>
  <img class="account-avatar" :src="avatarSrc" alt="Avatar" />
</template>

<style scoped>
.account-avatar {
  width: var(--scape-height);
  height: var(--scape-height);
  object-fit: cover;
}
</style>
