import {address, BetCreatedEvent} from "../../data/contract";
import {useCallback, useEffect, useState} from "react";
import {getBetInformation, listenToBetChanges, WalletInformation} from "../../data/wallet";
import {ethers} from "ethers";
import {relativeTimeFromDates} from "../../utils/DateTimeFormatter";
import {trimHash} from "../../utils/WalletDisplay";
import styles from './BetDetails.module.css'
import {GradientText} from "../GradientText/GradientText";
import {StyledButton} from "../StyledButton/StyledButton";
import {Bet, BetState, BetVote} from "../../data/bet";
import {PolyscanLink} from "../PolyscanLink/PolyscanLink";

export interface BetDetailsProps {
    bet: BetCreatedEvent,
    walletInfo: WalletInformation,
}

const is_participant_in_bet = (bet: Bet, addr: address) => {
    return bet.initiator === addr || bet.participant === addr;
}

const state_to_human_readable = (state: BetState, bet: Bet, addr: address) => {
    if (state === BetState.CREATED) {
        return "waiting for party to accept";
    } else if (state === BetState.REFUNDED) {
        return "the bet has been refunded";
    } else if (state === BetState.BURNED) {
        return "the bet has been burned";
    } else if (state === BetState.CANCELED) {
        return "the bet has been canceled";
    } else if (state === BetState.RESOLVED_INITIATOR_WINS || state === BetState.RESOLVED_PARTICIPANT_WINS) {
        if (is_participant_in_bet(bet, addr)) {
            if (bet.initiator === addr && state === BetState.RESOLVED_INITIATOR_WINS) {
                return "you have won the bet";
            } else {
                return "you have lost the bet";
            }
        } else {
            if (state === BetState.RESOLVED_PARTICIPANT_WINS) {
                return "the participant has won the bet";
            } else {
                return "the initiator has won the bet";
            }
        }
    } else if (state === BetState.STARTED) {
        return "the bet is in progress";
    } else if (state === BetState.NOT_CREATED) {
        return "smart contract execution is pending";
    } else {
        return "unknown state";
    }
}

