const SCAPE_SIZE = 14
const PART_SIZE = 16

export type MergePart = [bigint, boolean, boolean] // [tokenId, flipX, flipY]

export function mergeDefinitionToTokenId(parts: MergePart[], isFade: boolean): bigint {
  let mergeId = BigInt(isFade ? 1 : 0)

  parts.forEach((part, i) => {
    const mergePartBytes =
      part[0] | (BigInt(part[1] ? 1 : 0) << 14n) | (BigInt(part[2] ? 1 : 0) << 15n)
    mergeId |= mergePartBytes << (BigInt(PART_SIZE * i) + 1n)
  })

  return mergeId
}

export function mergeIdToScapeIds(id: bigint): bigint[] {
  if (id <= 10_000n) return [id]

  const scapes: bigint[] = []

  let mergeId = id >> 1n
  for (let i = 0; i < 15; i++) {
    const filter =
      (1n << (BigInt(PART_SIZE * i) + BigInt(SCAPE_SIZE))) -
      (1n << BigInt(PART_SIZE * i))
    const offset = PART_SIZE * i
    const tokenId = (mergeId & filter) >> BigInt(offset)
    if (tokenId) {
      scapes.push(tokenId)
    }
  }

  return scapes
}

export function isMergeTokenId(tokenId: bigint): boolean {
  return tokenId > 10_000n
}

export function mergeScapeCount(tokenId: bigint): number {
  if (tokenId <= 10_000n) return 1
  return mergeIdToScapeIds(tokenId).length
}
