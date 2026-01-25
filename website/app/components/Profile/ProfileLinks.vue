<script setup lang="ts">
import type { ProfileLinks as Links } from "~/composables/useProfile";

const props = defineProps<{ links: Links | null | undefined }>();

const linkCount = computed(() => props.links
  ? Object.values(props.links).filter(l => !!l)?.length
  : 0
)

const labelMap: Record<keyof Links, string> = {
  url: "Website",
  email: "Email",
  twitter: "X",
  github: "GitHub",
};

const urlPrefixMap: Partial<Record<keyof Links, string>> = {
  email: "mailto:",
  twitter: "https://x.com/",
  github: "https://github.com/",
};

function buildUrl(key: keyof Links, value: string): string {
  const prefix = urlPrefixMap[key];
  if (!prefix) return value;
  const cleanValue = key === "twitter" ? value.replace(/^@/, "") : value;
  return prefix + cleanValue;
}
</script>

<template>
  <section v-if="linkCount" class="profile-links">
    <ul class="profile-links__list">
      <li v-for="(value, key) in links" :key="key">
        <template v-if="value">
          <NuxtLink :to="buildUrl(key, value)" rel="noopener noreferrer" target="_blank">
            {{ labelMap[key] }}
          </NuxtLink>
        </template>
        <span v-else class="profile-links__empty">{{ labelMap[key] }}: none</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.profile-links__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: var(--grid-gutter);
}

.profile-links__list li a {
  display: flex;
  width: var(--scape-width);
  height: var(--scape-height);
  align-items: center;
  justify-content: center;

  &:hover,
  &:focus {
    background: var(--gray-z-1);
  }
}
</style>
