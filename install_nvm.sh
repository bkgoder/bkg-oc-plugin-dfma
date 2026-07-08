#!/bin/bash
# Install NVM (Node Version Manager)

set -e

echo "===================================="
echo "Installing NVM (Node Version Manager)..."
echo "===================================="

# NVM version to install
NVM_VERSION="v0.39.7"

# Check if NVM is already installed
if [ -d "$HOME/.nvm" ]; then
    echo "NVM is already installed"
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    echo "Current NVM version: $(nvm --version)"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash
        echo "NVM updated successfully!"
    fi
else
    # Install NVM
    echo "Downloading and installing NVM ${NVM_VERSION}..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    echo "NVM installed successfully!"
    echo "Version: $(nvm --version)"
fi

# Install latest LTS version of Node.js
echo ""
read -p "Do you want to install the latest Node.js LTS version? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    nvm install --lts
    nvm use --lts
    echo "Node.js LTS installed: $(node --version)"
    echo "npm version: $(npm --version)"
fi

echo ""
echo "To use NVM in your current shell, run:"
echo "  export NVM_DIR=\"\$HOME/.nvm\""
echo "  [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\""
echo ""
