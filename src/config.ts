export enum CONFIG_KEYS {
  ConfigFilePath = "configFilePath",
  CircuitFilesPattern = "circuitFilesPattern",
  CircuitInputsProvided = "circuitInputsProvided",
  BuildDirectory = "buildDirectory",
  ProviderUriGoerli = "PROVIDER_URI_GOERLI",
  PrivateKeyGoerli = "PRIVATE_KEY_GOERLI",
}

export type CircuitInputsProvidedOpts =
  | "As exported typescript constants"
  | "As separate input files";
