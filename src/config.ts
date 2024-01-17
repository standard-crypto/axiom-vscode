export enum CONFIG_KEYS {
  ProviderURI = "providerURI",
  PrivateKey = "privateKey",
  CircuitFilesPattern = "circuitFilesPattern",
  CircuitInputsProvided = "circuitInputsProvided",
  BuildDirectory = "buildDirectory",
}

export type CircuitInputsProvidedOpts =
  | "As exported typescript constants"
  | "As separate input files";
