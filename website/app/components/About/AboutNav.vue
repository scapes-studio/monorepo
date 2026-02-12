<template>
  <nav
    v-if="hasLinks"
    class="about-nav"
  >
    <template
      v-for="(link, i) in links"
      :key="i"
    >
      <NuxtLink
        v-if="link"
        :to="link.to"
        class="about-nav__link"
        :class="{ 'about-nav__link--end': link.align === 'right' }"
      >
        <span
          v-if="link.label"
          class="about-nav__label muted"
          >{{ link.label }}</span
        >
        <span class="about-nav__title">{{ link.title }}</span>
        <span
          v-if="link.description"
          class="about-nav__description muted"
          >{{ link.description }}</span
        >
      </NuxtLink>
      <div v-else />
    </template>
  </nav>
</template>

<script setup lang="ts">
export interface AboutNavLink {
  to: string
  title: string
  label?: string
  description?: string
  align?: 'left' | 'right'
}

const props = defineProps<{
  links: (AboutNavLink | null)[]
}>()

const hasLinks = computed(() => props.links.some(Boolean))
</script>

<style scoped>
.about-nav {
  display: grid;
  gap: var(--grid-gutter);
  grid-template-columns: 1fr;
}

@media (min-width: 576px) {
  .about-nav {
    grid-template-columns: 1fr 1fr;
  }
}

.about-nav__link {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: calc(var(--scape-height) * 2 + var(--grid-gutter));
  padding: var(--spacer-lg);
  background: var(--background);
  text-decoration: none;
  transition: background var(--speed);
  box-shadow: var(--grid-shadow);
}

.about-nav__link:hover {
  background: var(--gray-z-1);
}

.about-nav__link--end {
  text-align: right;
}

.about-nav__title {
  font-weight: 700;
}

.about-nav__label,
.about-nav__description {
  font-size: var(--font-sm);
}
</style>
