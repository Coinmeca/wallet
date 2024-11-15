#!/bin/bash

# Ensure the GitHub token is available as an environment variable
if [ -z "$GIT_TOKEN" ]; then
  echo "Error: GIT_TOKEN environment variable is not set."
  exit 1
fi

# Replace the placeholder in .gitmodules with the actual token
sed -i "s|\$GIT_TOKEN|$GIT_TOKEN|g" .gitmodules

# Check if the token substitution was successful
echo "Token substitution complete."

# Initialize and update submodules
git submodule update --init --recursive

# Check if submodule update was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to update submodules."
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
yarn install

# Install UI kit
cd ui-kit && yarn install && yarn build
cd ..

# Install wallet-provider
cd wallet-provider
sh vercel.sh
cd ..

# Optionally install wallet-sdk
cd wallet-provider/wallet-sdk && yarn install
cd ..

# Return to root
cd ..
