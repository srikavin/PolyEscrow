import {BetCreatedEvent} from "../../data/contract";
import {BetDetails} from "../BetInformation/BetDetails";
import {authorizeERC20Token, WalletInformation} from "../../data/wallet";
import {MakeBet} from "../MakeBet/MakeBet";
import {StyledButton} from "../StyledButton/StyledButton";
import {MainContainer} from "../MainContainer/MainContainer";

export type BetsContainerProps = {
    bets: BetCreatedEvent[],
    walletInformation: WalletInformation
};

export function BetsContainer(props: BetsContainerProps) {
    return (
        <>
            {props.walletInformation.authorizedAllowance ? null : (
                <MainContainer>
                    <h2>Authorize access to your {props.walletInformation.tokenDetails.name}</h2>
                    <p>This only needs to be done once.</p>
                    <StyledButton theme='danger' onClick={() => authorizeERC20Token(props.walletInformation)}>
                        Authorize
                    </StyledButton>
                </MainContainer>
            )}

            <MainContainer>
                <h2>Make a bet</h2>
                <MakeBet walletInformation={props.walletInformation}/>
            </MainContainer>

            <MainContainer>
                <h2>Your bets</h2>
                {props.bets.map((bet) =>
                    <BetDetails key={bet.transactionHash} bet={bet} walletInfo={props.walletInformation}/>)
                }
            </MainContainer>
        </>
    );
}