import {WalletInformation} from "../data/wallet";
import React from "react";

export const NetworkContext = React.createContext<WalletInformation | undefined>(undefined);
