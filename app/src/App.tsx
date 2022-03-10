import React, {useCallback, useEffect, useState} from 'react';
import './App.css';
import {getInvolvedBets, getWalletInformation, WalletInformation} from "./data/wallet";
import {BetCreatedEvent} from "./data/contract";
import {Header} from "./components/Header/Header";
import {BetsContainer} from './components/BetsContainer/BetsContainer';
import {MainContainer} from "./components/MainContainer/MainContainer";

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

    const [involvedBets, setInvolvedBets] = useState<Array<BetCreatedEvent>>([]);

    useEffect(() => {
        if (walletInformation) {
            getInvolvedBets(walletInformation).then(setInvolvedBets).catch(setError);
        }
    }, [walletInformation]);

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

    return (
        <>
            <Header loading={false} walletAddress={walletAddress} networkName={networkName}
                    tokenDetails={walletInformation.tokenDetails} balance={walletInformation.tokenBalance}/>
            <BetsContainer bets={involvedBets} walletInformation={walletInformation}/>
        </>
    );
}

export default App;
