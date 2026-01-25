<script setup lang="ts">
import { shortenAddress } from "~/composables/useENSResolution";

const route = useRoute();

const accountId = computed(() => route.params.id as string | undefined);

const { data: profile, pending: profilePending, error: profileError, forceRefresh } = await useProfile(accountId);

const profileData = computed(() => profile.value?.data ?? null);
const resolvedAddress = computed(() => profile.value?.address ?? null);
const displayAddress = computed(() => profile.value?.address ?? accountId.value ?? "");

const isRefreshing = ref(false);
const handleRefresh = async () => {
  isRefreshing.value = true;
  try {
    await forceRefresh();
  } finally {
    isRefreshing.value = false;
  }
};

// Provide profile data to child pages
provide("profile", { profile, resolvedAddress, displayAddress });

// Determine current tab
const currentTab = computed(() => {
  const path = route.path;
  if (path.endsWith("/twenty-seven-year-scapes")) return "gallery27";
  return "scapes";
});

// Page meta
const seoOptions = computed(() => {
  const ens = profile.value?.ens;
  const addr = displayAddress.value;
  const displayName = ens || (addr ? shortenAddress(addr) : 'Profile');
  const tabName = currentTab.value === 'gallery27' ? '27 Year Scapes' : 'Scapes';

  return {
    title: `${displayName} - ${tabName}`,
    description: profileData.value?.description
      || `View ${displayName}'s ${tabName} collection on Scapes.`,
    image: profileData.value?.avatar || undefined,
    imageAlt: `${displayName}'s profile`,
  };
});
useSeo(seoOptions);
</script>

<template>
  <section class="account-page">
    <div v-if="profilePending" class="account-page__status">Loading profile…</div>
    <div v-else-if="profileError" class="account-page__status account-page__status--error">
      Unable to load profile. Please check the address or ENS name.
    </div>

    <template v-else>
      <div class="account-page__profile">
        <ProfileHeader :address="displayAddress" :ens="profile?.ens ?? null" :avatar="profileData?.avatar ?? null"
          :header="profileData?.header ?? null" />
        <ProfileBio :description="profileData?.description ?? null" />
        <ProfileLinks :links="profileData?.links ?? null" />
        <button class="account-page__refresh" :disabled="isRefreshing" @click="handleRefresh">
          {{ isRefreshing ? 'Refreshing...' : 'Refresh from ENS' }}
        </button>
      </div>

      <nav class="account-page__tabs">
        <NuxtLink :to="`/people/${accountId}`" class="account-page__tab"
          :class="{ 'account-page__tab--active': currentTab === 'scapes' }">
          Scapes
        </NuxtLink>
        <NuxtLink :to="`/people/${accountId}/twenty-seven-year-scapes`" class="account-page__tab"
          :class="{ 'account-page__tab--active': currentTab === 'gallery27' }">
          Twenty Seven Year Scapes
        </NuxtLink>
      </nav>

      <NuxtPage />
    </template>
  </section>
</template>

<style scoped>
.account-page {
  max-width: var(--content-width);
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
}

.account-page__profile {
  display: grid;
  gap: var(--grid-gutter);
}

.account-page__tabs {
  display: flex;
  gap: var(--spacer);
}

.account-page__tab {
  text-decoration: none;
  color: var(--muted);
}

.account-page__tab--active {
  color: inherit;
  border-bottom-color: currentColor;
}

.account-page__refresh {
  display: none;
}
</style>
