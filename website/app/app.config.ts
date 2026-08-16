export default defineAppConfig({
  base: {
    name: 'Scapes App',
  },
  evm: {
    title: 'Scapes',
    appLogoUrl: '/icon.png',
    defaultChain: 'mainnet',
    chains: {
      mainnet: {
        id: 1,
        blockExplorer: 'https://etherscan.io',
      },
    },
    ens: {
      mode: 'indexer',
    },
    ipfsGateway: 'https://ipfs.io/ipfs/',
    arweaveGateway: 'https://arweave.net/',
  },
})
