<template>
  <nav class="main-menu border-drop">
    <div class="main-menu__brand border">
      <NuxtLink to="/">
        <img src="/icon.png" alt="Scapes Logo" />
      </NuxtLink>
    </div>

    <NavIndicator class="main-menu__nav">
      <slot name="nav">
        <li>
          <NuxtLink to="/scapes">Scapes</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/people">Owners</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/activity">Activity</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/gallery27">Gallery27</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/merge">Merge</NuxtLink>
        </li>
      </slot>
    </NavIndicator>

    <div class="main-menu__actions">
      <ScapeRadio />
      <EvmConnect class-name="main-menu__actions-connect">
        <template #default>
          <AccountAvatar />
        </template>
        <template #connected="{ address }">
          <NuxtLink :to="getAccountDisplay(address).url" class="border">
            <AccountAvatar :address="address" />
          </NuxtLink>
        </template>
      </EvmConnect>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { getAccountDisplay } = useENSResolution()
</script>

<style scoped>
.main-menu {
  --offset-min: max(calc(var(--grid-margin-offset) / 2 + var(--grid-gutter)), calc(var(--scape-height)/2));
  --main-menu-size: min(3.5rem, var(--scape-height));

  @media (min-width: 680px) {
    --main-menu-size: var(--scape-height);
  }


  position: fixed;
  bottom: max(var(--offset-min), env(safe-area-inset-bottom));
  left: max(var(--offset-min), env(safe-area-inset-left));
  right: max(var(--offset-min), env(safe-area-inset-right));
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--grid-gutter);
  height: var(--main-menu-size);
  padding: 0;
  background: var(--color-background, #fff);
  display: none;
  opacity: 0;
}

.main-menu__brand {
  flex-shrink: 0;
  width: var(--main-menu-size);
  height: var(--main-menu-size);
}

.main-menu__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--grid-gutter);

  &:deep(.account-avatar) {
    width: var(--main-menu-size);
    height: var(--main-menu-size);
  }

  &:deep(.main-menu__actions-connect) {
    padding: 0 !important;
    width: var(--main-menu-size);
    height: var(--main-menu-size);
  }
}

.main-menu__brand a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.main-menu__brand img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.scape-radio-inline {
  display: none;

  @media (min-width: 680px) {
    display: block;
  }
}
</style>
