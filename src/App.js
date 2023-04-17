import React, { useState, useEffect } from "react";
import './App.css';
import Web3 from 'web3'
import Biconomy from "@biconomy/mexa";
import { NotificationContainer, NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';
const Tx = require('ethereumjs-tx').Transaction

const { config } = require("./config");
const showErrorMessage = message => {
  NotificationManager.error(message, "Error", 5000);
};
const showSuccessMessage = message => {
  NotificationManager.success(message, "Message", 3000);
};

const showInfoMessage = message => {
  NotificationManager.info(message, "Info", 3000);
};

let contract;
let domainData = {
  name: "Quote",
  version: "1",
  chainId: "80001",  // Mumbai
  verifyingContract: config.contract.address
};
const domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
];

const metaTransactionType = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" }
];

let web3;

function App() {


  const [owner, setOwner] = useState("Default Owner Address");
  const [quote, setQuote] = useState("This is a default quote");
  const [newQuote, setNewQuote] = useState("");
  useEffect(() => {


    if (!window.ethereum) {
      showErrorMessage("Metamask is required to use this DApp")
      return;
    }

    // NOTE: dappId is no longer needed in latest version of Biconomy SDK
    const biconomy = new Biconomy(window.ethereum, { dappId: "1681617515718", apiKey: "kAsdpiRAy.c9d8b991-99cf-499b-9af5-546f4d01a8fd" });

    web3 = new Web3(biconomy);

    biconomy.onEvent(biconomy.READY, async () => {
      // Initialize your dapp here like getting user accounts etc

      await window.ethereum.enable();
      contract = new web3.eth.Contract(config.contract.abi, config.contract.address);
      startApp();
    }).onEvent(biconomy.ERROR, (error, message) => {
      // Handle error while initializing mexa
      console.log(error);
    });
  }
    , []);

  const onQuoteChange = event => {
    setNewQuote(event.target.value);
  };

  async function startApp() {
    const result = await contract.methods.getQuote().call({ from: window.ethereum.selectedAddress });
    if (result.currentOwner !== "0x0000000000000000000000000000000000000000") {
      setQuote(result.currentQuote)
      setOwner(result.currentOwner)
    }
  }

  async function onButtonClickMeta() {
    console.log(window.ethereum.selectedAddress)
    setNewQuote("");

    const tx = await contract.methods.setQuote(newQuote).encodeABI();
    let nonce = await web3.eth.getTransactionCount(window.ethereum.selectedAddress, "pending");

    const txDetails = {
        nonce: nonce.toString(),
        from: window.ethereum.selectedAddress,
        to: config.contract.address,
        data: tx,
        signatureType: "PERSONAL_SIGN"
    };

    window.web3.currentProvider.send("eth_sendTransaction", [txDetails]);
  }

  return (
    <div className="App">
      *Use this DApp only on Mumbai Network
      <header className="App-header">
        <h1>Quotes</h1>
        <section className="main">
          <div className="mb-wrap mb-style-2">
            <blockquote cite="http://www.gutenberg.org/ebboks/11">
              <h4>{quote} </h4>
            </blockquote>
          </div>

          <div className="mb-attribution">
            <p className="mb-author">- {owner}</p>
          </div>
        </section>
        <section>
          <div className="submit-container">
            <div className="submit-row">
              <input size="100"
                border-radius="15"
                type="text"
                placeholder="Enter your quote"
                onChange={onQuoteChange}
                value={newQuote}
              />
              <button type="button" className="button" onClick={onButtonClickMeta}>Submit</button>
            </div>
          </div>
        </section>
      </header>
      <NotificationContainer />
    </div >
  );
}

export default App;
