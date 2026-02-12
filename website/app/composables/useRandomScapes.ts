function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const result = [...array]
  let currentSeed = seed

  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

export function useRandomScapes() {
  // SSR-friendly random seed using useState
  const seed = useState('scapes-seed', () => Math.random())

  // Generate shuffled scape objects using seeded random (Fisher-Yates)
  const scapes = computed(() => {
    const ids = Array.from({ length: 10000 }, (_, i) => ({ id: BigInt(i + 1) }))
    return shuffleWithSeed(ids, seed.value)
  })

  return { scapes }
}
