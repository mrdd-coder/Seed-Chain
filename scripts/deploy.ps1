# SeedChain Smart Contracts Deployment Automation Script (Windows PowerShell)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   SeedChain Soroban Deployment Tool     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Compile smart contracts to WASM target
Write-Host "[1/6] Compiling contracts to wasm32v1..." -ForegroundColor Green
& "C:\Program Files (x86)\Stellar CLI\stellar.exe" contract build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Stellar build failed. Exiting."
    exit 1
}

# Ensure keys and identity exist on testnet
Write-Host "[2/6] Configuring deployer identity..." -ForegroundColor Green
$deployerAlias = "charlie"
$deployerAddress = & "C:\Program Files (x86)\Stellar CLI\stellar.exe" keys address $deployerAlias
Write-Host "Deployer Address: $deployerAddress" -ForegroundColor Gray

# 2. Upload WASM bytes to Testnet
Write-Host "[3/6] Installing Campaign WASM template to Testnet..." -ForegroundColor Green
$campaignWasmHash = & "C:\Program Files (x86)\Stellar CLI\stellar.exe" contract install --wasm .\target\wasm32v1-none\release\seedchain_campaign.wasm --source $deployerAlias --network testnet
Write-Host "Campaign WASM Hash: $campaignWasmHash" -ForegroundColor Yellow

Write-Host "[4/6] Installing Syndicate Registry WASM..." -ForegroundColor Green
$registryWasmHash = & "C:\Program Files (x86)\Stellar CLI\stellar.exe" contract install --wasm .\target\wasm32v1-none\release\seedchain_syndicate.wasm --source $deployerAlias --network testnet
Write-Host "Registry WASM Hash: $registryWasmHash" -ForegroundColor Yellow

# 3. Deploy SyndicateRegistry Contract Instance
Write-Host "[5/6] Deploying Syndicate Registry instance..." -ForegroundColor Green
$registryAddress = & "C:\Program Files (x86)\Stellar CLI\stellar.exe" contract deploy --wasm-hash $registryWasmHash --source $deployerAlias --network testnet --salt "0000000000000000000000000000000000000000000000000000000000000001"
Write-Host "Registry Contract Address: $registryAddress" -ForegroundColor Yellow

# 4. Initialize SyndicateRegistry & Configure Campaign Template WASM
Write-Host "[6/6] Initializing registry and template configurations..." -ForegroundColor Green

# Invoke init(admin)
& "C:\Program Files (x86)\Stellar CLI\stellar.exe" contract invoke --id $registryAddress --source $deployerAlias --network testnet -- init --admin $deployerAddress
Write-Host "Registry Initialized." -ForegroundColor Gray

# Invoke set_campaign_wasm(wasm_hash)
& "C:\Program Files (x86)\Stellar CLI\stellar.exe" contract invoke --id $registryAddress --source $deployerAlias --network testnet -- set_campaign_wasm --wasm_hash $campaignWasmHash
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
