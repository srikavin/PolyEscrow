// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./IERC20.sol";

contract PolyDogeBetting {
    IERC20 public token;

    constructor(address underlying_token) {
        token = IERC20(underlying_token);
    }

    enum BetState {
        NOT_CREATED,
        CREATED,
        STARTED,
        RESOLVED,
        CANCELED,
        REFUNDED,
        BURNED
    }

    enum BetVote {
        NONE,
        CANCEL,
        INITIATOR_WINS,
        PARTICIPANT_WINS,
        BURN
    }

    struct Bet {
        BetState state;
        string name;
        uint bet_amount;

        address initiator;
        address participant;

        bool initiator_paid;
        bool participant_paid;

        BetVote initiator_vote;
        BetVote participant_vote;
    }

    event BetCreated(uint indexed bet_id, string bet_text, address indexed initiator, address indexed target, uint bet_amount);
    event BetStarted(uint indexed bet_id, address indexed intiator, address indexed participant, uint bet_amount);
    event BetRejected(uint indexed bet_id);
    event BetResolved(uint indexed bet_id, address indexed winner);
    event BetVoted(uint indexed bet_id, address indexed voter, BetVote vote);
    event BetRefunded(uint indexed bet_id);

    uint bet_index;
    mapping(uint => Bet) bets;

    modifier IsBetInitiator(uint bet_id) {
        require(msg.sender == bets[bet_id].initiator, "Must be bet initiator.");
        _;
    }

    modifier IsBetTarget(uint bet_id) {
        require(msg.sender == bets[bet_id].participant, "Must be bet target.");
        _;
    }

    modifier IsBetParticipant(uint bet_id) {
        require(msg.sender == bets[bet_id].initiator || msg.sender == bets[bet_id].participant, "Must be part of the bet.");
        _;
    }


    function make_bet(string calldata bet_text, uint bet_amount, address target) public payable returns (uint) {
        require(bet_amount > 0, "Bet must be atleast 1 token");
        require(msg.sender != target, "Can't make a bet with yourself");

        // amount of underlying token sent
        uint allowance = token.allowance(msg.sender, address(this));
        require(allowance > bet_amount, "Token allowance must be greater than bet amount");

        require(token.transferFrom(msg.sender, address(this), bet_amount), "Transfer failed");

        uint bet_id = bet_index++;
        bets[bet_id] = Bet({
            state : BetState.CREATED,
            name : bet_text,
            bet_amount : bet_amount,
            initiator : msg.sender,
            participant : target,
            initiator_paid : true,
            participant_paid : false,
            initiator_vote : BetVote.NONE,
            participant_vote : BetVote.NONE
        });

        emit BetCreated(bet_id, bet_text, msg.sender, target, bet_amount);

        return bet_id;
    }

    function accept_bet(uint bet_id) public IsBetTarget(bet_id) payable {
        Bet storage bet = bets[bet_id];

        require(bet.state == BetState.CREATED, "Bet must be in CREATED state");

        uint bet_amount = bet.bet_amount;

        uint allowance = token.allowance(msg.sender, address(this));
        require(allowance > bet_amount, "Token allowance must be greater than bet amount");

        require(token.transferFrom(msg.sender, address(this), bet_amount), "Transfer failed");

        bet.participant_paid = true;
        bet.state = BetState.STARTED;

        assert(bet.participant_paid && bet.initiator_paid);

        emit BetStarted(bet_id, bet.initiator, bet.participant, bet.bet_amount);
    }

    function refund(uint bet_id) internal {
        Bet storage bet = bets[bet_id];

        require(bet.state != BetState.REFUNDED, "Bets has already been refunded");

        if (bet.initiator_paid) {
            require(token.transfer(bet.initiator, bet.bet_amount), "Initiator refund failed");
        }

        if (bet.participant_paid) {
            require(token.transfer(bet.participant, bet.bet_amount), "Participant refund failed");
        }

        bet.state = BetState.REFUNDED;

        emit BetRefunded(bet_id);
    }

    function reject_bet(uint bet_id) public IsBetParticipant(bet_id) {
        require(bets[bet_id].state == BetState.CREATED, "Bets can only be canceled in the CREATED state");

        refund(bet_id);

        emit BetRejected(bet_id);
    }

    function vote(uint bet_id, BetVote vote_choice) public IsBetParticipant(bet_id) {
        Bet storage bet = bets[bet_id];

        require(bet.state == BetState.STARTED, "Bets can only be voted for in the STARTED state");
        require(vote_choice >= BetVote.NONE && vote_choice <= BetVote.BURN);

        emit BetVoted(bet_id, msg.sender, vote_choice);

        if (msg.sender == bet.initiator) {
            if (vote_choice == BetVote.PARTICIPANT_WINS) {
                require(token.transfer(bet.participant, bet.bet_amount * 2), "Win transfer failed");
                bet.state = BetState.RESOLVED;
                return;
            }

            bet.initiator_vote = vote_choice;
        } else if (msg.sender == bet.participant) {
            if (vote_choice == BetVote.INITIATOR_WINS) {
                require(token.transfer(bet.initiator, bet.bet_amount * 2), "Win transfer failed");
                bet.state = BetState.RESOLVED;
                return;
            }

            bet.participant_vote = vote_choice;
        } else {
            assert(false);
        }

        if (bet.participant_vote == bet.initiator_vote) {
            BetVote consensus = bet.participant_vote;
            assert(consensus == bet.initiator_vote);

            if (consensus == BetVote.NONE) {
                return;
            } else if (consensus == BetVote.CANCEL) {
                refund(bet_id);
            } else if (consensus == BetVote.BURN) {
                bet.state = BetState.BURNED;
            }
        }
    }

    function get_bet_details(uint bet_id) public view returns (Bet memory) {
        return bets[bet_id];
    }
}