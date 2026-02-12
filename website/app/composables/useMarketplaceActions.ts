import { writeContract } from '@wagmi/core'
import type { Config } from '@wagmi/vue'
import type { Hash } from 'viem'
import { scapesABI } from '@scapes-studio/abis'

const SCAPES_CONTRACT = '0xb7def63a9040ad5dc431aff79045617922f4023a' as const

export const useMarketplaceActions = (scapeId: MaybeRefOrGetter<string>) => {
  const { $wagmi } = useNuxtApp()

  const makeOffer = (price: bigint): Promise<Hash> => {
    return writeContract($wagmi as Config, {
      chainId: 1,
      address: SCAPES_CONTRACT,
      abi: scapesABI,
      functionName: 'makeOffer',
      args: [BigInt(toValue(scapeId)), price],
    })
  }

  const cancelOffer = (): Promise<Hash> => {
    return writeContract($wagmi as Config, {
      chainId: 1,
      address: SCAPES_CONTRACT,
      abi: scapesABI,
      functionName: 'cancelOffer',
      args: [BigInt(toValue(scapeId))],
    })
  }

  const buy = (price: bigint): Promise<Hash> => {
    return writeContract($wagmi as Config, {
      chainId: 1,
      address: SCAPES_CONTRACT,
      abi: scapesABI,
      functionName: 'buy',
      args: [BigInt(toValue(scapeId))],
      value: price,
    })
  }

  const purge = (): Promise<Hash> => {
    return writeContract($wagmi as Config, {
      chainId: 1,
      address: SCAPES_CONTRACT,
      abi: scapesABI,
      functionName: 'purge',
      args: [BigInt(toValue(scapeId))],
    })
  }

  return { makeOffer, cancelOffer, buy, purge }
}
