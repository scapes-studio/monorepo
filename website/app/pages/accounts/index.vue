<script setup lang="ts">
import { sql } from "@ponder/client";

type OwnerEntry = {
  owner: string;
  count: number;
};

type OwnerRow = {
  owner: string;
  count: number | string;
};

const client = usePonderClient();

const { data, pending, error } = useAsyncData("scape-owners-leaderboard", async () => {
  const result = await client.db.execute(sql`
    SELECT owner, COUNT(*)::int AS count
    FROM scape
    GROUP BY owner
    ORDER BY count DESC, owner ASC
  `);

  const rows = (result as { rows?: OwnerRow[] }).rows ?? (result as OwnerRow[]);
  return rows.map((row) => ({
    owner: row.owner,
    count: Number(row.count ?? 0),
  }));
});

const owners = computed<OwnerEntry[]>(() => data.value ?? []);
const totalOwners = computed(() => owners.value.length);
const totalScapes = computed(() => owners.value.reduce((sum, entry) => sum + entry.count, 0));
</script>

<template>
  <section class="accounts-page">
    <header class="accounts-page__header">
      <div>
        <h1>Scape Owners</h1>
        <p class="accounts-page__subtitle">Leaderboard by total scapes owned.</p>
      </div>
      <div class="accounts-page__stats">
        <span>{{ totalOwners }} owners</span>
        <span>{{ totalScapes }} total scapes</span>
      </div>
    </header>

    <div v-if="pending" class="accounts-page__status">Loading owners…</div>
    <div v-else-if="error" class="accounts-page__status accounts-page__status--error">
      Unable to load scape owners right now.
    </div>
    <div v-else-if="owners.length === 0" class="accounts-page__status">No owners found.</div>

    <ol v-else class="accounts-page__list">
      <li v-for="(entry, index) in owners" :key="entry.owner" class="accounts-page__row">
        <span class="accounts-page__rank">{{ index + 1 }}</span>
        <NuxtLink class="accounts-page__owner" :to="`/accounts/${entry.owner}`">
          {{ entry.owner }}
        </NuxtLink>
        <span class="accounts-page__count">{{ entry.count }} scapes</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.accounts-page {
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.accounts-page__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  justify-content: space-between;
  align-items: center;
}

.accounts-page__header h1 {
  margin: 0 0 0.35rem;
}

.accounts-page__subtitle {
  margin: 0;
  color: rgba(0, 0, 0, 0.6);
}

.accounts-page__stats {
  display: flex;
  gap: var(--spacer);
  font-weight: 600;
}

.accounts-page__status {
  padding: var(--spacer);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
}

.accounts-page__status--error {
  background: rgba(255, 0, 0, 0.08);
}

.accounts-page__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.accounts-page__row {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  gap: var(--spacer);
  align-items: center;
  padding: var(--spacer);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.accounts-page__rank {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
}

.accounts-page__owner {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  word-break: break-all;
}

.accounts-page__owner:hover {
  text-decoration: underline;
}

.accounts-page__count {
  font-weight: 600;
}
</style>
