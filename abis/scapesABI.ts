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
] as const;
