import {BetCreatedEvent} from "../../data/contract";
import {BetDetails} from "../BetInformation/BetDetails";
import {WalletInformation} from "../../data/wallet";
import styles from './BetsContainer.module.css';
import {MakeBet} from "../MakeBet/MakeBet";

export type BetsContainerProps = {
    bets: BetCreatedEvent[],
    walletInformation: WalletInformation
};

export function BetsContainer(props: BetsContainerProps) {
    return (
        <>
            <div className={styles.container}>
                <h2>Make a bet</h2>
                <MakeBet walletInformation={props.walletInformation}/>
            </div>

            <div className={styles.container}>
                <h2>Your bets</h2>
                {props.bets.map((bet) =>
                    <BetDetails key={bet.transactionHash} bet={bet} walletInfo={props.walletInformation}/>)
                }
            </div>
        </>
    );
}