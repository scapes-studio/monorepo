export type Collection = 'scapes' | 'punkscapes' | 'twenty-seven-year-scapes'
export type ActivityType = 'transfer' | 'sale' | 'listing'

export type ActivityFilters = {
  transfers: boolean
  sales: boolean
  listings: boolean
}

type BaseActivity = {
  id: string
  type: ActivityType
  timestamp: number
  collection: Collection
  tokenId: string
  txHash: string | null
}

export type TransferActivity = BaseActivity & {
  type: 'transfer'
  from: `0x${string}`
  to: `0x${string}`
}

export type SaleActivity = BaseActivity & {
  type: 'sale'
  seller: `0x${string}`
  buyer: `0x${string}`
  price: { wei: string; eth: number }
  source: 'onchain' | 'seaport'
}

export type ListingActivity = BaseActivity & {
  type: 'listing'
  lister: `0x${string}`
  price: { wei: string; eth: number }
  isActive: boolean
}

export type ActivityItem = TransferActivity | SaleActivity | ListingActivity

export type ActivityResponse = {
  data: ActivityItem[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
