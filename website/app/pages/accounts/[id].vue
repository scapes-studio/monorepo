<script setup lang="ts">
const route = useRoute();

const accountId = computed(() => route.params.id as string | undefined);

const { profile, pending: profilePending, error: profileError } = useProfile(accountId);

const profileData = computed(() => profile.value?.data ?? null);
const resolvedAddress = computed(() => profile.value?.address ?? null);

const {
  scapes,
  total: scapesTotal,
  loading: scapesLoading,
  error: scapesError,
  hasMore,
  loadMore,
} = useScapesByOwner(resolvedAddress);

const displayAddress = computed(() => profile.value?.address ?? accountId.value ?? "");
const scapesOwnedCount = computed(() => scapesTotal.value ?? scapes.value.length);
</script>

<template>
  <section class="account-page">
    <div v-if="profilePending" class="account-page__status">Loading profile…</div>
    <div v-else-if="profileError" class="account-page__status account-page__status--error">
      Unable to load profile. Please check the address or ENS name.
    </div>

    <div v-else class="account-page__profile">
      <ProfileHeader :address="displayAddress" :ens="profile?.ens ?? null" :avatar="profileData?.avatar ?? null" />
      <ProfileBio :description="profileData?.description ?? null" />
      <ProfileLinks :links="profileData?.links ?? null" />
    </div>

    <section class="account-page__scapes">
      <header class="account-page__section-title">
        <h2>Scapes</h2>
        <span>{{ scapesOwnedCount }} owned</span>
      </header>

      <div v-if="scapesError" class="account-page__status account-page__status--error">
        Failed to load scapes.
      </div>
      <div v-else-if="scapesLoading && scapes.length === 0" class="account-page__status">
        Loading scapes…
      </div>
      <div v-else-if="scapes.length === 0" class="account-page__status">
        No scapes found for this account.
      </div>

      <ScapesGrid v-else :scapes="scapes" />

      <button v-if="hasMore" class="account-page__load-more" type="button" :disabled="scapesLoading" @click="loadMore">
        {{ scapesLoading ? "Loading…" : "Load more" }}
      </button>
    </section>
  </section>
</template>

<style scoped>
.account-page {
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.account-page__profile {
  display: grid;
  gap: var(--spacer);
}

.account-page__scapes {
  display: grid;
  gap: var(--spacer);
}

.account-page__section-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.account-page__section-title h2 {
  margin: 0;
}

.account-page__status {
  padding: var(--spacer);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
}

.account-page__status--error {
  background: rgba(255, 0, 0, 0.08);
}

.account-page__load-more {
  justify-self: center;
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: white;
  cursor: pointer;
}

.account-page__load-more:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
