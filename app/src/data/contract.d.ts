import {ethers} from "ethers";

export type address = string;

type ContractFilter<T> = T | Array<T> | null;

class OwnedContract extends ethers.Contract {
    readonly async getOwner(): Promise<ethers.providers.TransactionResponse>;

    async setOwner(newOwner: address): Promise<ethers.providers.TransactionResponse>;
}

class RefundableContract extends OwnedContract {
    readonly async isRefundWhitelisted(addr: address): Promise<boolean>;

    async setRefundWhitelisted(addr: address, value: boolean): Promise<ethers.providers.TransactionResponse>;

    readonly async getBaseGasRefund(): Promise<ethers.providers.TransactionResponse>;
}

class BettingContract extends RefundableContract {
    filters: {
        BetCreated(bet_id: ContractFilter<bigint>, initiator: ContractFilter<address>, target: ContractFilter<address>, bet_amount: ContractFilter<bigint>): ethers.EventFilter;
        BetUpdated(bet_id: ContractFilter<bigint>): ethers.EventFilter;
    }

    async make_bet(bet_text: string, bet_amount: bigint, target: address): Promise<ethers.providers.TransactionResponse>;

    async accept_bet(bet_id: bigint): Promise<ethers.providers.TransactionResponse>;

    async reject_bet(bet_id: bigint): Promise<ethers.providers.TransactionResponse>;

    async vote(bet_id: bigint, vote_choice: BetVote): Promise<ethers.providers.TransactionResponse>;

    readonly async get_bet_details(bet_id: bigint): Promise<Bet>;
}

interface BetCreatedEvent extends ethers.Event {
    args: Result & {
        bet_id: bigint,
        bet_text: string,
        initiator: address,
        target: address,
        bet_amount: bigint
    }
}

class ERC20Contract extends ethers.Contract {
    readonly async name(): Promise<string>;

    readonly async symbol(): Promise<string>;

    readonly async decimals(): Promise<bigint>;

    readonly async totalSupply(): Promise<bigint>;

    readonly async balanceOf(account: address): Promise<bigint>;

    readonly async allowance(owner: address, spender: address): Promise<bigint>;

    async transfer(recipient: address, amount: bigint): Promise<boolean>;

    async approve(spender: address, amount: bigint): Promise<ethers.providers.TransactionResponse>;

    async transferFrom(sender: address, recipient: address, amount: bigint): Promise<boolean>;

    filters: {
        Transfer(from: ContractFilter<address>, to: ContractFilter<address>, value: ContractFilter<bigint>): Promise<Array<object>>;
        Approval(owner: ContractFilter<address>, spender: ContractFilter<address>, value: ContractFilter<bigint>): Promise<Array<object>>;
    }
}