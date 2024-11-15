#!/bin/bash

# Load environment variables from .env file
export $(cat .env | grep -v '^#' | xargs)

# Replace the submodule URLs with the GitHub token in .gitmodules
sed -i "s|https://github.com/coinmeca/wallet-provider|https://$GIT_TOKEN@github.com/coinmeca/wallet-provider|g" .gitmodules
sed -i "s|https://github.com/coinmeca/wallet-sdk|https://$GIT_TOKEN@github.com/coinmeca/wallet-sdk|g" .gitmodules

# Initialize and update submodules
git submodule update --init --recursive
