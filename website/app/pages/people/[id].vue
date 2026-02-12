<template>
  <section class="account-page">
    <div
      v-if="profilePending"
      class="account-page__status"
    >
      Loading profile…
    </div>
    <GridArea
      v-else-if="profileError"
      padding
      center
    >
      <p>Unable to load profile. Please check the address or ENS name.</p>
    </GridArea>

    <template v-else>
      <div class="account-page__profile">
        <ProfileHeader
          :address="displayAddress"
          :ens="profile?.ens ?? null"
          :avatar="profileData?.avatar ?? null"
          :header="effectiveHeader"
          :on-refresh="forceRefresh"
        />
        <ProfileBio :description="profileData?.description ?? null" />
        <ProfileLinks :links="profileData?.links ?? null" />
      </div>

      <ProfileTabs
        v-if="showProfileTabs"
        :account-id="accountId ?? ''"
      />

      <NuxtPage />
    </template>
  </section>
</template>

<script setup lang="ts">
import { shortenAddress } from '~/composables/useENSResolution'

const route = useRoute()

const accountId = computed(() => route.params.id as string | undefined)

const {
  data: profile,
  pending: profilePending,
  error: profileError,
  forceRefresh,
} = await useProfile(accountId)

const profileData = computed(() => profile.value?.data ?? null)
const resolvedAddress = computed(() => profile.value?.address ?? null)
const displayAddress = computed(
  () => profile.value?.address ?? accountId.value ?? '',
)

const { bannerImageUrl } = useFeaturedScape(resolvedAddress)
const effectiveHeader = computed(
  () => profileData.value?.header || bannerImageUrl.value || null,
)

const { data: gallery27Data } = await useGallery27ScapesByOwner(resolvedAddress)
const hasGallery27Scapes = computed(
  () => (gallery27Data.value?.scapes?.length ?? 0) > 0,
)
const showProfileTabs = computed(() => hasGallery27Scapes.value)

// Provide profile data to child pages
provide('profile', { profile, resolvedAddress, displayAddress })

// Determine current tab
const currentTab = computed(() => {
  const path = route.path
  if (path.endsWith('/twenty-seven-year-scapes')) return 'gallery27'
  return 'scapes'
})

// Page meta
const seoOptions = computed(() => {
  const ens = profile.value?.ens
  const addr = displayAddress.value
  const displayName = ens || (addr ? shortenAddress(addr) : 'Profile')
  const tabName = currentTab.value === 'gallery27' ? '27 Year Scapes' : 'Scapes'

  return {
    title: `${displayName} - ${tabName}`,
    description:
      profileData.value?.description ||
      `View ${displayName}'s ${tabName} collection on Scapes.`,
    image: null,
    imageAlt: `${displayName}'s profile`,
  }
})
useSeo(seoOptions)
</script>

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
</style>
