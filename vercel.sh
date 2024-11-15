#!/bin/bash

# Ensure the GitHub token is available as an environment variable
export GIT_TOKEN=$GIT_TOKEN

# Replace the placeholder in .gitmodules with the actual token
sed -i "s|\$GIT_TOKEN|$GIT_TOKEN|g" .gitmodules

# Initialize and update submodules
git submodule update --init --recursive

# Install dependencies
yarn install
cd ui-kit && yarn install && yarn build
cd ../wallet-provider && sh vercel.sh
# cd wallet-sdk && yarn install
cd ..