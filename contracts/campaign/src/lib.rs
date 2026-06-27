#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Val, Vec,
    IntoVal, Symbol, log,
};

#[derive(Clone, Copy, Debug, PartialEq)]
#[contracttype]
pub enum MilestoneStatus {
    Pending = 0,
    PayoutRequested = 1,
    Approved = 2,
    Paid = 3,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount_pct: u32, // Percentage of the goal, e.g., 20 for 20%
    pub status: MilestoneStatus,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct MilestoneVoteState {
    pub approvals: i128,
    pub rejections: i128,
    pub voting_end_ledger: u32,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub enum DataKey {
    Founder,
    Token,
    FundingGoal,
    Deadline, // Ledger number when funding phase ends
    Milestones,
    Pledges(Address),
    TotalPledged,
    IsClosed, // Campaign ended (success or failed)
    MilestoneVotes(u32), // MilestoneVoteState
    VoterCasted(u32, Address), // bool (true = approved, false = rejected)
    RefundVotes(Address), // bool
    TotalRefundVotes,
    RefundActive, // Is refund approved?
}

// TTL limits for storage management
const LEDGER_THRESHOLD: u32 = 1000;
const LEDGER_EXTEND_TO: u32 = 10000;

fn extend_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(LEDGER_THRESHOLD, LEDGER_EXTEND_TO);
}

fn extend_persistent_ttl<K: IntoVal<Env, Val>>(env: &Env, key: &K) {
    env.storage().persistent().extend_ttl(key, LEDGER_THRESHOLD, LEDGER_EXTEND_TO);
}

#[contract]
pub struct ProjectCampaign;

#[contractimpl]
impl ProjectCampaign {
    /// Initialize the campaign contract
    pub fn init(
        env: Env,
        founder: Address,
        token: Address,
        funding_goal: i128,
        deadline: u32,
        milestones: Vec<Milestone>,
    ) {
        if env.storage().instance().has(&DataKey::Founder) {
            panic!("Campaign already initialized");
        }

        // Validate milestones total 100%
        let mut total_pct: u32 = 0;
        for i in 0..milestones.len() {
            let milestone = milestones.get(i).unwrap();
            total_pct += milestone.amount_pct;
        }
        if total_pct != 100 {
            panic!("Milestone percentages must total exactly 100%");
        }

        env.storage().instance().set(&DataKey::Founder, &founder);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::FundingGoal, &funding_goal);
        env.storage().instance().set(&DataKey::Deadline, &deadline);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        env.storage().instance().set(&DataKey::TotalPledged, &0i128);
        env.storage().instance().set(&DataKey::IsClosed, &false);
        env.storage().instance().set(&DataKey::TotalRefundVotes, &0i128);
        env.storage().instance().set(&DataKey::RefundActive, &false);

        extend_instance_ttl(&env);
    }

    /// Pledge tokens to the campaign
    pub fn pledge(env: Env, investor: Address, amount: i128) {
        investor.require_auth();

        if amount <= 0 {
            panic!("Amount must be greater than zero");
        }

        extend_instance_ttl(&env);

        let is_closed: bool = env.storage().instance().get(&DataKey::IsClosed).unwrap_or(false);
        if is_closed {
            panic!("Campaign has closed");
        }

        let deadline: u32 = env.storage().instance().get(&DataKey::Deadline).unwrap();
        if env.ledger().sequence() > deadline {
            panic!("Campaign deadline has passed");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = soroban_sdk::token::Client::new(&env, &token_addr);

        // Transfer funds from investor to contract escrow
        token_client.transfer(&investor, &env.current_contract_address(), &amount);

        // Record pledge details
        let pledge_key = DataKey::Pledges(investor.clone());
        let current_pledge: i128 = env.storage().persistent().get(&pledge_key).unwrap_or(0i128);
        let new_pledge = current_pledge + amount;
        env.storage().persistent().set(&pledge_key, &new_pledge);
        extend_persistent_ttl(&env, &pledge_key);

        let current_total: i128 = env.storage().instance().get(&DataKey::TotalPledged).unwrap_or(0);
        let new_total = current_total + amount;
        env.storage().instance().set(&DataKey::TotalPledged, &new_total);

        // Emit pledge event
        env.events().publish(
            (symbol_short!("pledge"), investor, amount),
            new_total,
        );
    }

    /// Withdraw pledge if campaign failed to hit goal by the deadline
    pub fn withdraw(env: Env, investor: Address) {
        investor.require_auth();
        extend_instance_ttl(&env);

        let pledge_key = DataKey::Pledges(investor.clone());
        let amount: i128 = env.storage().persistent().get(&pledge_key).unwrap_or(0i128);
        if amount <= 0 {
            panic!("No active pledge to withdraw");
        }

        let deadline: u32 = env.storage().instance().get(&DataKey::Deadline).unwrap();
        if env.ledger().sequence() <= deadline {
            panic!("Deadline has not passed yet");
        }

        let total_pledged: i128 = env.storage().instance().get(&DataKey::TotalPledged).unwrap();
        let funding_goal: i128 = env.storage().instance().get(&DataKey::FundingGoal).unwrap();

        if total_pledged >= funding_goal {
            panic!("Campaign succeeded; funds are escrowed for milestones");
        }

        // Return tokens
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = soroban_sdk::token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &investor, &amount);

        // Clear pledge
        env.storage().persistent().remove(&pledge_key);

        let current_total: i128 = env.storage().instance().get(&DataKey::TotalPledged).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalPledged, &(current_total - amount));