export function BetDetails(props: BetDetailsProps) {
    const [betInfo, setBetInfo] = useState<Bet>();
    const [error, setError] = useState<Error>();
    const [transactionPending, setTransactionPending] = useState<string | undefined>(undefined);
    const [betBlock, setBetBlock] = useState<ethers.providers.Block>();

    const {provider, tokenDetails, walletAddress, connectedBettingContract} = props.walletInfo;

    useEffect(() => {
        if (!betInfo) {
            getBetInformation(props.walletInfo, props.bet.args.bet_id).then(setBetInfo).catch(setError);
            props.bet.getBlock().then(setBetBlock).catch(setError);
        }
    }, [props, betInfo, provider]);

    const refetchBets = useCallback(() => {
        getBetInformation(props.walletInfo, props.bet.args.bet_id).then(setBetInfo).catch(setError);
    }, [props.bet.args.bet_id, setBetInfo, setError, props.walletInfo])

    useEffect(() => {
        return listenToBetChanges(props.walletInfo, props.bet.args.bet_id, refetchBets);
    }, [props.walletInfo, props.bet.args.bet_id, refetchBets]);

    const afterTransaction = useCallback((e: ethers.providers.TransactionResponse) => {
        setTransactionPending(e.hash);
        e.wait(10).then(() => {
            refetchBets();
            setTransactionPending(undefined);
        });
    }, [refetchBets]);

    const acceptBet = useCallback(() => {
        connectedBettingContract.accept_bet(props.bet.args.bet_id)
            .then(afterTransaction)
            .catch(setError);
    }, [afterTransaction, connectedBettingContract, props.bet]);

    const rejectBet = useCallback(() => {
        connectedBettingContract.reject_bet(props.bet.args.bet_id)
            .then(afterTransaction)
            .catch(setError);
    }, [afterTransaction, connectedBettingContract, props.bet]);

    const voteClear = useCallback(() => {
        connectedBettingContract.vote(props.bet.args.bet_id, BetVote.NONE)
            .then(afterTransaction)
            .catch(setError);
    }, [afterTransaction, connectedBettingContract, props.bet]);

    const voteBurn = useCallback(() => {
        connectedBettingContract.vote(props.bet.args.bet_id, BetVote.BURN)
            .then(afterTransaction)
            .catch(setError);
    }, [afterTransaction, connectedBettingContract, props.bet]);

    const voteCancel = useCallback(() => {
        connectedBettingContract.vote(props.bet.args.bet_id, BetVote.CANCEL)
            .then(afterTransaction)
            .catch(setError);
    }, [afterTransaction, connectedBettingContract, props.bet]);

    const voteDefeat = useCallback(() => {
        if (!betInfo?.initiator) return;
        connectedBettingContract.vote(props.bet.args.bet_id,
            BetVote.ADMIT_DEFEAT)
            .then(afterTransaction)
            .catch(setError);
    }, [afterTransaction, connectedBettingContract, props.bet, betInfo]);

    const [relativeDateDifference, setRelativeDateDifference] = useState<string>('');

    useEffect(() => {
        const interval = setInterval(() => {
            if (betBlock) {
                setRelativeDateDifference(relativeTimeFromDates(new Date(betBlock.timestamp * 1000)));
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        }
    }, [betBlock, setRelativeDateDifference]);

    if (error && (!betInfo || !betBlock)) {
        return (<div>Failed to load bet details: {error.message}</div>);
    }

    if (!betInfo || !betBlock) {
        return (<div>Loading Bet Details</div>)
    }

    const [userVote, opponentVote] = walletAddress === betInfo.initiator ?
        ([betInfo.initiator_vote, betInfo.participant_vote]) :
        ([betInfo.participant_vote, betInfo.initiator_vote]);

    const clearVotes = (userVote === BetVote.NONE ? 1 : 0) + (opponentVote === BetVote.NONE ? 1 : 0);
    const burnVotes = (userVote === BetVote.BURN ? 1 : 0) + (opponentVote === BetVote.BURN ? 1 : 0);
    const cancelVotes = (userVote === BetVote.CANCEL ? 1 : 0) + (opponentVote === BetVote.CANCEL ? 1 : 0);

    let actions = <></>;

    if (betInfo.state === BetState.STARTED) {
        actions = (
            <>
                <StyledButton disabled={userVote === BetVote.NONE} onClick={voteClear}>
                    Clear Vote {clearVotes > 0 ? `(${clearVotes})` : ''}
                </StyledButton>

                <StyledButton theme='danger' disabled={userVote === BetVote.BURN} onClick={voteBurn}>
                    Vote to Burn {burnVotes > 0 ? `(${burnVotes})` : ''}
                </StyledButton>

                <StyledButton disabled={userVote === BetVote.CANCEL} onClick={voteCancel}>
                    Vote to Refund {cancelVotes > 0 ? `(${cancelVotes})` : ''}
                </StyledButton>

                <StyledButton onClick={voteDefeat}>Admit Defeat</StyledButton>
            </>
        );
    } else if (betInfo.state === BetState.CREATED) {
        if (betInfo.initiator === walletAddress) {
            actions = (
                <>
                    <StyledButton onClick={voteDefeat}>Admit Defeat</StyledButton>
                    <StyledButton theme='danger' onClick={rejectBet}> Cancel Bet </StyledButton>
                </>
            );
        } else if (betInfo.participant === walletAddress) {
            actions = (
                <>
                    <StyledButton onClick={acceptBet}> Accept Bet </StyledButton>
                    <StyledButton theme='danger' onClick={rejectBet}> Reject Bet </StyledButton>
                </>
            );
        }
    }

    return (
        <div className={styles.container}>
            {error ? (
                <div className={styles.alert}>
                    {JSON.stringify(error)}
                    <span className={styles.alert_close} onClick={() => setError(undefined)}>X</span>
                </div>
            ) : ""}
            {transactionPending ? (
                <div className={styles.alert}>
                    Transaction with hash <PolyscanLink type="transaction" value={transactionPending}/> is currently
                    pending.
                    <span className={styles.alert_close} onClick={() => setError(undefined)}>X</span>
                </div>
            ) : ""}

            <div className={styles.timestamp}>
                {relativeDateDifference}
            </div>

            <div className={styles.bet_name}>
                {betInfo.name} <small>({props.bet.args.bet_id.toString()})</small>
            </div>

            <div className={styles.amount}>
                {ethers.utils.formatUnits(betInfo.bet_amount, tokenDetails.decimals)}
                &nbsp;
                <GradientText><span className={styles.token_symbol}>{tokenDetails.symbol}</span></GradientText>
            </div>

            <div className={styles.addresses}>
                {trimHash(betInfo.initiator)} challenged {trimHash(betInfo.participant)}
            </div>

            <div className={styles.view_on_polyscan}>
                <small><i>{state_to_human_readable(betInfo.state, betInfo, walletAddress)}</i></small>
                {/*<a href={'https://mumbai.polygonscan.com/tx/' + props.bet.transactionHash}>View on polygonscan</a>*/}
            </div>

            <div className={styles.actions}>
                {actions}
            </div>
        </div>
    )
}