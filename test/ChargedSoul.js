const { expect } = require('chai');
const { ethers } = require('hardhat');

// Charged Particles imports
const Charged = require("@charged-particles/charged-js-sdk");

const ChargedSettingsAbi = require("@charged-particles/protocol-subgraph/abis/ChargedSettings.json");
const ChargedParticlesAbi = require("@charged-particles/protocol-subgraph/abis/ChargedParticles.json");
const chargedParticlesMainnetAddress = require("@charged-particles/protocol-subgraph/networks/mainnet.json");
const chargedSettingsMainnetAddress = chargedParticlesMainnetAddress.chargedSettings.address; 
const chargedParticlesContractMainnetAddress = chargedParticlesMainnetAddress.chargedParticles.address; 

let customNFTdeployedAddress, adminAddress, provider, customNFT, signers;

describe("Charged Particles whitelist ", async() => {
  const ChargedParticlesContract = new ethers.Contract(chargedParticlesContractMainnetAddress, ChargedParticlesAbi);
  const ChargedSettingContract = new ethers.Contract(chargedSettingsMainnetAddress, ChargedSettingsAbi);
  provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC_URL_MAINNET, 1);
  
  beforeEach(async() => {
    // Deploy custom NFT
    const CustomNFT = await ethers.getContractFactory("Soul"); 
    customNFT = await CustomNFT.deploy();
    const customNFTdeployed = await customNFT.deployed();
    
    // Get Charged Particle owner address
    adminAddress = await ChargedParticlesContract.connect(provider).owner();
    customNFTdeployedAddress = customNFTdeployed.address;
    
    // impersonate admin account 
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [adminAddress],
    });
    
    const owner = await ethers.getSigner(adminAddress);
    const whiteListTx = await ChargedSettingContract.connect(owner).enableNftContracts([customNFTdeployedAddress]);
    await whiteListTx.wait();

    signers = await ethers.getSigners();
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
  
  it.only ('Mints, locks and energize', async() => {
    const minter = signers[1];
    const soulNFT = await customNFT.connect(minter);

    const mintLockTx = await soulNFT.lockMint(minter.address, 'www.test.com');
    await mintLockTx.wait();

    expect(await soulNFT.ownerOf(1)).to.equal(minter.address);
    expect(await soulNFT.locked(1)).to.equal(true);
    await expect(soulNFT.transferFrom(
      minter.address,
      signers[2].address,
      1
    )).to.revertedWith("Locked token");
    // const provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC_URL_MAINNET, 1);
    const charged = new Charged.default({providers: signers[0].provider, signer: minter.provider.getSigner() });
    // const nft = charged.NFT(soulNFT.address, 1);

    // const chargedProvider = charged.getState();
    // console.log(chargedProvider);

    const stateAddresses = await charged.utils.getStateAddress();

    expect(stateAddresses).toHaveProperty('1', { "status": "fulfilled", "value": "0x48974C6ae5A0A25565b0096cE3c81395f604140f" });

    // console.log(minter.provider);
    // const nft = charged.NFT(chargedParticlesMainnetAddress.protonB.address, 1);
    // const bondCountBeforeDeposit = await nft.getBonds('generic.B');
    // console.log(bondCountBeforeDeposit);
  });
});
