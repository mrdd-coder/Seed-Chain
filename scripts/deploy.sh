#!/bin/bash
# SeedChain Smart Contracts Deployment Script (Unix/Bash)

set -e

echo "========================================="
echo "   SeedChain Soroban Deployment Tool     "
echo "========================================="

# 1. Compile contracts
echo "[1/6] Compiling contracts to wasm32..."
cargo build --target wasm32-unknown-unknown --release

# Configure keys
echo "[2/6] Configuring deployer identity..."
if ! stellar keys list | grep -q "deployer"; then
    echo "Generating deployer key pair..."
    stellar keys generate deployer --network testnet
fi

DEPLOYER_ADDR=$(stellar keys address deployer)
echo "Deployer Address: $DEPLOYER_ADDR"

# 2. Install WASMs
echo "[3/6] Installing Campaign WASM template to Testnet..."
CAMPAIGN_WASM_HASH=$(stellar contract install --wasm ./target/wasm32-unknown-unknown/release/seedchain_campaign.wasm --source deployer --network testnet)
echo "Campaign WASM Hash: $CAMPAIGN_WASM_HASH"

echo "[4/6] Installing Syndicate Registry WASM..."
REGISTRY_WASM_HASH=$(stellar contract install --wasm ./target/wasm32-unknown-unknown/release/seedchain_syndicate.wasm --source deployer --network testnet)
echo "Registry WASM Hash: $REGISTRY_WASM_HASH"

# 3. Deploy
echo "[5/6] Deploying Syndicate Registry instance..."
REGISTRY_ADDR=$(stellar contract deploy --wasm-hash $REGISTRY_WASM_HASH --source deployer --network testnet --salt "seedchain_reg_salt_1")
echo "Registry Contract Address: $REGISTRY_ADDR"

# 4. Initialize
echo "[6/6] Initializing registry and template configurations..."
stellar contract invoke --id $REGISTRY_ADDR --source deployer --network testnet -- init --admin $DEPLOYER_ADDR
stellar contract invoke --id $REGISTRY_ADDR --source deployer --network testnet -- set_campaign_wasm --wasm_hash $CAMPAIGN_WASM_HASH

# 5. Output metadata.json
cat <<EOF > ./frontend/src/contracts-metadata.json
{
  "network": "testnet",
  "rpcUrl": "https://soroban-testnet.stellar.org",
  "registryAddress": "$REGISTRY_ADDR",
  "campaignWasmHash": "$CAMPAIGN_WASM_HASH",
  "deployerAddress": "$DEPLOYER_ADDR",
  "timestamp": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF

echo "Deployment metadata saved to ./frontend/src/contracts-metadata.json"
echo "========================================="
echo "   Deployment Completed Successfully!    "
echo "========================================="
