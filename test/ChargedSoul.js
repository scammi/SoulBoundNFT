const { expect } = require("chai");
const { ethers } = require("hardhat");

// Charged Particles imports
const ChargedSettingsAbi = require("@charged-particles/protocol-subgraph/abis/ChargedSettings.json");
const ChargedParticlesAbi = require("@charged-particles/protocol-subgraph/abis/ChargedParticles.json");
const chargedParticlesMainnetAddress = require("@charged-particles/protocol-subgraph/networks/mainnet.json");
const chargedSettingsMainnetAddress = chargedParticlesMainnetAddress.chargedSettings.address; 
const chargedParticlesContractMainnetAddress = chargedParticlesMainnetAddress.chargedParticles.address; 

let customNFTdeployedAddress, adminAddress, provider;

describe("Charged Particles whitelist ", async() => {
  provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC_URL_MAINNET, 1);
  const ChargedParticlesContract = new ethers.Contract(chargedParticlesContractMainnetAddress, ChargedParticlesAbi);
  const ChargedSettingContract = new ethers.Contract(chargedSettingsMainnetAddress, ChargedSettingsAbi);

  beforeEach(async() => {
    // Deploy custom NFT
    const CustomNFT = await ethers.getContractFactory("Soul"); 
    const customNFT = await CustomNFT.deploy();
    const customNFTdeployed = await customNFT.deployed();
  
    // Get Charged Particle owner address
    adminAddress = await ChargedParticlesContract.connect(provider).owner();
    customNFTdeployedAddress = customNFTdeployed.address;
  
    // impersonate admin account 
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [adminAddress],
    });
  });

  afterEach(async () => {
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [adminAddress],
    });
  });
  
  it ("Interacts with charged particle protocol", async() => {
    const contractResponse = await ChargedParticlesContract.connect(provider).getStateAddress();
    expect(contractResponse).to.be.equal(chargedParticlesMainnetAddress.chargedState.address)
  });
  
  it ("Become admin and whitelist custom token.", async() => {
    // Whitelist custom NFT
    const owner = await ethers.getSigner(adminAddress);
    const whiteListTx = await ChargedSettingContract.connect(owner).enableNftContracts([customNFTdeployedAddress]);
    await whiteListTx.wait();
  });

  // it ('Mints, locks and energize', async() => {

  // });
});
