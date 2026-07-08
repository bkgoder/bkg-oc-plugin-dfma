#!/bin/bash
# Install Conda (Miniconda)

set -e

echo "===================================="
echo "Installing Conda (Miniconda)..."
echo "===================================="

# Check if conda is already installed
if command -v conda &> /dev/null; then
    echo "Conda is already installed (version: $(conda --version))"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        conda update -n base -c defaults conda -y
        echo "Conda updated successfully!"
    fi
else
    # Detect architecture
    ARCH=$(uname -m)
    OS=$(uname -s)
    
    if [ "$OS" = "Linux" ]; then
        if [ "$ARCH" = "x86_64" ]; then
            MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh"
        elif [ "$ARCH" = "aarch64" ]; then
            MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-aarch64.sh"
        else
            echo "Unsupported architecture: $ARCH"
            exit 1
        fi
    elif [ "$OS" = "Darwin" ]; then
        if [ "$ARCH" = "x86_64" ]; then
            MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh"
        elif [ "$ARCH" = "arm64" ]; then
            MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh"
        else
            echo "Unsupported architecture: $ARCH"
            exit 1
        fi
    else
        echo "Unsupported OS: $OS"
        exit 1
    fi
    
    # Download and install Miniconda
    echo "Downloading Miniconda for $OS ($ARCH)..."
    TEMP_FILE=$(mktemp)
    curl -L -o "$TEMP_FILE" "$MINICONDA_URL"
    
    echo "Installing Miniconda..."
    bash "$TEMP_FILE" -b -p "$HOME/miniconda3"
    rm "$TEMP_FILE"
    
    # Initialize conda
    "$HOME/miniconda3/bin/conda" init bash
    
    # Source conda
    eval "$("$HOME/miniconda3/bin/conda" shell.bash hook)"
    
    echo "Conda installed successfully!"
    echo "Version: $(conda --version)"
fi

echo ""
echo "To use Conda in your current shell, run:"
echo "  source ~/miniconda3/bin/activate"
echo "Or restart your shell for conda to be automatically available"
echo ""
