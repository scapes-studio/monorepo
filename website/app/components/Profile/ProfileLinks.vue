<template>
  <section v-if="activeLinks.length" class="profile-links">
    <ul class="profile-links__list">
      <li v-for="{ key, value } in activeLinks" :key="key">
        <NuxtLink :to="buildUrl(key, value)" rel="noopener noreferrer" target="_blank">
          {{ labelMap[key] }}
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { ProfileLinks as Links } from "~/composables/useProfile";

const props = defineProps<{ links: Links | null | undefined }>();

const activeLinks = computed(() => props.links
  ? (Object.entries(props.links) as [keyof Links, string | undefined][])
    .filter((entry): entry is [keyof Links, string] => !!entry[1])
    .map(([key, value]) => ({ key, value }))
  : []
);

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

<style scoped>
.profile-links__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
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
