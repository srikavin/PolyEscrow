import {BetCreatedEvent} from "../../data/contract";
import {BetDetails} from "../BetInformation/BetDetails";
import {authorizeERC20Token, getInvolvedBets, listenToInvolvedBetCreations, WalletInformation} from "../../data/wallet";
import {MakeBet} from "../MakeBet/MakeBet";
import {StyledButton} from "../StyledButton/StyledButton";
import {MainContainer} from "../MainContainer/MainContainer";
import {useCallback, useEffect, useState} from "react";
import {ethers} from "ethers";

export type BetsContainerProps = {
    walletInformation: WalletInformation
};

export function BetsContainer(props: BetsContainerProps) {
    const [involvedBets, setInvolvedBets] = useState<Array<BetCreatedEvent>>([]);
    const [error, setError] = useState<Error>();
    const [onRefundList, setOnRefundList] = useState<boolean>(false);
    const [contractBalance, setContractBalance] = useState<bigint>();

    const refetchBets = useCallback(() => {
        getInvolvedBets(props.walletInformation)
            .then(setInvolvedBets)
            .catch((err) => {
                console.error(err);
                setError(err)
            });
    }, [props.walletInformation])

    useEffect(() => {
        refetchBets();
    }, [refetchBets]);

    useEffect(() => {
        return listenToInvolvedBetCreations(props.walletInformation, refetchBets);
    }, [props.walletInformation, refetchBets]);

    useEffect(() => {
        props.walletInformation.bettingContract.isRefundWhitelisted(props.walletInformation.walletAddress)
            .then(setOnRefundList)
            .catch((err) => {
                console.error(err);
                setError(err);
            });

        props.walletInformation.provider.getBalance(props.walletInformation.bettingContract.address)
            .then((val) => setContractBalance(val.toBigInt()))
            .catch(err => {
                console.error(err);
                setError(err);
            });
    }, [props.walletInformation, setOnRefundList]);

    return (
        <>
            {props.walletInformation.authorizedAllowance ? null : (
                <MainContainer>
                    <h2>Authorize access to your {props.walletInformation.tokenDetails.name}</h2>
                    <p>This only needs to be done once.</p>
                    <StyledButton theme='danger'
                                  onClick={() => authorizeERC20Token(props.walletInformation).then(() => window.location.reload())}>
                        Authorize
                    </StyledButton>
                </MainContainer>
            )}

            <MainContainer>
                <h2>Make a bet</h2>
                <MakeBet walletInformation={props.walletInformation} transactionCallback={refetchBets}/>
            </MainContainer>

            <MainContainer>
                <h2>Your bets</h2>
                {error ? (
                        <>
                            <p>Error occurred while loading your bets. Check the console for more information.</p>
                            <p>{error.message}</p>
                        </>
                    ) :
                    involvedBets.map((bet) =>
                        <BetDetails key={bet.transactionHash} bet={bet} walletInfo={props.walletInformation}/>)
                }
            </MainContainer>

            <MainContainer>
                <h2>Gas Refunds</h2>
                {onRefundList ? (
                    <p>You are <b>on</b> the refund list. Your gas fees on actions <b>will be refunded</b> by the
                        contract.</p>
                ) : (
                    <p>You are <b>not on</b> the refund list.</p>
                )}

                {contractBalance ? (
                    <>
                        The smart contract's current balance
                        is {ethers.utils.formatEther(contractBalance?.toString())} MATIC.
                    </>
                ) : <></>}
            </MainContainer>
        </>
    );
}