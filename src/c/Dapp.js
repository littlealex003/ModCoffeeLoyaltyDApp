import React from "react";
import { ethers } from "ethers";
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";

import { NoMetamaskFoundPage } from "../v/pages/NoMetamaskFoundPage";
import { ConnectWalletPage } from "../v/pages/ConnectWalletPage";
import { LoadingPage } from "../v/pages/LoadingPage";
import { MainPage } from "../v/pages/MainPage";

const HARDHAT_NETWORK_ID = "31337";

export class Dapp extends React.Component {
  _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });
    this._intializeEthers();
    this._getTokenData();
    this._startPollingData();
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
      return <NoMetamaskFoundPage />;
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
    return <MainPage state={this.state} />;
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

  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();
    this.setState({ tokenData: { name, symbol } });
  }

  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }
}
