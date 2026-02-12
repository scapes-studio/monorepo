let ponderClient: ReturnType<typeof createClient> | null = null

export const usePonderClient = () => {
  const runtimeConfig = useRuntimeConfig()

  if (!ponderClient) {
    ponderClient = createClient(`${runtimeConfig.public.apiUrl}/sql`, {
      schema,
    })
  }

  return ponderClient
}
