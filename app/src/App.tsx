import React, {useCallback, useEffect, useState} from 'react';
import './App.css';
import {
    authorizeERC20Token,
    getInvolvedBets,
    getWalletInformation,
    getWalletProvider,
    WalletInformation
} from "./data/wallet";
import {BetCreatedEvent} from "./data/contract";
import {Header} from "./components/Header/Header";
import {BetsContainer} from './components/BetsContainer/BetsContainer';

function App() {
    const [walletInformation, setWalletInformation] = useState<WalletInformation>();
    const [error, setError] = useState<Error>();

    const onAccountChange = useCallback((provider) => {
        getWalletInformation(provider, onAccountChange)
            .then((wallet) => {
                console.log(wallet)
                if (!wallet.authorizedAllowance) {
                    authorizeERC20Token(wallet).then(() => {
                        setWalletInformation(wallet);
                    }).catch(setError);
                } else {
                    setWalletInformation(wallet);
                }
            })
            .catch(setError);
    }, [setWalletInformation]);

    useEffect(() => {
        getWalletProvider().then((provider) => {
            // @ts-ignore
            provider.provider.on('accountsChanged', () => onAccountChange(provider));
            // @ts-ignore
            provider.provider.on('chainChanged', window.location.reload);
            onAccountChange(provider)
        }).catch(setError);

        return () => {
            // @ts-ignore
            walletInformation?.provider.provider.removeListener('accountsChanged', onAccountChange)
        };
    }, [onAccountChange, walletInformation?.provider.provider]);

    const [involvedBets, setInvolvedBets] = useState<Array<BetCreatedEvent>>([]);

    useEffect(() => {
        if (walletInformation) {
            getInvolvedBets(walletInformation).then(setInvolvedBets).catch(setError);
        }
    }, [walletInformation]);

    if (error) {
        console.log(error);
        return <>"Failed to connect to wallet: " + error.message</>;
    }


    if (!walletInformation) {
        return (
            <>
                <div id="background-radial-gradient"/>
                <div className="App">
                    <Header loading={true}/>
                </div>
            </>
        )
    }

    const {walletAddress, authorizedAllowance, networkName} = walletInformation;

    return (
        <>
            <div id="background-radial-gradient"/>
            <div className="App">
                <Header loading={false} walletAddress={walletAddress} networkName={networkName}
                        tokenDetails={walletInformation.tokenDetails} balance={walletInformation.tokenBalance}/>
                {!authorizedAllowance ? (
                    <button onClick={() => authorizeERC20Token(walletInformation)}>Authorize (Only needs to be
                        done once)</button>
                ) : null}

                <BetsContainer bets={involvedBets} walletInformation={walletInformation}/>
            </div>
        </>
    );
}

export default App;
