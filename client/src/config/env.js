// Environment configuration for Greenfield
export const GRPC_URL =
    import.meta.env.VITE_GRPC_URL ||
    "https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org";
export const GREENFIELD_RPC_URL =
    import.meta.env.VITE_GREENFIELD_RPC_URL ||
    "https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org";
export const GREEN_CHAIN_ID =
    parseInt(import.meta.env.VITE_GREEN_CHAIN_ID) || 5600;
export const BSC_RPC_URL =
    import.meta.env.VITE_BSC_RPC_URL ||
    "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
export const BSC_CHAIN_ID = parseInt(import.meta.env.VITE_BSC_CHAIN_ID) || 97;
