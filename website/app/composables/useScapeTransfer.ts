import { writeContract } from '@wagmi/vue/actions'
import type { Config } from '@wagmi/vue'
import type { Address, Hash } from 'viem'
import { erc721ABI } from '@scapes-studio/abis'

const SCAPES_CONTRACT = '0xb7def63a9040ad5dc431aff79045617922f4023a' as const

export const useScapeTransfer = (
  scapeId: MaybeRefOrGetter<string>,
  owner: MaybeRefOrGetter<Address>,
) => {
  const { $wagmi } = useNuxtApp()

  const transfer = (recipient: Address): Promise<Hash> => {
    return writeContract($wagmi as Config, {
      chainId: 1,
      address: SCAPES_CONTRACT,
      abi: erc721ABI,
      functionName: 'safeTransferFrom',
      args: [toValue(owner), recipient, BigInt(toValue(scapeId))],
    })
  }

  return { transfer }
}
