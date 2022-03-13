import {WalletInformation} from "../../data/wallet";
import {useCallback, useState} from "react";
import {StyledButton} from "../StyledButton/StyledButton";
import {ethers} from "ethers";
import styles from "./MakeBet.module.css"
import {Alert} from "../Alert/Alert";
import {BigNumberInput} from "big-number-input";
import {PolyscanLink} from "../PolyscanLink/PolyscanLink";

export type MakeBetProps = {
    walletInformation: WalletInformation,
    transactionCallback: () => void
}

export function MakeBet(props: MakeBetProps) {
    const {walletInformation, transactionCallback} = props;

    const {tokenDetails} = walletInformation;

    const [error, setError] = useState<any | undefined>();
    const [transactionHash, setTransactionHash] = useState<string | undefined>();

    const [targetAddress, setTargetAddress] = useState('');
    const [betReason, setBetReason] = useState('');
    const [inputBetAmount, setInputBetAmount] = useState('0');

    let betAmount = BigInt(0);
    try {
        betAmount = BigInt(inputBetAmount);
    } catch {
    }

    const submitBet = useCallback(() => {
        walletInformation.connectedBettingContract.make_bet(betReason, betAmount, targetAddress)
            .then((r) => {
                setTransactionHash(r.hash);
                r.wait(5).then(() => {
                    setTransactionHash(undefined);
                    transactionCallback();
                });
            })
            .catch((error) => {
                setError(error);
                console.log(error);
            });
    }, [walletInformation, targetAddress, betReason, betAmount, transactionCallback]);


    return (
        <div>
            {error ? (
                <Alert displayed={true} setDisplayed={() => setError(undefined)} theme="danger">
                    <b>Transaction Failed</b>: {error?.data?.message ?? error?.message ?? JSON.stringify(error)}
                </Alert>
            ) : null}

            {transactionHash ? (
                <Alert displayed={true} setDisplayed={() => setTransactionHash(undefined)} theme="success">
                    Transaction with hash <PolyscanLink type="transaction" value={transactionHash}/> is pending.
                </Alert>
            ) : null}

            <span className={styles.label}>Challengee Wallet Address:</span>
            <input className={styles.input} type='text' value={targetAddress}
                   onChange={(e) => setTargetAddress(e.target.value)}/>
            <br/>

            <span className={styles.label}>Bet Reason:</span>
            <input className={styles.input} type='text' value={betReason}
                   onChange={(e) => setBetReason(e.target.value)}/>

            <br/>
            <span className={styles.label}>Bet Amount: ({tokenDetails.symbol})</span>
            <BigNumberInput decimals={tokenDetails.decimals} value={inputBetAmount} onChange={setInputBetAmount}
                            renderInput={(props) => (
                                <input className={styles.input} type='text' value={inputBetAmount} {...props} />
                            )}/>
            <br/>
            <br/>

            <b>You are
                betting {ethers.utils.commify(ethers.utils.formatEther(betAmount.toString()))} {tokenDetails.symbol}.</b>

            <br/>
            <br/>

            <StyledButton onClick={submitBet}>Submit Bet</StyledButton>
        </div>
    )
}