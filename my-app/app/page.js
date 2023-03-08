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
  const [fakeNftTokenId, setFakeNftTokenId] = useState("0"); // holds the nft that needed to purchase via proposal.
  const [proposals, setProposals] = useState([]);
  const [selectedTab, setSelectedTab] = useState("");

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
      return signer;
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      await connectWallet();
      await getUserNFTBalance();
      await getDAOTreasuryBalance();
      await getNumProposalsInDAO();
      setWalletConnected(true);
      setLoading(false);
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
      console.log(error.reason);
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
        yesVotes: proposal.yesVotes.toString(),
        noVotes: proposal.noVotes.toString(),
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
      const proposals = [];
      for (let i = 0; i < Number(numProposals); i++) {
        const proposal = await fetchProposalById(i);
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
      window.alert(error.reason);
    }
  };

  // execute Proposal
  const executeProposal = async (proposalId) => {
    try {
      const daoContract = await getDaoContractInstance();
      const txn = await daoContract.executeProposal(proposalId);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
      await getDAOTreasuryBalance();
    } catch (error) {
      console.log(error.message);
    }
  };

  // rendering tabs based on selectedTab value
  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  // This function render create proposal
  const renderCreateProposalTab = () => {
    if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          <span style={{ color: "red" }}>
            You do not own any CryptoDevs NFTs.
          </span>
          <p style={{ color: "red" }}>
            You cannot create or vote on proposals.
          </p>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>NFT Token ID to Purchase: </label>
          <input
            placeholder="0"
            type="number"
            min="0"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          {loading ? (
            <button className={styles.button2}>Creating Proposal...</button>
          ) : (
            <button className={styles.button2} onClick={createProposal}>
              Create Proposal
            </button>
          )}
        </div>
      );
    }
  };

  const renderViewProposalsTab = () => {
    if (proposals.length === 0) {
      return (
        <div className={styles.description}>No proposals have been created</div>
      );
    } else {
      return (
        <div className={styles.proposalContainer}>
          {proposals.map((proposal, index) => (
            <div key={index} className={styles.proposalCard}>
              <p>Proposal ID: {proposal.proposalId}</p>
              <p>NFT to Purchase: {proposal.nftTokenId}</p>
              <p>Deadline: {proposal.deadline.toLocaleString()}</p>
              <p>Yes Votes: {proposal.yesVotes}</p>
              <p>No Votes: {proposal.noVotes}</p>
              <p>Executed?: {proposal.executed.toString()}</p>
              {proposal.deadline.getTime() > Date.now() &&
              !proposal.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(proposal.proposalId, "Yes")}
                  >
                    {loading ? <span>Voting..</span> : <span>Vote (Yes)</span>}
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(proposal.proposalId, "No")}
                  >
                    {loading ? <span>Voting..</span> : <span>Vote (No)</span>}
                  </button>
                </div>
              ) : proposal.deadline.getTime() < Date.now() &&
                !proposal.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => executeProposal(proposal.proposalId)}
                  >
                    Execute Proposal{" "}
                    {proposal.yesVotes > proposal.noVotes ? "(Yes)" : "(No)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  };

  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  return (
    <main className={styles.main}>
      <div>
        <div className={styles.container}>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div>
            <img className={styles.image} src="/cryptodevs.svg" />
          </div>
          {!walletConnected ? (
            <button className={styles.button} onClick={handleConnect}>
              {loading ? (
                <span>Connecting...</span>
              ) : (
                <span>Connect Wallet</span>
              )}
            </button>
          ) : (
            <span>
              <b>Wallet Connected</b>
            </span>
          )}
        </div>

        {walletConnected ? (
          <div className={styles.containerInfo}>
            <p className={styles.description}>
              <b>Welcome to the DAO!</b>
            </p>
            <div className={styles.descriptionInfo}>
              <p>Your CryptoDevs NFT Balance: {nftBalance}</p>
              <p>DAO Treasury Balance: {treasuryBalance} ETH</p>
              <p>Total Number of Proposals: {numProposals}</p>
            </div>

            <div className={styles.flex}>
              <button
                className={styles.button}
                onClick={() => setSelectedTab("Create Proposal")}
              >
                Create Proposal
              </button>
              <button
                className={styles.button}
                onClick={() => setSelectedTab("View Proposals")}
              >
                View Proposal
              </button>
            </div>
            {renderTabs()}
          </div>
        ) : null}
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </main>
  );
}
