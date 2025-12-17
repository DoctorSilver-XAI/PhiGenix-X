#!/bin/bash

echo "=========================================="
echo "     AXORA PHARMACY - MAC LAUNCHER"
echo "=========================================="

# Function to check command
command_exists () {
    type "$1" &> /dev/null ;
}

if ! command_exists node ; then
    echo "[ERROR] Node.js is not installed! Please install it."
    exit 1
fi

# 1. Setup Agent
echo ""
echo "[1/3] Setting up Card Reader Agent..."
cd scripts/card-reader-agent
if [ ! -d "node_modules" ]; then
    echo "Installing agent dependencies (skipping optional if build fails)..."
    npm install --no-optional
fi
cd ../..

# 2. Setup Frontend
echo ""
echo "[2/3] Setting up Axora Web App..."
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# 3. Launch
echo ""
echo "[3/3] Starting Services..."

# Start Agent
echo "Starting Card Agent..."
# We use a trap to kill the agent when this script exits
trap 'kill $(jobs -p)' EXIT
cd scripts/card-reader-agent
node server.js &
AGENT_PID=$!
cd ../..

# Wait a moment
sleep 2

# Start Frontend
echo "Starting Web App..."
npm run dev
