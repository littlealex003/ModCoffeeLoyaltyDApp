import React from "react";

export function Burn({ burnTokens, tokenSymbol }) {
  return (
    <div>
      <h4>Burn</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const amount = formData.get("amount");

          if (amount) {
            burnTokens(amount);
          }
        }}
      >
        <div className="form-group">
          <label>Amount of {tokenSymbol}</label>
          <input
            className="form-control"
            type="number"
            step="1"
            name="amount"
            placeholder="0"
            required
          />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Burn" />
        </div>
      </form>
    </div>
  );
}
