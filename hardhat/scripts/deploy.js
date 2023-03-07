const { ethers } = require("hardhat")

const CryptoDevsNFTAddress = "0x217f3aEAe122aC1bC7Ea63482e4d3FA52bb3Eb10"

/* 
    NFT-Marketplace Deployed to : 0x4D2E57e1eD68455De61686b14280b8cA1447F8bD
    CryptoDevsDAO Deployed to : 0x3679BEe50Ba6446205f1e719574498d3Fc1BfE9C
*/

async function main() {
    // deploying nft market place
    const fakeNftMarketFactory = await ethers.getContractFactory(
        "FakeNFTMarketplace"
    )
    const fakeNFTMarketplace = await fakeNftMarketFactory.deploy()
    await fakeNFTMarketplace.deployed()
    console.log(`NFT-Marketplace Deployed to : ${fakeNFTMarketplace.address}`)

    // deploying dao contract
    const cryptoDevsDaoFactory = await ethers.getContractFactory(
        "CryptoDevsDAO"
    )
    const cryptoDevsDao = await cryptoDevsDaoFactory.deploy(
        fakeNFTMarketplace.address,
        CryptoDevsNFTAddress,
        { value: ethers.utils.parseEther("0.1") }
    )
    await cryptoDevsDao.deployed()
    console.log(`CryptoDevsDAO Deployed to : ${cryptoDevsDao.address}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
