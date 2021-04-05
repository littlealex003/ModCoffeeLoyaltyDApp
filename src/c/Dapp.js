import React from "react";
import { ethers } from "ethers";
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";

import { NoMetamaskFoundPage } from "../v/pages/NoMetamaskFoundPage";
import { ConnectWalletPage } from "../v/pages/ConnectWalletPage";
import { LoadingPage } from "../v/pages/LoadingPage";
import { MainPage } from "../v/pages/MainPage";

const HARDHAT_NETWORK_ID = "31337";
const LOCAL_NETWORK_ID = "1337";
const RINKEBY_NETWORK_ID = "4";
// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

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
      smartContractAddress: contractAddress.Token,
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
    return (
      <MainPage
        state={this.state}
        transferTokens={(to, amount) => this._transferTokens(to, amount)}
        getRpcErrorMessage={(error) => this._getRpcErrorMessage(error)}
        dismissTransactionError={() => this._dismissTransactionError()}
      />
    );
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

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545
  _checkNetwork() {
    if (
      window.ethereum.networkVersion === LOCAL_NETWORK_ID ||
      window.ethereum.networkVersion === RINKEBY_NETWORK_ID ||
      window.ethereum.networkVersion === HARDHAT_NETWORK_ID
    ) {
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

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _transferTokens(to, amount) {
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.
    try {
      // If a transaction fails, we save that error in the component's state.
      // We only save one such error, so before sending a second transaction, we
      // clear it.
      this._dismissTransactionError();

      // We send the transaction, and save its hash in the Dapp's state. This
      // way we can indicate that we are waiting for it to be mined.
      const tx = await this._token.transfer(to, amount);
      // const tx = await this._token.transferFrom(this.state.selectedAddress, to, amount);
      this.setState({ txBeingSent: tx.hash });

      // We use .wait() to wait for the transaction to be mined. This method
      // returns the transaction's receipt.
      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that make the transaction fail once it
        // was mined, so we throw this generic one.
        throw new Error("Transaction failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._updateBalance();
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }
}
