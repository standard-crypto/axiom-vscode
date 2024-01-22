export enum CONFIG_KEYS {
  ConfigFilePath = "configFilePath",
  CircuitFilesPattern = "circuitFilesPattern",
  BuildDirectory = "buildDirectory",
  Network = "network",
  ProviderUriGoerli = "PROVIDER_URI_GOERLI",
  PrivateKeyGoerli = "PRIVATE_KEY_GOERLI",
  ProviderUriSepolia = "PROVIDER_URI_SEPOLIA",
  PrivateKeySepolia = "PRIVATE_KEY_SEPOLIA",
  ProviderUriMainnet = "PROVIDER_URI_MAINNET",
  PrivateKeyMainnet = "PRIVATE_KEY_MAINNET",
}

export type NetworkOpts =
  | "Goerli"
  | "Sepolia"
  | "Mainnet";

export const axiomExplorerUrl = 'https://explorer.axiom.xyz/v2';