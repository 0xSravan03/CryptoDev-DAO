"use client";

import styles from "./page.module.css";
import CryptoDevsDAO from "../contract/cryptodevsdao.json";
import NftMarket from "../contract/nftmarket.json";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    web3ModalRef.current = new Web3Modal({
      network: "goerli",
      providerOptions: {},
      disableInjectedProvider: false,
    });
  }, []);

  const connectWallet = async () => {
    try {
      const instance = await web3ModalRef.current.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      setWalletConnected(true);
      const signer = provider.getSigner();
      console.log(`Signer : ${await signer.getAddress()}`);
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <main className={styles.main}>
      <button className={styles.button} onClick={handleConnect}>
        {!walletConnected ? (
          <span>Connect Wallet</span>
        ) : (
          <span>Connected</span>
        )}
      </button>
    </main>
  );
}
