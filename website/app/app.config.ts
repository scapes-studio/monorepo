export default defineAppConfig({
  base: {
    name: 'Scapes App',
  },
  evm: {
    title: 'Scapes',
    defaultChain: 'mainnet',
    chains: {
      mainnet: {
        id: 1,
        blockExplorer: 'https://etherscan.io',
      },
    },
    ens: {
      mode: 'indexer',
      indexer1: 'https://indexer.scapes.xyz/profiles',
    },
    ipfsGateway: 'https://ipfs.io/ipfs/',
    arweaveGateway: 'https://arweave.net/',
  },
})
