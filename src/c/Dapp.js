import React from "react";

export class Dapp extends React.Component {
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
        return("hello world");
    }
}
