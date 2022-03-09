import {ethers} from "ethers";
import contractABI from "./contract_abi.json"
import erc20ABI from "./ierc20_abi.json"
import {address, BetCreatedEvent, BettingContract, ERC20Contract} from "./contract";

const BettingContractAddr = "0xca3f697B9A1eF4fC2C6ecEFD62239A4b2Df8F925";
const TokenContractAddr = "0x8A953CfE442c5E8855cc6c61b1293FA648BAE472";
const BettingContractDeployedBlock = 25753029;

export interface TokenDetails {
    name: string,
    symbol: string,
    decimals: number
}

export interface WalletInformation {
    provider: ethers.providers.Web3Provider,
    signer: ethers.providers.JsonRpcSigner,
    walletAddress: address,
    networkName: string,
    bettingContract: BettingContract,
    tokenContract: ERC20Contract,
    tokenBalance: bigint,
    tokenDetails: TokenDetails,
    authorizedAllowance: boolean
}

export async function getWalletProvider(): Promise<ethers.providers.Web3Provider> {
    let provider = new ethers.providers.Web3Provider((window as any).ethereum);

    await provider.send("eth_requestAccounts", []);

    return provider;
}

export async function getWalletInformation(provider: ethers.providers.Web3Provider, changeCallback: (accounts: String[]) => void): Promise<WalletInformation> {
    const signer = provider.getSigner();

    const bettingContract = new ethers.Contract(BettingContractAddr, contractABI, provider).connect(signer) as BettingContract;
    const tokenContract = new ethers.Contract(TokenContractAddr, erc20ABI, provider).connect(signer) as ERC20Contract;

    const [account, network, tokenName, tokenSymbol, tokenDecimals] = await Promise.all([
        getWalletAddress(provider),
        provider.getNetwork(),
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
    ]);

    const [tokenBalance, authorizedAllowance] = await Promise.all([
        tokenContract.balanceOf(account),
        checkAuthorizedERC20Token(tokenContract, account)
    ]);
    const networkName = network.name;

    return {
        provider,
        signer,
        walletAddress: account,
        networkName,
        bettingContract: bettingContract,
        tokenContract,
        tokenBalance,
        tokenDetails: {
            name: tokenName,
            symbol: tokenSymbol,
            decimals: Number(tokenDecimals)
        },
        authorizedAllowance
    };
}


export async function getWalletAddress(provider: ethers.providers.Web3Provider) {
    let accounts = await provider.listAccounts();

    if (!accounts || accounts.length === 0) throw new Error('no wallets found');

    return accounts[0];
}

export async function getBetInformation(provider: ethers.providers.Web3Provider, bet_id: bigint) {
    const bettingContract = new ethers.Contract(BettingContractAddr, contractABI, provider) as BettingContract;

    return bettingContract.get_bet_details(bet_id);
}

export async function getInvolvedBets(walletInformation: WalletInformation): Promise<Array<BetCreatedEvent>> {
    const bettingContract = walletInformation.bettingContract;

    const filterInitiator = bettingContract.filters.BetCreated(null, null, walletInformation.walletAddress, null, null);
    const filterParticipant = bettingContract.filters.BetCreated(null, null, null, walletInformation.walletAddress, null);

    const [initiatorBets, participantBets] = await Promise.all([
        bettingContract.queryFilter(filterInitiator, BettingContractDeployedBlock),
        bettingContract.queryFilter(filterParticipant, BettingContractDeployedBlock)
    ]);

    const ret = initiatorBets.concat(participantBets) as Array<BetCreatedEvent>;

    return ret.sort((a, b) => b.args.bet_id - a.args.bet_id);
}

export async function checkAuthorizedERC20Token(tokenContract: ERC20Contract, account: address) {
    const allowance = await tokenContract.allowance(account, BettingContractAddr);

    console.log(allowance);

    return allowance > BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
}

export async function authorizeERC20Token(walletInformation: WalletInformation) {
    const tokenContract = walletInformation.tokenContract;

    if (!await checkAuthorizedERC20Token(tokenContract, walletInformation.walletAddress)) {
        return await tokenContract.approve(BettingContractAddr, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'));
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
