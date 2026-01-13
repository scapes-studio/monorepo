<script setup lang="ts">
import type { ProfileLinks as Links } from "~/composables/useProfile";

defineProps<{ links: Links | null | undefined }>();

const labelMap: Record<keyof Links, string> = {
  url: "Website",
  email: "Email",
  twitter: "𝕏",
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
  <section class="profile-links">
    <h2>Links</h2>
    <ul v-if="links" class="profile-links__list">
      <li v-for="(value, key) in links" :key="key">
        <template v-if="value">
          <span class="profile-links__label">{{ labelMap[key] }}</span>
          <NuxtLink :to="buildUrl(key, value)" rel="noopener noreferrer">
            {{ value }}
          </NuxtLink>
        </template>
        <span v-else class="profile-links__empty">{{ labelMap[key] }}: none</span>
      </li>
    </ul>
    <p v-else class="profile-links__empty">No links available.</p>
  </section>
</template>

<style scoped>
.profile-links {
  padding: var(--spacer);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
}

.profile-links h2 {
  margin-top: 0;
}

.profile-links__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.profile-links__label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.profile-links__empty {
  color: rgba(0, 0, 0, 0.6);
}
</style>
