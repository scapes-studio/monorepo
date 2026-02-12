<template>
  <span class="gallery27-countdown">{{ timeLeft }}</span>
</template>

<script setup lang="ts">
const props = defineProps<{
  endTimestamp: number | null
}>()

const emit = defineEmits<{
  ended: []
}>()

const now = useSeconds()
const hasEnded = ref(false)

const diff = computed(() => {
  if (!props.endTimestamp) return 0
  return props.endTimestamp - now.value
})

const { str } = useCountDown(diff)

const timeLeft = computed(() => {
  if (!props.endTimestamp) return ''
  if (diff.value <= 0) return 'Ended'
  return str.value
})

watch(diff, (value) => {
  if (value <= 0 && !hasEnded.value) {
    hasEnded.value = true
    emit('ended')
  }
})
</script>

<style scoped>
.gallery27-countdown {
  font-variant-numeric: tabular-nums;
}
</style>
