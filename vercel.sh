#!/bin/bash

# Ensure the GitHub token is available as an environment variable
if [ -z "$GIT_TOKEN" ]; then
  echo "Error: GIT_TOKEN environment variable is not set."
  exit 1
fi

# Replace the token placeholder in .gitmodules
echo "Replacing GIT_TOKEN in .gitmodules..."
sed -i "s|\$GIT_TOKEN|$GIT_TOKEN|g" .gitmodules

# Initialize submodules and clone them with the token directly if needed
echo "Initializing and updating submodules..."

# Handling ui-kit submodule
git submodule update --init --recursive --depth 1 ui-kit
# Clone wallet-provider submodule
git submodule update --init --recursive --depth 1 wallet-provider
# Clone wallet-sdk submodule
git submodule update --init --recursive --depth 1 wallet-provider/wallet-sdk

# Optionally, if submodules still fail to update, you can directly clone the specific ones
# For ui-kit
git clone https://$GIT_TOKEN@github.com/coinmeca/ui-kit.git ui-kit

# For wallet-provider
git clone https://$GIT_TOKEN@github.com/coinmeca/wallet-provider.git wallet-provider

# For wallet-sdk (inside wallet-provider)
git clone https://$GIT_TOKEN@github.com/coinmeca/wallet-sdk.git wallet-provider/wallet-sdk

# Install dependencies for the entire project
echo "Installing dependencies..."
yarn install

# Install UI kit
cd ui-kit && yarn install && yarn build
cd ..

# Install wallet-sdk
cd wallet-provider/wallet-sdk && yarn install && yarn build
cd ..

# Install wallet-provider
cd wallet-provider
yarn install && yarn build
cd ..

# Return to root directory
cd ..
