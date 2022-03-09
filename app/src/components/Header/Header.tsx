import styles from './Header.module.css';
import {StyledButton} from "../StyledButton/StyledButton";
import {trimWalletAddress} from "../../utils/WalletDisplay";
import {TokenDetails} from "../../data/wallet";
import {ethers} from "ethers";

export type HeaderProps = {
    loading: true
} | {
    loading: false,
    walletAddress: string,
    networkName: string,
    tokenDetails: TokenDetails
    balance: bigint
}

export function Header(props: HeaderProps) {
    let walletInformation = (<>"Connecting to wallet..."</>);

    if (!props.loading) {
        const trimmedWalletAddr = trimWalletAddress(props.walletAddress);
        walletInformation = (
            <>
                <StyledButton><span className={styles.wallet_address}>{trimmedWalletAddr}</span></StyledButton>
                <StyledButton>
                    <span className={styles.wallet_address}>
                        {ethers.utils.formatUnits(props.balance, props.tokenDetails.decimals)} {props.tokenDetails.symbol}
                    </span>
                </StyledButton>
                <StyledButton><span className={styles.wallet_address}>{props.networkName}</span></StyledButton>
            </>
        );
    }

    return (
        <div className={styles.header}>
            <div className={styles.wallet_info}>{walletInformation}</div>
        </div>
    )
}