        env.events().publish(
            (symbol_short!("withdraw"), investor, amount),
            Symbol::new(&env, "campaign_failed"),
        );
    }

    /// Request a milestone payout. Only founder can request.
    pub fn request_milestone_payout(env: Env, milestone_id: u32) {
        let founder: Address = env.storage().instance().get(&DataKey::Founder).unwrap();
        founder.require_auth();
        extend_instance_ttl(&env);

        let total_pledged: i128 = env.storage().instance().get(&DataKey::TotalPledged).unwrap();
        let funding_goal: i128 = env.storage().instance().get(&DataKey::FundingGoal).unwrap();
        if total_pledged < funding_goal {
            panic!("Campaign did not succeed; cannot request milestone payout");
        }

        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut found = false;
        let mut updated_milestones = Vec::new(&env);

        for i in 0..milestones.len() {
            let mut milestone = milestones.get(i).unwrap();
            if milestone.id == milestone_id {
                if milestone.status != MilestoneStatus::Pending {
                    panic!("Milestone is not pending payout request");
                }
                milestone.status = MilestoneStatus::PayoutRequested;
                found = true;
            }
            updated_milestones.push_back(milestone);
        }

        if !found {
            panic!("Milestone ID not found");
        }

        env.storage().instance().set(&DataKey::Milestones, &updated_milestones);

        // Start voting: 10000 ledgers voting duration (~14 hours at 5s/ledger)
        let voting_end = env.ledger().sequence() + 10000;
        let vote_state = MilestoneVoteState {
            approvals: 0,
            rejections: 0,
            voting_end_ledger: voting_end,
        };
        let vote_key = DataKey::MilestoneVotes(milestone_id);
        env.storage().persistent().set(&vote_key, &vote_state);
        extend_persistent_ttl(&env, &vote_key);

        env.events().publish(
            (Symbol::new(&env, "milestone_requested"), milestone_id),
            voting_end,
        );
    }

    /// Vote on a requested milestone payout. Investor votes are weighted by pledge amount.
    pub fn vote_on_milestone(env: Env, investor: Address, milestone_id: u32, approve: bool) {
        investor.require_auth();
        extend_instance_ttl(&env);

        let pledge_key = DataKey::Pledges(investor.clone());
        let pledge_weight: i128 = env.storage().persistent().get(&pledge_key).unwrap_or(0i128);
        if pledge_weight <= 0 {
            panic!("Only investors with positive pledge weights can vote");
        }

        let vote_key = DataKey::MilestoneVotes(milestone_id);
        if !env.storage().persistent().has(&vote_key) {
            panic!("No active voting for this milestone");
        }
        let mut vote_state: MilestoneVoteState = env.storage().persistent().get(&vote_key).unwrap();

        if env.ledger().sequence() > vote_state.voting_end_ledger {
            panic!("Voting period has expired");
        }

        let casted_key = DataKey::VoterCasted(milestone_id, investor.clone());
        let already_voted = env.storage().persistent().has(&casted_key);

        if already_voted {
            let previous_vote: bool = env.storage().persistent().get(&casted_key).unwrap();
            if previous_vote == approve {
                return; // Vote remains unchanged, do nothing
            }
            // Swap vote weight
            if approve {
                vote_state.approvals += pledge_weight;
                vote_state.rejections -= pledge_weight;
            } else {
                vote_state.rejections += pledge_weight;
                vote_state.approvals -= pledge_weight;
            }
        } else {
            // New vote
            if approve {
                vote_state.approvals += pledge_weight;
            } else {
                vote_state.rejections += pledge_weight;
            }
        }

        env.storage().persistent().set(&vote_key, &vote_state);
        extend_persistent_ttl(&env, &vote_key);

        env.storage().persistent().set(&casted_key, &approve);
        extend_persistent_ttl(&env, &casted_key);

        env.events().publish(
            (Symbol::new(&env, "milestone_voted"), milestone_id, investor),
            (approve, pledge_weight),
        );
    }

    /// Claim milestone payout. Only founder can claim.
    pub fn claim_milestone_payout(env: Env, milestone_id: u32) {
        let founder: Address = env.storage().instance().get(&DataKey::Founder).unwrap();
        founder.require_auth();
        extend_instance_ttl(&env);

        let vote_key = DataKey::MilestoneVotes(milestone_id);
        if !env.storage().persistent().has(&vote_key) {
            panic!("No voting record for this milestone");
        }
        let vote_state: MilestoneVoteState = env.storage().persistent().get(&vote_key).unwrap();

        // Must have passed threshold or voting deadline expired
        let total_pledged: i128 = env.storage().instance().get(&DataKey::TotalPledged).unwrap();
        let pass_threshold = total_pledged / 2; // >50% approval weight

        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let mut milestone_index = 9999u32;
        let mut milestone_pct = 0u32;

        for i in 0..milestones.len() {
            let m = milestones.get(i).unwrap();
            if m.id == milestone_id {
                if m.status != MilestoneStatus::PayoutRequested {
                    panic!("Milestone is not in payout-requested state");
                }
                milestone_index = i;
                milestone_pct = m.amount_pct;
                break;
            }
        }

        if milestone_index == 9999 {
            panic!("Milestone not found");
        }

        // Evaluate vote
        if vote_state.approvals <= pass_threshold {
            // Check if deadline passed
            if env.ledger().sequence() <= vote_state.voting_end_ledger {
                panic!("Voting still active and approval weight is not yet > 50%");
            } else {
                panic!("Milestone vote failed (deadline passed without > 50% approvals)");
            }
        }

        // Mark approved & paid
        let mut updated_milestones = Vec::new(&env);
        for i in 0..milestones.len() {
            let mut m = milestones.get(i).unwrap();
            if m.id == milestone_id {
                m.status = MilestoneStatus::Paid;
            }
            updated_milestones.push_back(m);
        }
        env.storage().instance().set(&DataKey::Milestones, &updated_milestones);

        // Disburse funds: calculated as (total pledged * milestone percentage) / 100
        let payout_amount = (total_pledged * milestone_pct as i128) / 100;
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = soroban_sdk::token::Client::new(&env, &token_addr);

        token_client.transfer(&env.current_contract_address(), &founder, &payout_amount);

        // Remove voting data to clean up storage
        env.storage().persistent().remove(&vote_key);

        env.events().publish(
            (Symbol::new(&env, "milestone_paid"), milestone_id),
            payout_amount,
        );
    }

    /// Vote to trigger platform-wide refund (if founder defaults).
    pub fn vote_on_refund(env: Env, investor: Address, approve: bool) {
        investor.require_auth();
        extend_instance_ttl(&env);

        let pledge_key = DataKey::Pledges(investor.clone());
        let pledge_weight: i128 = env.storage().persistent().get(&pledge_key).unwrap_or(0i128);
        if pledge_weight <= 0 {
            panic!("Only investors with positive pledge weights can vote for a refund");
        }

        let refund_vote_key = DataKey::RefundVotes(investor.clone());
        let has_voted = env.storage().persistent().has(&refund_vote_key);

        let mut current_refund_votes: i128 = env.storage().instance().get(&DataKey::TotalRefundVotes).unwrap_or(0);

        if has_voted {
            let prev_vote: bool = env.storage().persistent().get(&refund_vote_key).unwrap();
            if prev_vote == approve {
                return;
            }
            if approve {
                current_refund_votes += pledge_weight;
            } else {
                current_refund_votes -= pledge_weight;
            }
        } else {
            if approve {
                current_refund_votes += pledge_weight;
            }
        }

        env.storage().persistent().set(&refund_vote_key, &approve);
        extend_persistent_ttl(&env, &refund_vote_key);

        env.storage().instance().set(&DataKey::TotalRefundVotes, &current_refund_votes);

        // Check if refund is approved (>50% of the total funds raised)
        let total_pledged: i128 = env.storage().instance().get(&DataKey::TotalPledged).unwrap();
        if current_refund_votes > (total_pledged / 2) {
            env.storage().instance().set(&DataKey::RefundActive, &true);
            env.storage().instance().set(&DataKey::IsClosed, &true);
            env.events().publish(
                (symbol_short!("refund"),),
                Symbol::new(&env, "refund_activated"),
            );
        } else {
            env.events().publish(
                (symbol_short!("refund"), investor),
                (approve, pledge_weight),
            );
        }
    }

    /// Claim refund of remaining escrowed funds. Available only if refund is active.
    pub fn claim_refund(env: Env, investor: Address) {
        investor.require_auth();
        extend_instance_ttl(&env);

        let refund_active: bool = env.storage().instance().get(&DataKey::RefundActive).unwrap_or(false);
        if !refund_active {
            panic!("Refund is not active");
        }

        let pledge_key = DataKey::Pledges(investor.clone());
        let pledge_amount: i128 = env.storage().persistent().get(&pledge_key).unwrap_or(0i128);
        if pledge_amount <= 0 {
            panic!("No pledge amount available for refund");
        }

        let total_pledged: i128 = env.storage().instance().get(&DataKey::TotalPledged).unwrap();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = soroban_sdk::token::Client::new(&env, &token_addr);

        // Query the remaining balance of the contract escrow
        let contract_balance = token_client.balance(&env.current_contract_address());

        // Refund is proportional: (investor_pledge / total_pledged) * remaining_escrow_balance
        let refund_share = (pledge_amount * contract_balance) / total_pledged;

        // Clear pledge to prevent double spend
        env.storage().persistent().remove(&pledge_key);

        // Deduct from TotalPledged to ensure subsequent calculations use the correct remaining pool weight
        env.storage().instance().set(&DataKey::TotalPledged, &(total_pledged - pledge_amount));

        if refund_share > 0 {
            token_client.transfer(&env.current_contract_address(), &investor, &refund_share);
        }

        env.events().publish(
            (symbol_short!("refund_cl"), investor),
            refund_share,
        );
    }

    /// Read-only utilities for frontend state fetching
    pub fn get_campaign_info(env: Env) -> (Address, Address, i128, u32, i128, bool, bool) {
        extend_instance_ttl(&env);
        let founder: Address = env.storage().instance().get(&DataKey::Founder).unwrap();
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let goal: i128 = env.storage().instance().get(&DataKey::FundingGoal).unwrap();
        let deadline: u32 = env.storage().instance().get(&DataKey::Deadline).unwrap();
        let total_pledged: i128 = env.storage().instance().get(&DataKey::TotalPledged).unwrap();
        let is_closed: bool = env.storage().instance().get(&DataKey::IsClosed).unwrap_or(false);
        let refund_active: bool = env.storage().instance().get(&DataKey::RefundActive).unwrap_or(false);

        (founder, token, goal, deadline, total_pledged, is_closed, refund_active)
    }

    pub fn get_milestones(env: Env) -> Vec<Milestone> {
        extend_instance_ttl(&env);
        env.storage().instance().get(&DataKey::Milestones).unwrap_or(Vec::new(&env))
    }

    pub fn get_pledge(env: Env, investor: Address) -> i128 {
        extend_instance_ttl(&env);
        let key = DataKey::Pledges(investor);
        env.storage().persistent().get(&key).unwrap_or(0i128)
    }

    pub fn get_milestone_vote(env: Env, milestone_id: u32) -> (i128, i128, u32) {
        extend_instance_ttl(&env);
        let vote_key = DataKey::MilestoneVotes(milestone_id);
        if env.storage().persistent().has(&vote_key) {
            let state: MilestoneVoteState = env.storage().persistent().get(&vote_key).unwrap();
            (state.approvals, state.rejections, state.voting_end_ledger)
        } else {
            (0, 0, 0)
        }
    }
}

#[cfg(test)]
mod test;

