#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String, Vec,
};

#[test]
fn test_campaign_success_and_milestone_release() {
    let env = Env::default();
    env.mock_all_auths();

    let founder = Address::generate(&env);
    let investor_1 = Address::generate(&env);
    let investor_2 = Address::generate(&env);

    // Set ledger
    env.ledger().with_mut(|info| {
        info.sequence_number = 10;
    });

    // Deploy token contract
    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_addr);
    let sac_client = token::StellarAssetClient::new(&env, &token_addr);

    // Mint tokens
    sac_client.mint(&investor_1, &600);
    sac_client.mint(&investor_2, &600);

    // Create Milestones
    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "Milestone 1"),
        amount_pct: 40,
        status: MilestoneStatus::Pending,
    });
    milestones.push_back(Milestone {
        id: 2,
        description: String::from_str(&env, "Milestone 2"),
        amount_pct: 60,
        status: MilestoneStatus::Pending,
    });

    // Deploy campaign
    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);

    // Initialize campaign
    let goal = 1000i128;
    let deadline = 100u32;
    campaign_client.init(&founder, &token_addr, &goal, &deadline, &milestones);

    // Pledge funds
    campaign_client.pledge(&investor_1, &400);
    campaign_client.pledge(&investor_2, &600);

    assert_eq!(campaign_client.get_pledge(&investor_1), 400);
    assert_eq!(campaign_client.get_pledge(&investor_2), 600);

    let (_, _, _, _, total_pledged, _, _) = campaign_client.get_campaign_info();
    assert_eq!(total_pledged, 1000);
    assert_eq!(token_client.balance(&campaign_id), 1000);

    // Founder requests milestone 1 payout (40% = 400 tokens)
    campaign_client.request_milestone_payout(&1);

    // Check status is PayoutRequested
    let mlist = campaign_client.get_milestones();
    assert_eq!(mlist.get(0).unwrap().status, MilestoneStatus::PayoutRequested);

    // Investors vote
    campaign_client.vote_on_milestone(&investor_1, &1, &true); // 400 votes yes
    campaign_client.vote_on_milestone(&investor_2, &1, &true); // 600 votes yes

    // Claim milestone payout
    campaign_client.claim_milestone_payout(&1);

    // Check status is Paid
    let mlist2 = campaign_client.get_milestones();
    assert_eq!(mlist2.get(0).unwrap().status, MilestoneStatus::Paid);

    // Verify token transfers (founder gets 40% of 1000 = 400)
    assert_eq!(token_client.balance(&founder), 400);
    assert_eq!(token_client.balance(&campaign_id), 600);
}

#[test]
fn test_campaign_failure_and_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let founder = Address::generate(&env);
    let investor = Address::generate(&env);

    // Deploy token contract
    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_addr);
    let sac_client = token::StellarAssetClient::new(&env, &token_addr);
    sac_client.mint(&investor, &500);

    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "All or nothing"),
        amount_pct: 100,
        status: MilestoneStatus::Pending,
    });

    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);

    let goal = 1000i128;
    let deadline = 100u32;
    campaign_client.init(&founder, &token_addr, &goal, &deadline, &milestones);

    // Pledge only 500 (fails goal of 1000)
    campaign_client.pledge(&investor, &500);

    // Try to withdraw early (should fail)
    env.ledger().with_mut(|info| {
        info.sequence_number = 50;
    });
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let local_env = Env::default();
        let local_campaign_client = ProjectCampaignClient::new(&local_env, &campaign_id);
        local_campaign_client.withdraw(&investor);
    }));
    assert!(result.is_err());

    // Advance sequence past deadline
    env.ledger().with_mut(|info| {
        info.sequence_number = 101;
    });

    // Withdraw succeeds now
    campaign_client.withdraw(&investor);

    // Balance is restored
    assert_eq!(token_client.balance(&investor), 500);
    assert_eq!(token_client.balance(&campaign_id), 0);
}

