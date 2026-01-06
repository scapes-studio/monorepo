import { createConfig } from "ponder";
import { erc721ABI } from "./abis/erc721ABI";
import { marketplaceABI } from "./abis/marketplaceABI";

export default createConfig({
  chains: {
    ethereum: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
      ws: process.env.PONDER_RPC_URL_1_WS,
    },
  },
  contracts: {
    PunkScapes: {
      chain: "ethereum",
      abi: erc721ABI,
      address: "0x51Ae5e2533854495f6c587865Af64119db8F59b4",
      startBlock: 13290314,
      endBlock: 16229345, // End of `Scapes` Airdrop
    },
    Scapes: {
      chain: "ethereum",
      abi: [...erc721ABI, ...marketplaceABI],
      address: "0xb7def63A9040ad5dC431afF79045617922f4023A",
      startBlock: 16228031,
    },
  },
});
