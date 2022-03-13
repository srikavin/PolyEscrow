import {address} from "./contract";

export enum BetState {
    NOT_CREATED,
    CREATED,
    STARTED,
    RESOLVED_INITIATOR_WINS,
    RESOLVED_PARTICIPANT_WINS,
    CANCELED,
    REFUNDED,
    BURNED
}

export enum BetVote {
    NONE,
    CANCEL,
    ADMIT_DEFEAT,
    BURN
}

export interface Bet {
    state: BetState;
    name: string;
    bet_amount: bigint;

    initiator: address;
    participant: address;

    initiator_paid: boolean;
    participant_paid: boolean;

    initiator_vote: BetVote;
    participant_vote: BetVote;
}