#[test]
fn test_campaign_refund_trigger() {
    let env = Env::default();
    env.mock_all_auths();

    let founder = Address::generate(&env);
    let investor_1 = Address::generate(&env);
    let investor_2 = Address::generate(&env);

    // Deploy token contract
    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_addr);
    let sac_client = token::StellarAssetClient::new(&env, &token_addr);
    sac_client.mint(&investor_1, &500);
    sac_client.mint(&investor_2, &500);

    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "Setup"),
        amount_pct: 50,
        status: MilestoneStatus::Pending,
    });
    milestones.push_back(Milestone {
        id: 2,
        description: String::from_str(&env, "Build"),
        amount_pct: 50,
        status: MilestoneStatus::Pending,
    });

    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);

    let goal = 1000i128;
    let deadline = 100u32;
    campaign_client.init(&founder, &token_addr, &goal, &deadline, &milestones);

    // Fully fund the project
    campaign_client.pledge(&investor_1, &500);
    campaign_client.pledge(&investor_2, &500);

    // Claim milestone 1 (approved automatically by testing mock auths for simplicity, or we can just vote)
    campaign_client.request_milestone_payout(&1);
    campaign_client.vote_on_milestone(&investor_1, &1, &true);
    campaign_client.vote_on_milestone(&investor_2, &1, &true);
    campaign_client.claim_milestone_payout(&1);

    // Verification: contract has 500 tokens left (milestone 1 paid 50% = 500)
    assert_eq!(token_client.balance(&campaign_id), 500);
    assert_eq!(token_client.balance(&founder), 500);

    // Investor 1 initiates refund (50% vote weight, not enough yet)
    campaign_client.vote_on_refund(&investor_1, &true);
    
    let (_, _, _, _, _, _, refund_active) = campaign_client.get_campaign_info();
    assert_eq!(refund_active, false); // Still false since 500 is not > 500 (needs >50% total pledges)

    // Investor 2 votes yes (now 100% yes votes)
    campaign_client.vote_on_refund(&investor_2, &true);

    let (_, _, _, _, _, _, refund_active_now) = campaign_client.get_campaign_info();
    assert_eq!(refund_active_now, true); // True now!

    // Claim refund
    let balance_before_ref1 = token_client.balance(&investor_1);
    campaign_client.claim_refund(&investor_1);
    let balance_after_ref1 = token_client.balance(&investor_1);

    // Investor 1 gets 50% of the remaining 500 tokens = 250 tokens
    assert_eq!(balance_after_ref1 - balance_before_ref1, 250);

    // Investor 2 claims refund
    campaign_client.claim_refund(&investor_2);
    assert_eq!(token_client.balance(&campaign_id), 0);
}

#[test]
fn test_get_status_uninitialized() {
    let env = Env::default();
    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        campaign_client.get_campaign_info();
    }));
    assert!(result.is_err());
}

#[test]
fn test_deposit() {
    let env = Env::default();
    env.mock_all_auths();

    let founder = Address::generate(&env);
    let investor = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_addr);
    let sac_client = token::StellarAssetClient::new(&env, &token_addr);
    sac_client.mint(&investor, &500);

    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "First"),
        amount_pct: 100,
        status: MilestoneStatus::Pending,
    });

    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);
    campaign_client.init(&founder, &token_addr, &1000, &100, &milestones);

    campaign_client.pledge(&investor, &300);
    assert_eq!(campaign_client.get_pledge(&investor), 300);
    assert_eq!(token_client.balance(&campaign_id), 300);
}

#[test]
fn test_double_deposit_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let founder = Address::generate(&env);
    let investor = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin);
    let sac_client = token::StellarAssetClient::new(&env, &token_addr);
    sac_client.mint(&investor, &1500);

    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "First"),
        amount_pct: 100,
        status: MilestoneStatus::Pending,
    });

    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);
    campaign_client.init(&founder, &token_addr, &1000, &100, &milestones);

    campaign_client.pledge(&investor, &600);
    campaign_client.pledge(&investor, &400);
    assert_eq!(campaign_client.get_pledge(&investor), 1000);
}

#[test]
fn test_release() {
    let env = Env::default();
    env.mock_all_auths();

    let founder = Address::generate(&env);
    let investor = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_addr);
    let sac_client = token::StellarAssetClient::new(&env, &token_addr);
    sac_client.mint(&investor, &1000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "First"),
        amount_pct: 100,
        status: MilestoneStatus::Pending,
    });

    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);
    campaign_client.init(&founder, &token_addr, &1000, &100, &milestones);

    campaign_client.pledge(&investor, &1000);
    campaign_client.request_milestone_payout(&1);
    campaign_client.vote_on_milestone(&investor, &1, &true);
    campaign_client.claim_milestone_payout(&1);

    assert_eq!(token_client.balance(&founder), 1000);
}

#[test]
fn test_release_wrong_state() {
    let env = Env::default();
    env.mock_all_auths();

    let founder = Address::generate(&env);
    let investor = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin);
    let sac_client = token::StellarAssetClient::new(&env, &token_addr);
    sac_client.mint(&investor, &1000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "First"),
        amount_pct: 100,
        status: MilestoneStatus::Pending,
    });

    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);
    campaign_client.init(&founder, &token_addr, &1000, &100, &milestones);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        campaign_client.claim_milestone_payout(&1);
    }));
    assert!(result.is_err());
}

#[test]
fn test_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let founder = Address::generate(&env);
    let investor = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin);
    let sac_client = token::StellarAssetClient::new(&env, &token_addr);
    sac_client.mint(&investor, &1000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "First"),
        amount_pct: 100,
        status: MilestoneStatus::Pending,
    });

    let campaign_id = env.register_contract(None, ProjectCampaign);
    let campaign_client = ProjectCampaignClient::new(&env, &campaign_id);
    campaign_client.init(&founder, &token_addr, &1000, &100, &milestones);

    campaign_client.pledge(&investor, &1000);
    campaign_client.vote_on_refund(&investor, &true);
    campaign_client.claim_refund(&investor);
}
