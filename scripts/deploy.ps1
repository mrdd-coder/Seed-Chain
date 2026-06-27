# SeedChain Smart Contracts Deployment Automation Script (Windows PowerShell)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   SeedChain Soroban Deployment Tool     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Compile smart contracts to WASM target
Write-Host "[1/6] Compiling contracts to wasm32..." -ForegroundColor Green
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cargo build failed. Exiting."
    exit 1
}

# Ensure keys and identity exist on testnet
Write-Host "[2/6] Configuring deployer identity..." -ForegroundColor Green
# Check if deployer account is configured in Stellar CLI
$deployerExists = stellar keys list | Select-String "deployer"
if (-not $deployerExists) {
    Write-Host "Generating deployer key pair..." -ForegroundColor Yellow
    stellar keys generate deployer --network testnet
}

$deployerAddress = stellar keys address deployer
Write-Host "Deployer Address: $deployerAddress" -ForegroundColor Gray

# 2. Upload WASM bytes to Testnet
Write-Host "[3/6] Installing Campaign WASM template to Testnet..." -ForegroundColor Green
$campaignWasmHash = stellar contract install --wasm .\target\wasm32-unknown-unknown\release\seedchain_campaign.wasm --source deployer --network testnet
Write-Host "Campaign WASM Hash: $campaignWasmHash" -ForegroundColor Yellow

Write-Host "[4/6] Installing Syndicate Registry WASM..." -ForegroundColor Green
$registryWasmHash = stellar contract install --wasm .\target\wasm32-unknown-unknown\release\seedchain_syndicate.wasm --source deployer --network testnet
Write-Host "Registry WASM Hash: $registryWasmHash" -ForegroundColor Yellow

# 3. Deploy SyndicateRegistry Contract Instance
Write-Host "[5/6] Deploying Syndicate Registry instance..." -ForegroundColor Green
$registryAddress = stellar contract deploy --wasm-hash $registryWasmHash --source deployer --network testnet --salt "seedchain_reg_salt_1"
Write-Host "Registry Contract Address: $registryAddress" -ForegroundColor Yellow

# 4. Initialize SyndicateRegistry & Configure Campaign Template WASM
Write-Host "[6/6] Initializing registry and template configurations..." -ForegroundColor Green

# Invoke init(admin)
stellar contract invoke --id $registryAddress --source deployer --network testnet -- init --admin $deployerAddress
Write-Host "Registry Initialized." -ForegroundColor Gray

# Invoke set_campaign_wasm(wasm_hash)
stellar contract invoke --id $registryAddress --source deployer --network testnet -- set_campaign_wasm --wasm_hash $campaignWasmHash
Write-Host "Campaign template hash configured in registry." -ForegroundColor Gray

# 5. Output metadata.json to frontend
$metadata = @{
    network = "testnet"
    rpcUrl = "https://soroban-testnet.stellar.org"
    registryAddress = $registryAddress
    campaignWasmHash = $campaignWasmHash
    deployerAddress = $deployerAddress
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$metadataPath = ".\frontend\src\contracts-metadata.json"
$metadata | ConvertTo-Json | Out-File -FilePath $metadataPath -Encoding utf8
Write-Host "Deployment metadata successfully saved to: $metadataPath" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Deployment Completed Successfully!    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
