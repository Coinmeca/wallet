#!/bin/bash

# Ensure the GitHub token is available as an environment variable
if [ -z "$GIT_TOKEN" ]; then
  echo "Error: GIT_TOKEN environment variable is not set."
  exit 1
fi

# Replace the placeholder in .gitmodules with the actual token
echo "Replacing GitHub token in .gitmodules"
sed -i "s|\$GIT_TOKEN|$GIT_TOKEN|g" .gitmodules

# Check if the token substitution was successful
if [ $? -ne 0 ]; then
  echo "Error: Token substitution failed."
  exit 1
fi
echo "Token substitution complete."

# Initialize and update submodules
echo "Initializing and updating submodules"
git submodule update --init --recursive

# Check if submodule update was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to update submodules."
  exit 1
fi

# Install dependencies for the root project
echo "Installing root project dependencies..."
yarn install

# Install UI kit
echo "Installing UI kit dependencies..."
cd ui-kit && yarn install && yarn build
cd ..

# Install wallet-provider dependencies
echo "Installing wallet-provider dependencies..."
cd wallet-provider
yarn install

# Optionally install wallet-sdk
echo "Installing wallet-sdk dependencies..."
cd wallet-sdk && yarn install && yarn build
cd ..

# Build wallet-provider
echo "Building wallet-provider..."
yarn build

# Return to root directory
cd ..
