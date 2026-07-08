#!/bin/bash
# Install Rust using rustup

set -e

echo "===================================="
echo "Installing Rust via rustup..."
echo "===================================="

# Check if Rust is already installed
if command -v rustc &> /dev/null; then
    echo "Rust is already installed (version: $(rustc --version))"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rustup update
        echo "Rust updated successfully!"
    fi
else
    # Install rustup
    echo "Downloading and installing rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    
    # Source cargo env
    source "$HOME/.cargo/env"
    
    echo "Rust installed successfully!"
    echo "Version: $(rustc --version)"
    echo "Cargo version: $(cargo --version)"
fi

echo ""
echo "To use Rust in your current shell, run:"
echo "  source \$HOME/.cargo/env"
echo ""
