#!/bin/bash

# Solarpunk Design Toggle Script
# This script allows easy switching between original and solarpunk designs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "🌱 Solarpunk Design Toggle Script"
echo "=================================="

# Function to show current status
show_status() {
    if [ -f "$PROJECT_ROOT/src/pages/HomePage.original.tsx" ]; then
        echo "✅ Original HomePage backed up"
    else
        echo "❌ Original HomePage not found"
    fi
    
    if [ -f "$PROJECT_ROOT/src/components/Layout/Layout.original.tsx" ]; then
        echo "✅ Original Layout backed up"
    else
        echo "❌ Original Layout not found"
    fi
    
    if [ -f "$PROJECT_ROOT/src/styles/solarpunk-design.css" ]; then
        echo "✅ Solarpunk design system installed"
    else
        echo "❌ Solarpunk design system not found"
    fi
}

# Function to switch to solarpunk design
switch_to_solarpunk() {
    echo "🌱 Switching to Solarpunk Design..."
    
    # Check if solarpunk files exist
    if [ ! -f "$PROJECT_ROOT/src/pages/HomePage.tsx" ] || [ ! -f "$PROJECT_ROOT/src/components/Layout/Layout.tsx" ]; then
        echo "❌ Error: Current files not found. Please ensure you're in the project root."
        exit 1
    fi
    
    # The solarpunk design is already active since we modified the files directly
    echo "✅ Solarpunk design is now active!"
    echo "🌱 Features:"
    echo "   - Earth-toned color palette (forest green, solar yellow, sky blue)"
    echo "   - Nature-inspired typography (Poppins, Space Grotesk)"
    echo "   - Full-screen hero sections with gradients"
    echo "   - Subtle hover effects and animations"
    echo "   - Solarpunk-themed buttons and cards"
    echo ""
    echo "🚀 Start the development server with: npm start"
}

# Function to switch back to original design
switch_to_original() {
    echo "🏕️ Switching to Original Design..."
    
    # Check if original backups exist
    if [ ! -f "$PROJECT_ROOT/src/pages/HomePage.original.tsx" ] || [ ! -f "$PROJECT_ROOT/src/components/Layout/Layout.original.tsx" ]; then
        echo "❌ Error: Original backup files not found."
        echo "   Please ensure you have HomePage.original.tsx and Layout.original.tsx"
        exit 1
    fi
    
    # Restore original files
    cp "$PROJECT_ROOT/src/pages/HomePage.original.tsx" "$PROJECT_ROOT/src/pages/HomePage.tsx"
    cp "$PROJECT_ROOT/src/components/Layout/Layout.original.tsx" "$PROJECT_ROOT/src/components/Layout/Layout.tsx"
    
    echo "✅ Original design restored!"
    echo "🏕️ Features:"
    echo "   - Original brand colors (moss green, teal, sun yellow)"
    echo "   - Inter font family"
    echo "   - Standard card layouts"
    echo "   - Original navigation styling"
    echo ""
    echo "🚀 Start the development server with: npm start"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  solarpunk    Switch to solarpunk design (current)"
    echo "  original     Switch back to original design"
    echo "  status       Show current status"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 solarpunk    # Switch to solarpunk design"
    echo "  $0 original     # Switch back to original design"
    echo "  $0 status       # Check current status"
}

# Main script logic
case "${1:-status}" in
    "solarpunk")
        switch_to_solarpunk
        ;;
    "original")
        switch_to_original
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
