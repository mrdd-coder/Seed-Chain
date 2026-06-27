#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env, Val, Vec,
    IntoVal, Symbol,
};

// Import campaign types and client directly from campaign crate
use seedchain_campaign::{ProjectCampaignClient, Milestone};

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub enum DataKey {
    Admin,
    CampaignWasm,
    Campaigns,
    PlatformFeePct, // e.g., 200 for 2%
    Treasury,
}

// TTL limits for storage management
const LEDGER_THRESHOLD: u32 = 1000;
const LEDGER_EXTEND_TO: u32 = 10000;

fn extend_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(LEDGER_THRESHOLD, LEDROW_EXTEND_TO_FIX());
}

// Fix LEDROW_EXTEND_TO_FIX: use LEDGER_EXTEND_TO constant
fn LEDROW_EXTEND_TO_FIX() -> u32 {
    LEDGER_EXTEND_TO
}

#[contract]
pub struct SyndicateRegistry;

#[contractimpl]
impl SyndicateRegistry {
    /// Initialize the syndicate registry with an admin
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Registry already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Campaigns, &Vec::<Address>::new(&env));
        env.storage().instance().set(&DataKey::PlatformFeePct, &0u32); // Default 0% fee
        env.storage().instance().set(&DataKey::Treasury, &admin); // Default treasury is admin
        extend_instance_ttl(&env);
    }

    /// Set the WASM hash for child campaigns. Admin authorization required.
    pub fn set_campaign_wasm(env: Env, wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        extend_instance_ttl(&env);

        env.storage().instance().set(&DataKey::CampaignWasm, &wasm_hash);
        env.events().publish(
            (symbol_short!("set_wasm"),),
            wasm_hash,
        );
    }

    /// Set platform fees and treasury wallet. Admin authorization required.
    pub fn set_platform_fee(env: Env, fee_pct: u32, treasury: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        extend_instance_ttl(&env);

        if fee_pct > 1000 {
            panic!("Fee percentage cannot exceed 10%");
        }

        env.storage().instance().set(&DataKey::PlatformFeePct, &fee_pct);
        env.storage().instance().set(&DataKey::Treasury, &treasury);

        env.events().publish(
            (symbol_short!("set_fee"), fee_pct),
            treasury,
        );
    }

    /// Create and deploy a new project campaign dynamically.
    pub fn create_campaign(
        env: Env,
        founder: Address,
        salt: BytesN<32>,
        funding_goal: i128,
        deadline: u32,
        milestones: Vec<Milestone>,
        token: Address,
    ) -> Address {
        founder.require_auth();
        extend_instance_ttl(&env);

        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::CampaignWasm)
            .expect("Campaign WASM hash not registered");

        // Deploy new contract instance
        let deployer = env.deployer().with_current_contract(salt);
        let campaign_addr = deployer.deploy(wasm_hash);

        // Initialize campaign contract via client
        let campaign_client = ProjectCampaignClient::new(&env, &campaign_addr);
        campaign_client.init(&founder, &token, &funding_goal, &deadline, &milestones);

        // Track campaign address
        let mut campaigns: Vec<Address> = env.storage().instance().get(&DataKey::Campaigns).unwrap();
        campaigns.push_back(campaign_addr.clone());
        env.storage().instance().set(&DataKey::Campaigns, &campaigns);

        env.events().publish(
            (symbol_short!("new_proj"), founder, campaign_addr.clone()),
            funding_goal,
        );

        campaign_addr
    }

    /// Get all campaigns registered on SeedChain
    pub fn get_campaigns(env: Env) -> Vec<Address> {
        extend_instance_ttl(&env);
        env.storage().instance().get(&DataKey::Campaigns).unwrap_or(Vec::new(&env))
    }

    /// Read platform settings
    pub fn get_platform_settings(env: Env) -> (Address, u32, Address) {
        extend_instance_ttl(&env);
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let fee_pct: u32 = env.storage().instance().get(&DataKey::PlatformFeePct).unwrap_or(0);
        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        (admin, fee_pct, treasury)
    }

    /// Upgrade registry contract itself. Admin authorization required.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        extend_instance_ttl(&env);

        env.deployer().update_current_contract_wasm(new_wasm_hash);
        env.events().publish(
            (Symbol::new(&env, "contract_upgraded"),),
            new_wasm_hash,
        );
    }
}

#[cfg(test)]
mod test;

