export const scapesABI = [
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "mergeTokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "merge",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "tokenId", internalType: "uint256", type: "uint256" },
      { name: "base64_", internalType: "bool", type: "bool" },
      { name: "scale", internalType: "uint256", type: "uint256" },
    ],
    name: "getScapeImage",
    outputs: [{ name: "", internalType: "string", type: "string" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "tokenId", internalType: "uint256", type: "uint256" },
      { name: "price", internalType: "uint80", type: "uint80" },
    ],
    name: "makeOffer",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "tokenId", internalType: "uint256", type: "uint256" },
      { name: "price", internalType: "uint80", type: "uint80" },
      { name: "to", internalType: "address", type: "address" },
    ],
    name: "makeOfferTo",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "cancelOffer",
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "buy",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "getOffer",
    outputs: [
      {
        name: "offer",
        internalType: "struct ScapesMarketplaceStorage.Offer",
        type: "tuple",
        components: [
          { name: "price", internalType: "uint80", type: "uint80" },
          { name: "specificBuyerPrice", internalType: "uint80", type: "uint80" },
          { name: "lastPrice", internalType: "uint80", type: "uint80" },
          { name: "specificBuyer", internalType: "address", type: "address" },
        ],
      },
    ],
  },
] as const;
