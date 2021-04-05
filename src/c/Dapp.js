import React from "react";
import { ethers } from "ethers";
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";
// 
import { NoMetamaskFoundPage } from "../v/pages/NoMetamaskFoundPage";
import { ConnectWalletPage } from "../v/pages/ConnectWalletPage";
import { LoadingPage } from "../v/pages/LoadingPage";

const HARDHAT_NETWORK_ID = "31337";

export class Dapp extends React.Component {
  _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });
    this._intializeEthers();
    // this._getTokenData();
    // this._startPollingData();
  }

  constructor(props) {
    super(props);

    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      tokenData: undefined,
      selectedAddress: undefined,
      balance: undefined,
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };

    this.state = this.initialState;
  }
  render() {
    if (window.ethereum === undefined) {
      console.log("No Metamask Installed");
      return <NoMetamask />;
    }
    if (!this.state.selectedAddress) {
      console.log("Wallet not connected");
      return (
        <ConnectWalletPage
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }
    if (!this.state.tokenData || !this.state.balance) {
      console.log("Token data or user's balance hasn't loaded yet");
      return <LoadingPage />;
    }

    return "hello world";
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.enable();
    if (!this._checkNetwork()) {
      return;
    }
    this._initialize(selectedAddress);
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      if (newAddress === undefined) {
        return this._resetState();
      }
      this._initialize(newAddress);
    });
    window.ethereum.on("networkChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  // This method checks if Metamask selected network is Localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({
      networkError: "Please connect Metamask to Localhost:8545",
    });

    return false;
  }

  async _intializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    this._token = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      this._provider.getSigner(0)
    );
  }
}
