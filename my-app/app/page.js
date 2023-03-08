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
  const [loading, setLoading] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [numProposals, setNumProposals] = useState("0");
  const [nftBalance, setNftBalance] = useState("0");
  const [fakeNftTokenId, setFakeNftTokenId] = useState(""); // holds the nft that needed to purchase via proposal.
  const [proposals, setProposals] = useState([]);

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
      await getDAOTreasuryBalance();
      await getNumProposalsInDAO();
      await getUserNFTBalance();
    } catch (error) {
      console.log(error.message);
    }
  };

  // DAO Contract Instance
  const getDaoContractInstance = async () => {
    try {
      const signer = await connectWallet();
      const daoContract = new ethers.Contract(
        CryptoDevsDAO.address,
        CryptoDevsDAO.abi,
        signer
      );
      return daoContract;
    } catch (error) {
      console.log(error.message);
    }
  };

  // CryptoDevs NFT Instance
  const getCryptodevsNFTContractInstance = async () => {
    try {
      const signer = await connectWallet();
      const nftContract = new ethers.Contract(
        CryptoDevsNFT.address,
        CryptoDevsNFT.abi,
        signer
      );
      return nftContract;
    } catch (error) {
      console.log(error.message);
    }
  };

  // Get DAO Balance
  const getDAOTreasuryBalance = async () => {
    try {
      const signer = await connectWallet();
      const balance = await signer.provider.getBalance(CryptoDevsDAO.address);
      setTreasuryBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.log(error.message);
    }
  };

  // get number of proposals in DAO
  const getNumProposalsInDAO = async () => {
    try {
      const daoContract = await getDaoContractInstance();
      const totalProposals = await daoContract.numProposals();
      setNumProposals(totalProposals.toString());
    } catch (error) {
      console.log(error.message);
    }
  };

  //get user NFT Balance
  const getUserNFTBalance = async () => {
    try {
      const nftContract = await getCryptodevsNFTContractInstance();
      const signerAddress = await nftContract.signer.getAddress();
      const nftBalance = await nftContract.balanceOf(signerAddress);
      setNftBalance(nftBalance.toString());
    } catch (error) {
      console.log(error.message);
    }
  };

  // create proposal for purchasing nft (using fakenfttokenid)
  const createProposal = async () => {
    try {
      const daoContract = await getDaoContractInstance();
      const txn = await daoContract.createProposal(fakeNftTokenId);
      setLoading(true);
      await txn.wait();
      await getNumProposalsInDAO();
      setLoading(false);
    } catch (error) {
      console.log(error.message);
      window.alert(error.reason);
    }
  };

  // fetch proposal by using proposal id.
  const fetchProposalById = async (id) => {
    try {
      const daoContract = await getDaoContractInstance();
      const proposal = await daoContract.proposals(id);
      const Proposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yesVotes: proposal.yesVotes,
        noVotes: proposal.noVotes,
        executed: proposal.executed,
      };
      return Proposal;
    } catch (error) {
      console.log(error.message);
    }
  };

  // fetch all proposals
  const fetchAllProposals = async () => {
    try {
      const daoContract = await getDaoContractInstance();
      const proposals = [];
      for (i = 0; i < Number(numProposals); i++) {
        const proposal = await daoContract.fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
    } catch (error) {
      console.log(error.message);
    }
  };

  // vote proposal
  const voteOnProposal = async (proposalId, vote) => {
    try {
      const daoContract = await getDaoContractInstance();
      const _vote = vote.toLowerCase() === "yes" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(proposalId, _vote);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
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
