export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const baseURL = runtimeConfig.public.apiUrl.replace(/\/$/, '')

  const api = $fetch.create({
    baseURL,
  })

  return {
    provide: {
      api,
    },
  }
})
