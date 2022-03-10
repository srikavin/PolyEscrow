import {ethers} from "ethers";
import contractABI from "./contract_abi.json"
import erc20ABI from "./ierc20_abi.json"
import {address, BetCreatedEvent, BettingContract, ERC20Contract} from "./contract";
import {
    ALCHEMY_KEY,
    ALCHEMY_NETWORK,
    BETTING_CONTRACT_ADDR,
    BETTING_CONTRACT_DEPLOYED_BLOCK,
    NETWORK_CHAIN_ID,
    TOKEN_CONTRACT_ADDR
} from "./environment";

export interface TokenDetails {
    name: string,
    symbol: string,
    decimals: number,
    logo?: string
}

export interface WalletInformation {
    provider: ethers.providers.AlchemyWebSocketProvider,
    signer: ethers.providers.JsonRpcSigner,
    walletAddress: address,
    networkName: string,
    bettingContract: BettingContract,
    connectedBettingContract: BettingContract,
    tokenContract: ERC20Contract,
    connectedTokenContract: ERC20Contract,
    tokenBalance: bigint,
    tokenDetails: TokenDetails,
    authorizedAllowance: boolean
}

export async function getWalletInformation(): Promise<WalletInformation> {
    let provider = new ethers.providers.Web3Provider((window as any).ethereum);

    await provider.send("eth_requestAccounts", []);
    await provider.send('wallet_switchEthereumChain', [{chainId: NETWORK_CHAIN_ID}]);
    await (window as any).ethereum.on('chainChanged', () => window.location.reload());

    const alchemyProvider = new ethers.providers.AlchemyWebSocketProvider(ALCHEMY_NETWORK, ALCHEMY_KEY);

    const signer = provider.getSigner();

    const bettingContract = new ethers.Contract(BETTING_CONTRACT_ADDR, contractABI, alchemyProvider) as BettingContract;
    const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDR, erc20ABI, alchemyProvider) as ERC20Contract;

    const [account, network] = await Promise.all([
        getWalletAddress(provider),
        alchemyProvider.getNetwork()
    ]);

    const tokenDetails = await alchemyProvider.send('alchemy_getTokenMetadata', [TOKEN_CONTRACT_ADDR]);

    const [tokenBalance, authorizedAllowance] = await Promise.all([
        tokenContract.balanceOf(account),
        checkAuthorizedERC20Token(tokenContract, account)
    ]);
    const networkName = network.name;

    return {
        provider: alchemyProvider,
        signer,
        walletAddress: account,
        networkName,
        bettingContract: bettingContract,
        connectedBettingContract: bettingContract.connect(signer) as BettingContract,
        tokenContract,
        connectedTokenContract: tokenContract.connect(signer) as ERC20Contract,
        tokenBalance,
        tokenDetails,
        authorizedAllowance
    };
}


export async function getWalletAddress(provider: ethers.providers.Web3Provider) {
    let accounts = await provider.listAccounts();

    if (!accounts || accounts.length === 0) throw new Error('no wallets found');

    return accounts[0];
}

export async function getBetInformation(walletInformation: WalletInformation, bet_id: bigint) {
    const bettingContract = new ethers.Contract(BETTING_CONTRACT_ADDR, contractABI, walletInformation.provider) as BettingContract;

    return bettingContract.get_bet_details(bet_id);
}

export async function getInvolvedBets(walletInformation: WalletInformation): Promise<Array<BetCreatedEvent>> {
    const bettingContract = walletInformation.bettingContract;

    const filterInitiator = bettingContract.filters.BetCreated(null, null, walletInformation.walletAddress, null, null);
    const filterParticipant = bettingContract.filters.BetCreated(null, null, null, walletInformation.walletAddress, null);

    const [initiatorBets, participantBets] = await Promise.all([
        bettingContract.queryFilter(filterInitiator, BETTING_CONTRACT_DEPLOYED_BLOCK),
        bettingContract.queryFilter(filterParticipant, BETTING_CONTRACT_DEPLOYED_BLOCK)
    ]);

    const ret = initiatorBets.concat(participantBets) as Array<BetCreatedEvent>;

    return ret.sort((a, b) => b.args.bet_id - a.args.bet_id);
}

export async function checkAuthorizedERC20Token(tokenContract: ERC20Contract, account: address) {
    const allowance = await tokenContract.allowance(account, BETTING_CONTRACT_ADDR);

    console.log(allowance);

    return allowance > BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
}

export async function authorizeERC20Token(walletInformation: WalletInformation) {
    const tokenContract = walletInformation.tokenContract;

    if (!await checkAuthorizedERC20Token(tokenContract, walletInformation.walletAddress)) {
        const connectedTokenContract = walletInformation.connectedTokenContract;
        return await connectedTokenContract.approve(BETTING_CONTRACT_ADDR, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'));
    }

    return true;
}

export function listenToBetChanges(walletInformation: WalletInformation, bet_id: bigint, callback: () => void) {
    const {bettingContract, provider} = walletInformation;

    const filters = [
        bettingContract.filters.BetRefunded(bet_id),
        bettingContract.filters.BetRejected(bet_id),
        bettingContract.filters.BetResolved(bet_id, null),
        bettingContract.filters.BetVoted(bet_id, null, null),
    ];

    filters.forEach(filter => {
        provider.on(filter, callback);
    })

    return () => {
        filters.forEach(filter => {
            provider.removeListener(filter, callback);
        });
    }
}
