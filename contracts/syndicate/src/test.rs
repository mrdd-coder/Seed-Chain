#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, BytesN, Vec
};

#[test]
fn test_registry_initialization_and_fees() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    // Deploy syndicate registry
    let registry_id = env.register_contract(None, SyndicateRegistry);
    let registry_client = SyndicateRegistryClient::new(&env, &registry_id);

    // Initialize
    registry_client.init(&admin);

    // Verify settings
    let (admin_addr, fee_pct, treasury) = registry_client.get_platform_settings();
    assert_eq!(admin_addr, admin);
    assert_eq!(fee_pct, 0);
    assert_eq!(treasury, admin);

    // Update platform fee to 1.5% (150 basis points)
    let treasury_wallet = Address::generate(&env);
    registry_client.set_platform_fee(&150, &treasury_wallet);

    let (_, fee_pct_new, treasury_new) = registry_client.get_platform_settings();
    assert_eq!(fee_pct_new, 150);
    assert_eq!(treasury_new, treasury_wallet);

    // Verify only admin can set platform fees
    let non_admin = Address::generate(&env);
    // Setting fee from non-admin should fail the authorization check
    let result = std::panic::catch_unwind(|| {
        let local_env = Env::default();
        let local_registry_client = SyndicateRegistryClient::new(&local_env, &registry_id);
        local_registry_client.set_platform_fee(&500, &non_admin);
    });
    assert!(result.is_err());
}
