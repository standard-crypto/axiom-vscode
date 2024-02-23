# Axiom-VScode

A VS code extension designed for [Axiom](https://www.axiom.xyz/). You can use this extension to compile a circuit and prove & send queries.

## Features

Axiom-VScode offers a user-friendly view for managing your Axiom circuit and its queries. 

### Managing Circuits

Circuits are loaded from a specified location using a customizable glob pattern in the [extension settings](#extension-settings). The circuit name is extracted from the circuit file.

#### Compile a Circuit

Compilation requires that the `defaultInputs` be exported from the circuit file. 

The output will be written to the directory set in the [extension settings](#extension-settings).

<img src="https://github.com/standard-crypto/axiom-vscode/blob/5bced67af7342c8ba9f242a306618411a5116d0a/media/compileCircuitExample.gif" width="500" />

### Managing Queries

Queries are managed by Axiom-VScode and saved to the VS code workspace state. 

#### Add a query
<img src="https://github.com/standard-crypto/axiom-vscode/blob/5bced67af7342c8ba9f242a306618411a5116d0a/media/addQueryExample.gif" width="500" />

#### Proving queries

You must compile the circuit and set the query input file before proving.

You must also set `PROVIDER_URI_SEPOLIA` in the config file defined in the [extension settings](#extension-settings).

<img src="https://github.com/standard-crypto/axiom-vscode/blob/5bced67af7342c8ba9f242a306618411a5116d0a/media/proveQueryExample.gif" width="500" />

#### Sending queries

You must set the callback address before sending.

You must also set `PRIVATE_KEY_SEPOLIA` in the config file defined in the [extension settings](#extension-settings).

<img src="https://github.com/standard-crypto/axiom-vscode/blob/5bced67af7342c8ba9f242a306618411a5116d0a/media/sendQueryExample.gif" width="500" />

## Setup

```
# install dependencies
yarn install
# typescript compile
yarn compile
```

## Running/Debugging the Extension

Run the extension by using the `Run and Debug` tab in VS code. This will create a new VS code window where you can open a new workspace folder. Use the [axiom-quickstart](https://github.com/axiom-crypto/axiom-quickstart) project for testing.

Note: You may need to run `yarn recompile` for changes to reflect.

## Extension Settings

This extension contributes the following settings:

* `axiom.configFilePath`: File in which `PRIVATE_KEY_SEPOLIA` and `PROVIDER_URI_SEPOLIA` are defined. Default is `.env`.
* `axiom.circuitFilesPattern`: Glob pattern to used to automatically discover files containing circuit definitions. Default is `**/axiom/**/*.ts`.
* `axiom.buildDirectory`: Path where circuit outputs from compiled circuits will be written. Default is `build/axiom`.
