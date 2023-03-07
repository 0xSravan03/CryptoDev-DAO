"use client";

import styles from "./page.module.css";
import CryptoDevsDAO from "../contract/cryptodevsdao.json";
import CryptoDevsNFT from "../contract/cryptodevsnft.json";
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
      const signer = provider.getSigner();
      setWalletConnected(true);
      return signer;
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

  // DAO Contract Instance
  const getDaoContractInstance = async () => {
    const signer = await connectWallet();
    const daoContract = new ethers.Contract(
      CryptoDevsDAO.address,
      CryptoDevsDAO.abi,
      signer
    );
  };

  const getCryptodevsNFTContractInstance = async () => {
    const signer = await connectWallet();
    const nftContract = new ethers.Contract(
      CryptoDevsNFT.address,
      CryptoDevsNFT.abi,
      signer
    );
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
