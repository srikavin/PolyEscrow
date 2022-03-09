import {WalletInformation} from "../../data/wallet";
import {useCallback, useState} from "react";
import {StyledButton} from "../StyledButton/StyledButton";
import {ethers} from "ethers";

export type MakeBetProps = {
    walletInformation: WalletInformation
}

export function MakeBet(props: MakeBetProps) {
    const {walletInformation} = props;

    const {tokenDetails} = walletInformation;

    const [error, setError] = useState<Error | string>();

    const [targetAddress, setTargetAddress] = useState('');
    const [betReason, setBetReason] = useState('');
    const [betAmount, setBetAmount] = useState(0);

    const submitBet = useCallback(() => {
        walletInformation.bettingContract.make_bet(betReason, BigInt(betAmount), targetAddress)
            .then((r) => {
                setError('successful: ' + r.hash);
                console.log(r);
            })
            .catch((error) => {
                setError(error);
                console.log(error);
            });
    }, [walletInformation, targetAddress, betReason, betAmount]);

    return (
        <div>
            {error ? (
                <div>{error.toString()}</div>
            ) : null}
            Challengee Wallet Address:&nbsp;
            <input type='text' value={targetAddress} onChange={(e) => setTargetAddress(e.target.value)}/>
            <br/>

            Bet Reason:&nbsp;
            <input type='text' value={betReason} onChange={(e) => setBetReason(e.target.value)}/>

            <br/>
            Bet Amount: ({walletInformation.tokenDetails.symbol}) &nbsp; <input type='number' value={betAmount}
            /*@ts-ignore */
                                                                                onChange={(e) => setBetAmount(e.target.value)}/>

            <br/>

            {ethers.utils.formatUnits(betAmount, tokenDetails.decimals).toString()} {tokenDetails.symbol}

            <br/>

            <StyledButton onClick={submitBet}>Submit Bet</StyledButton>
        </div>
    )
}