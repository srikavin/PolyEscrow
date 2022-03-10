import {BetCreatedEvent} from "../../data/contract";
import {BetDetails} from "../BetInformation/BetDetails";
import {authorizeERC20Token, getInvolvedBets, WalletInformation} from "../../data/wallet";
import {MakeBet} from "../MakeBet/MakeBet";
import {StyledButton} from "../StyledButton/StyledButton";
import {MainContainer} from "../MainContainer/MainContainer";
import {useCallback, useEffect, useState} from "react";

export type BetsContainerProps = {
    walletInformation: WalletInformation
};

export function BetsContainer(props: BetsContainerProps) {
    const [involvedBets, setInvolvedBets] = useState<Array<BetCreatedEvent>>([]);
    const [error, setError] = useState<Error>();

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
        </>
    );
}