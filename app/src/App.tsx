import React, {useCallback, useEffect, useState} from 'react';
import './App.css';
import {getWalletInformation, WalletInformation} from "./data/wallet";
import {Header} from "./components/Header/Header";
import {BetsContainer} from './components/BetsContainer/BetsContainer';
import {MainContainer} from "./components/MainContainer/MainContainer";
import {NETWORK_CHAIN_ID} from "./data/environment";
import {StyledButton} from "./components/StyledButton/StyledButton";

function App() {
    const [walletInformation, setWalletInformation] = useState<WalletInformation>();
    const [error, setError] = useState<Error>();

    const onAccountChange = useCallback(() => {
        console.log('ON ACCOUNT CHANGE')
        getWalletInformation().then(walletInformation => {
            // @ts-ignore
            walletInformation.signer.provider.provider.on('accountsChanged', onAccountChange);
            setWalletInformation(walletInformation);
        }).catch(setError);
    }, []);

    useEffect(() => {
        if (!walletInformation) {
            onAccountChange();
        }

        return () => {
            // @ts-ignore
            walletInformation?.signer.provider.provider.removeListener('accountsChanged', onAccountChange);
        }
    }, [onAccountChange, walletInformation]);

    if (error) {
        console.log(error);
        return (
            <>
                <Header loading={true}/>
                <MainContainer>
                    <h1>Failed to connect to Web3 wallet</h1>
                    <p>See console for more details.</p>
                    <p>{error.message}</p>
                </MainContainer>
            </>
        );
    }


    if (!walletInformation) {
        return (
            <>
                <Header loading={true}/>
                <MainContainer>
                    <h1>Connecting to Web3 wallet...</h1>
                </MainContainer>
            </>
        )
    }

    const {walletAddress, networkName} = walletInformation;

    if (walletInformation.networkName !== walletInformation.signerNetworkName) {
        return <>
            <Header loading={false} walletAddress={walletAddress} networkName={networkName}
                    tokenDetails={walletInformation.tokenDetails} balance={walletInformation.tokenBalance}/>
            <MainContainer>
                <h1>You are connected to a different network</h1>
                <p>The smart contract is stored on '{walletInformation.networkName}', while your wallet is set
                    to '{walletInformation.signerNetworkName}'.</p>
                <StyledButton theme='danger' onClick={() => {
                    walletInformation.signer.provider.send('wallet_switchEthereumChain', [{chainId: NETWORK_CHAIN_ID}])
                }}>
                    Change Network
                </StyledButton>

            </MainContainer>
        </>
    }


    return (
        <>
            <Header loading={false} walletAddress={walletAddress} networkName={networkName}
                    tokenDetails={walletInformation.tokenDetails} balance={walletInformation.tokenBalance}/>
            <BetsContainer walletInformation={walletInformation}/>
        </>
    );
}

export default App;
