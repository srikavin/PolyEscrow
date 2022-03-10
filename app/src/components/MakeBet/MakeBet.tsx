import {WalletInformation} from "../../data/wallet";
import {useCallback, useState} from "react";
import {StyledButton} from "../StyledButton/StyledButton";
import {ethers} from "ethers";

export type MakeBetProps = {
    walletInformation: WalletInformation,
    transactionCallback: () => void
}

export function MakeBet(props: MakeBetProps) {
    const {walletInformation, transactionCallback} = props;

    const {tokenDetails} = walletInformation;

    const [error, setError] = useState<Error | string>();
    const [targetAddress, setTargetAddress] = useState('');
    const [betReason, setBetReason] = useState('');
    const [inputBetAmount, setInputBetAmount] = useState(0);

    const betAmount = BigInt(inputBetAmount * 10 ** tokenDetails.decimals);

    const submitBet = useCallback(() => {
        console.log(betAmount);
        walletInformation.connectedBettingContract.make_bet(betReason, betAmount, targetAddress)
            .then((r) => {
                console.log(r);
                setError('Executed transaction: ' + r.hash);
                r.wait(5).then(transactionCallback);
            }).catch((error) => {
            setError(error.message);
            console.log(error);
        });
    }, [walletInformation, targetAddress, betReason, betAmount, transactionCallback]);

    let formattedUnits = 'invalid input';
    try {
        formattedUnits = `${ethers.utils.formatUnits(betAmount, tokenDetails.decimals).toString()} ${tokenDetails.symbol}`;
    } catch {
    }

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
            Bet Amount: ({walletInformation.tokenDetails.symbol}) &nbsp;
            <input type='number' min={0} value={inputBetAmount}
                   onChange={(e) => setInputBetAmount(Number(e.target.value))}/>

            <br/>

            {formattedUnits}

            <br/>

            <StyledButton onClick={submitBet}>Submit Bet</StyledButton>
        </div>
    )
}