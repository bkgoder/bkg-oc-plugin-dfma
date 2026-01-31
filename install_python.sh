#!/bin/bash
# Install Python using pyenv

set -e

echo "===================================="
echo "Installing Python via pyenv..."
echo "===================================="

# Check if pyenv is already installed
if command -v pyenv &> /dev/null; then
    echo "pyenv is already installed (version: $(pyenv --version))"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if cd "$HOME/.pyenv" && git pull && cd -; then
            echo "pyenv updated successfully!"
        else
            echo "Warning: Failed to update pyenv. You may need to manually update it."
            echo "Try running: cd ~/.pyenv && git pull"
        fi
    fi
else
    # Install dependencies (for Debian/Ubuntu)
    if command -v apt-get &> /dev/null; then
        echo "Installing build dependencies..."
        sudo apt-get update
        sudo apt-get install -y make build-essential libssl-dev zlib1g-dev \
            libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
            libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev \
            libffi-dev liblzma-dev
    fi
    
    # Install pyenv
    echo "Downloading and installing pyenv..."
    curl https://pyenv.run | bash
    
    # Set up environment
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"
    
    echo "pyenv installed successfully!"
    echo "Version: $(pyenv --version)"
fi

# Install latest Python version
echo ""
read -p "Do you want to install the latest Python 3.11 version? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"
    
    PYTHON_VERSION="3.11.7"
    echo "Installing Python ${PYTHON_VERSION}..."
    pyenv install ${PYTHON_VERSION}
    pyenv global ${PYTHON_VERSION}
    echo "Python installed: $(python --version)"
fi

echo ""
echo "To use pyenv in your current shell, add to your ~/.bashrc or ~/.zshrc:"
echo "  export PYENV_ROOT=\"\$HOME/.pyenv\""
echo "  export PATH=\"\$PYENV_ROOT/bin:\$PATH\""
echo "  eval \"\$(pyenv init -)\""
echo ""
