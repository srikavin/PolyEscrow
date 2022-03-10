import styles from './Header.module.css';
import {StyledButton} from "../StyledButton/StyledButton";
import {trimHash} from "../../utils/WalletDisplay";
import {TokenDetails} from "../../data/wallet";
import {ethers} from "ethers";
import {GradientText} from "../GradientText/GradientText";

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
    let walletInformation = (
        <StyledButton theme='borderless'>
            Connecting to wallet...
        </StyledButton>
    );

    if (!props.loading) {
        const trimmedWalletAddr = trimHash(props.walletAddress);
        walletInformation = (
            <>
                <StyledButton theme='borderless'><span
                    className={styles.wallet_address}>{trimmedWalletAddr}</span>
                </StyledButton>
                <StyledButton theme='borderless'>
                    <span className={styles.wallet_address}>
                        {ethers.utils.formatUnits(props.balance, props.tokenDetails.decimals)} <b><GradientText>{props.tokenDetails.symbol}</GradientText></b>
                    </span>
                </StyledButton>
                <StyledButton theme='borderless'><span
                    className={styles.wallet_address}>{props.networkName}</span>
                </StyledButton>
            </>
        );
    }

    return (
        <div className={styles.header}>
            <div className={styles.wallet_info}>{walletInformation}</div>
        </div>
    )
}