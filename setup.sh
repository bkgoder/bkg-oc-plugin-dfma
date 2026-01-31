#!/bin/bash
# Master installation script for development tools
# This script installs: Rust, NVM, Python, Conda, and Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Development Tools Installation Script"
echo "=========================================="
echo ""
echo "This script will help you install:"
echo "  - Rust (via rustup)"
echo "  - NVM (Node Version Manager)"
echo "  - Python (via pyenv)"
echo "  - Conda (Miniconda)"
echo "  - Docker"
echo ""
echo "=========================================="
echo ""

# Function to make scripts executable
make_executable() {
    chmod +x "$SCRIPT_DIR/install_rust.sh"
    chmod +x "$SCRIPT_DIR/install_nvm.sh"
    chmod +x "$SCRIPT_DIR/install_python.sh"
    chmod +x "$SCRIPT_DIR/install_conda.sh"
    chmod +x "$SCRIPT_DIR/install_docker.sh"
}

# Make all installation scripts executable
make_executable

# Function to show menu
show_menu() {
    echo ""
    echo "Select installation option:"
    echo "  1) Install all tools"
    echo "  2) Install Rust only"
    echo "  3) Install NVM only"
    echo "  4) Install Python only"
    echo "  5) Install Conda only"
    echo "  6) Install Docker only"
    echo "  7) Custom selection"
    echo "  0) Exit"
    echo ""
}

# Function to install all
install_all() {
    echo "Installing all development tools..."
    echo ""
    
    "$SCRIPT_DIR/install_rust.sh"
    echo ""
    
    "$SCRIPT_DIR/install_nvm.sh"
    echo ""
    
    "$SCRIPT_DIR/install_python.sh"
    echo ""
    
    "$SCRIPT_DIR/install_conda.sh"
    echo ""
    
    "$SCRIPT_DIR/install_docker.sh"
    echo ""
    
    echo "=========================================="
    echo "All installations complete!"
    echo "=========================================="
}

# Function for custom selection
custom_selection() {
    echo ""
    echo "Select tools to install (space-separated numbers):"
    echo "  1) Rust"
    echo "  2) NVM"
    echo "  3) Python"
    echo "  4) Conda"
    echo "  5) Docker"
    echo ""
    read -p "Enter your choices (e.g., 1 3 5): " choices
    
    for choice in $choices; do
        case $choice in
            1)
                "$SCRIPT_DIR/install_rust.sh"
                echo ""
                ;;
            2)
                "$SCRIPT_DIR/install_nvm.sh"
                echo ""
                ;;
            3)
                "$SCRIPT_DIR/install_python.sh"
                echo ""
                ;;
            4)
                "$SCRIPT_DIR/install_conda.sh"
                echo ""
                ;;
            5)
                "$SCRIPT_DIR/install_docker.sh"
                echo ""
                ;;
            *)
                echo "Invalid choice: $choice"
                ;;
        esac
    done
    
    echo "=========================================="
    echo "Selected installations complete!"
    echo "=========================================="
}

# Check for non-interactive mode
if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
    install_all
    exit 0
fi

# Interactive mode
while true; do
    show_menu
    read -p "Enter your choice: " choice
    
    case $choice in
        1)
            install_all
            break
            ;;
        2)
            "$SCRIPT_DIR/install_rust.sh"
            break
            ;;
        3)
            "$SCRIPT_DIR/install_nvm.sh"
            break
            ;;
        4)
            "$SCRIPT_DIR/install_python.sh"
            break
            ;;
        5)
            "$SCRIPT_DIR/install_conda.sh"
            break
            ;;
        6)
            "$SCRIPT_DIR/install_docker.sh"
            break
            ;;
        7)
            custom_selection
            break
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
done

echo ""
echo "=========================================="
echo "Installation script finished!"
echo "=========================================="
echo ""
echo "Important notes:"
echo "  - For Rust: Run 'source ~/.cargo/env' to use in current shell"
echo "  - For NVM: Restart your shell or source your profile"
echo "  - For Python: Add pyenv to your shell configuration"
echo "  - For Conda: Restart your shell or run 'source ~/miniconda3/bin/activate'"
echo "  - For Docker: You may need to log out and back in for group permissions"
echo ""
echo "For detailed environment setup, please check the individual installation scripts."
echo ""
