import React from "react";
import { Burn } from "../components/BurnComponent";
import { Transfer } from "../components/TransferComponent";
import { TransactionErrorMessage } from "../components/TransactionErrorMessageComponent";
import { WaitingForTransactionMessage } from "../components/WaitingForTransactionMessageComponent";
import { NoTokensMessage } from "../components/NoTokensMessageComponent";

export function MainPage({
  state,
  transferTokens,
  burnTokens,
  getRpcErrorMessage,
  dismissTransactionError,
}) {
  return (
    <div className="container p-4">
      <div className="row">
        <div className="col-12">
          <h1>
            {state.tokenData.name} ({state.tokenData.symbol})
          </h1>
          <h5>SmartContractAddress: {state.smartContractAddress}</h5>
          <p>
            Welcome <b>{state.selectedAddress}</b>, you have{" "}
            <b>
              {state.balance.toString()} {state.tokenData.symbol}
            </b>
            .
          </p>
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col-12">
          {state.txBeingSent && (
            <WaitingForTransactionMessage txHash={state.txBeingSent} />
          )}
          {state.transactionError && (
            <TransactionErrorMessage
              message={getRpcErrorMessage(state.transactionError)}
              dismiss={dismissTransactionError}
            />
          )}
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          {state.balance.eq(0) && (
            <NoTokensMessage selectedAddress={state.selectedAddress} />
          )}
          {state.balance.gt(0) && (
            <Transfer
              transferTokens={transferTokens}
              tokenSymbol={state.tokenData.symbol}
            />
          )}
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          {state.balance.gt(0) && (
            <Burn
              burnTokens={burnTokens}
              tokenSymbol={state.tokenData.symbol}
            />
          )}
        </div>
      </div>
    </div>
  );
}
