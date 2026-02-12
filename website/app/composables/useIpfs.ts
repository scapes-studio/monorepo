export const useIpfs = () => {
  const config = useRuntimeConfig()
  const gateway = config.public.ipfsGateway

  const resolveIpfsUrl = (url: string | null | undefined): string | null => {
    if (!url) return null

    if (url.startsWith('ipfs://')) {
      const cid = url.slice(7)
      return `${gateway}${cid}`
    }

    return url
  }

  return { resolveIpfsUrl }
}
