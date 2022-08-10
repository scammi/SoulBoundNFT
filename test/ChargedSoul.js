const { expect } = require("chai");
const { ethers } = require("hardhat");

// Charged Particles imports
const ChargedSettingsAbi = require("@charged-particles/protocol-subgraph/abis/ChargedSettings.json");
const ChargedParticlesAbi = require("@charged-particles/protocol-subgraph/abis/ChargedParticles.json");
const chargedParticlesMainnetAddress = require("@charged-particles/protocol-subgraph/networks/mainnet.json");

describe("Charged Particles whitelist ", async function () {

  const chargedSettingsMainnetAddress = chargedParticlesMainnetAddress.chargedSettings.address; 
  const chargedParticlesContractMainnetAddress = chargedParticlesMainnetAddress.chargedParticles.address; 

  const provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC_URL_MAINNET, 1);

  const ChargedParticlesContract = new ethers.Contract(chargedParticlesContractMainnetAddress, ChargedParticlesAbi);
  const ChargedSettingContract = new ethers.Contract(chargedSettingsMainnetAddress, ChargedSettingsAbi);

  it ("Interacts with charged particle protocol", async() => {
    const contractResponse = await ChargedParticlesContract.connect(provider).getStateAddress();
    expect(contractResponse).to.be.equal(chargedParticlesMainnetAddress.chargedState.address)
  });

  it ("Become admin and whitelist custom token.", async() => {
    // Deploy custom NFT
    const CustomNFT = await ethers.getContractFactory("Soul"); 
    const customNFT = await CustomNFT.deploy();
    const customNFTdeployed = await customNFT.deployed();

    const customNFTdeployedAddress = customNFTdeployed.address;

    // this should revert since you are not the admin
    const [ signer ] = await ethers.getSigners();
    
    await expect(ChargedSettingContract.connect(signer).enableNftContracts([customNFTdeployedAddress])).to
      .be.revertedWith('Ownable: caller is not the owner');

    // Get Charged Particle owner address
    const adminAddress = await ChargedParticlesContract.connect(provider).owner();

    // impersonate admin account 
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [adminAddress],
    });

    // Whitelist custom NFT
    const owner = await ethers.getSigner(adminAddress);
    const whiteListTx = await ChargedSettingContract.connect(owner).enableNftContracts([customNFTdeployedAddress]);
    await whiteListTx.wait();

    console.log(whiteListTx)
  });
});
