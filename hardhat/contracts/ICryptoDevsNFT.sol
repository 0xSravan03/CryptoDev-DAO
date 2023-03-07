// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ICryptoDevsNFT {
    function balanceOf(address _owner) external view returns (uint256);

    function tokenOfOwnerByIndex(
        address _owner,
        uint256 _index
    ) external view returns (uint256);
}
