<script setup lang="ts">
const props = defineProps<{
  endTimestamp: number | null;
}>();

const emit = defineEmits<{
  ended: [];
}>();

const timeLeft = ref("");
const hasEnded = ref(false);

const updateCountdown = () => {
  if (!props.endTimestamp) {
    timeLeft.value = "";
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const diff = props.endTimestamp - now;

  if (diff <= 0) {
    timeLeft.value = "Ended";
    if (!hasEnded.value) {
      hasEnded.value = true;
      emit("ended");
    }
    return;
  }

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (days > 0) {
    timeLeft.value = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    timeLeft.value = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    timeLeft.value = `${minutes}m ${seconds}s`;
  } else {
    timeLeft.value = `${seconds}s`;
  }
};

let interval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  updateCountdown();
  interval = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});

watch(() => props.endTimestamp, updateCountdown);
</script>

<template>
  <span class="gallery27-countdown">{{ timeLeft }}</span>
</template>

<style scoped>
.gallery27-countdown {
  font-variant-numeric: tabular-nums;
}
</style>
