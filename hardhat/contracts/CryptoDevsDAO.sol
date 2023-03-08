// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IFakeNFTMarketplace.sol";
import "./ICryptoDevsNFT.sol";

contract CryptoDevsDAO is Ownable {
    IFakeNFTMarketplace nftMarketplace;
    ICryptoDevsNFT cryptoDevsNFT;

    struct Proposal {
        uint256 nftTokenId; // which nft needs to be purchased.
        uint256 deadline;
        uint256 yesVotes; // count of 'Yes' votes for this proposal
        uint256 noVotes; // count of 'No' votes for this proposal
        bool executed;
        // voters - a mapping of CryptoDevsNFT tokenIDs to booleans indicating whether that NFT has already been used to cast a vote or not
        mapping(uint256 => bool) voters;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public numProposals;

    enum Vote {
        Yes,
        No
    }

    constructor(address _nftMarketplace, address _cryptoDevsNFT) payable {
        nftMarketplace = IFakeNFTMarketplace(_nftMarketplace);
        cryptoDevsNFT = ICryptoDevsNFT(_cryptoDevsNFT);
    }

    modifier nftHolderOnly() {
        require(
            cryptoDevsNFT.balanceOf(msg.sender) > 0,
            "You are not holding any NFTs (Not DAO Member)"
        );
        _;
    }

    modifier activeProposalOnly(uint256 _proposalIndex) {
        require(
            proposals[_proposalIndex].deadline > block.timestamp,
            "Deadline Exceeded"
        );
        _;
    }

    modifier inactiveProposalOnly(uint256 _proposalIndex) {
        require(
            proposals[_proposalIndex].deadline <= block.timestamp,
            "Wait until deadline is over"
        );
        require(!proposals[_proposalIndex].executed, "Already executed");
        _;
    }

    receive() external payable {}

    fallback() external payable {}

    // create propoal function
    function createProposal(uint256 _nftTokenId) external nftHolderOnly {
        require(nftMarketplace.available(_nftTokenId), "NFT already Sold");
        Proposal storage proposal = proposals[numProposals];
        proposal.nftTokenId = _nftTokenId;
        proposal.deadline = block.timestamp + 5 minutes;
        numProposals++;
    }

    function voteOnProposal(
        uint256 _proposalIndex,
        Vote vote
    ) external nftHolderOnly activeProposalOnly(_proposalIndex) {
        Proposal storage proposal = proposals[_proposalIndex];
        uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);

        uint256 numVotes = 0;

        for (uint256 i = 0; i < voterNFTBalance; i++) {
            uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);
            if (proposal.voters[tokenId] == false) {
                numVotes++;
                proposal.voters[tokenId] = true;
            }
        }

        require(numVotes > 0, "Already Voted");

        if (vote == Vote.Yes) {
            proposal.yayVotes += numVotes;
        } else {
            proposal.noVotes += numVotes;
        }
    }

    function executeProposal(
        uint256 _proposalIndex
    ) external nftHolderOnly inactiveProposalOnly(_proposalIndex) {
        Proposal storage proposal = proposals[_proposalIndex];

        if (proposal.yesVotes > proposal.noVotes) {
            uint256 nftPrice = nftMarketplace.getPrice();
            require(
                address(this).balance >= nftPrice,
                "Not enough fund to purchase NFT"
            );
            nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId); // purchasing nft.
        }
        proposal.executed = true;
    }

    function withdraw() external onlyOwner {
        uint256 _amount = address(this).balance;
        require(_amount > 0, "Not Enough Fund");
        (bool sent, ) = payable(owner()).call{value: _amount}("");
        require(sent, "Transfer Failed");
    }
}
