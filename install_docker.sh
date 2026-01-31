#!/bin/bash
# Install Docker

set -e

echo "===================================="
echo "Installing Docker..."
echo "===================================="

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo "Docker is already installed (version: $(docker --version))"
    read -p "Do you want to reinstall/update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Detect OS
OS=$(uname -s)

if [ "$OS" = "Linux" ]; then
    # Detect distribution
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
    else
        echo "Cannot detect Linux distribution"
        exit 1
    fi
    
    echo "Detected Linux distribution: $DISTRO"
    
    if [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ]; then
        # Remove old versions
        echo "Removing old Docker versions..."
        sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # Update package index
        echo "Updating package index..."
        sudo apt-get update
        
        # Install dependencies
        echo "Installing dependencies..."
        sudo apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker's official GPG key
        echo "Adding Docker GPG key..."
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$DISTRO/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        # Set up repository
        echo "Setting up Docker repository..."
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$DISTRO \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        echo "Installing Docker Engine..."
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif [ "$DISTRO" = "fedora" ] || [ "$DISTRO" = "rhel" ] || [ "$DISTRO" = "centos" ]; then
        # Install using dnf/yum
        echo "Installing Docker via dnf/yum..."
        sudo dnf -y install dnf-plugins-core
        
        # Set appropriate repository URL based on distribution
        if [ "$DISTRO" = "rhel" ]; then
            REPO_URL="https://download.docker.com/linux/rhel/docker-ce.repo"
        elif [ "$DISTRO" = "centos" ]; then
            REPO_URL="https://download.docker.com/linux/centos/docker-ce.repo"
        else
            REPO_URL="https://download.docker.com/linux/fedora/docker-ce.repo"
        fi
        
        sudo dnf config-manager --add-repo "$REPO_URL"
        sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    else
        echo "Unsupported Linux distribution: $DISTRO"
        echo "Please install Docker manually from https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    # Start Docker service
    echo "Starting Docker service..."
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    echo "Adding current user to docker group..."
    sudo usermod -aG docker $USER
    
    echo ""
    echo "Docker installed successfully!"
    echo "Version: $(docker --version)"
    echo ""
    echo "NOTE: You need to log out and log back in (or restart) for group changes to take effect."
    echo "After that, you can run Docker commands without sudo."
    
elif [ "$OS" = "Darwin" ]; then
    echo "For macOS, please install Docker Desktop from:"
    echo "https://docs.docker.com/desktop/install/mac-install/"
    echo ""
    echo "Or use Homebrew:"
    echo "  brew install --cask docker"
    exit 0
else
    echo "Unsupported OS: $OS"
    echo "Please install Docker manually from https://docs.docker.com/engine/install/"
    exit 1
fi

echo ""
echo "Docker installation complete!"
echo ""
