const { expect, should } = require("chai");
const { ethers } = require("hardhat");

describe('Soul', () => {
  let soul, signers, signer, user1;

  beforeEach(async () => {
    const Soul = await hre.ethers.getContractFactory("Soul");

    soul = await Soul.deploy();
    signer = await hre.ethers.getSigner();
    signers = await hre.ethers.getSigners();
    user1 = signers[1];
  });

  it ('Should deploy', async () => {
    expect(await soul.name()).to.equal('Soul')
  });

  it ('Mints one NFT and transfer', async () => {
    const mintTx = await soul.safeMint(signer.address, 'www.test.com/1');
    await mintTx.wait();
    expect(await soul.ownerOf('1')).to.equal(signer.address);
    const transferTx = await soul.transferFrom(signer.address, signers[1].address, '1');
    await transferTx.wait();
    expect(await soul.ownerOf('1')).to.equal(signers[1].address);
  });

  it ('Mints and locks', async() => {
    const mintTx = await soul.safeMint(signer.address, 'www.test.com/1');
    await mintTx.wait()

    expect(await soul.locked('1')).to.equal(false);
    expect(await soul.ownerOf('1')).to.equal(signer.address);

    expect(await soul.creatorOf('1')).to.be.equal(signer.address);

    await expect(soul.lockToken('1')).to.emit(soul, 'Locked').withArgs(1);

    expect(await soul.locked('1')).to.equal(true);
    await expect(soul.transferFrom(signer.address, signers[1].address, '1')).to.revertedWithCustomError(soul, 'BondedToken');
    expect(await soul.ownerOf('1')).to.equal(signer.address);
  });

  it ('lockMint: Locks immediately after transfer', async() => {
    await expect(soul.lockMint(signer.address, 'www.test.com/1')).to.emit(soul, 'Locked').withArgs(1);

    expect(await soul.locked('1')).to.equal(true);
    await expect(soul.transferFrom(signer.address, signers[1].address, '1')).to.revertedWithCustomError(soul, 'BondedToken');
  });

  it ('Burns token',  async() => {
    const mintTx = await soul.lockMint(signer.address, 'www.test.com/1');
    await mintTx.wait()

    expect(await soul.balanceOf(signer.address)).to.be.eq(1);
    await expect(soul.burn('1')).to.emit(soul, "Unlocked");

    expect(await soul.balanceOf(signer.address)).to.be.eq(0);
  });

  it ('Only owner of the nft can lock it', async() => {
    const mintTx = await soul.safeMint(signer.address, 'www.test.com/1');
    await mintTx.wait()

    await expect(soul.connect(user1).lockToken('1')).to.revertedWithCustomError(soul, 'NotTokenOwner');

    const lockTx = await soul.lockToken('1');
    await lockTx.wait();

    expect(await soul.locked('1')).to.equal(true);
  });

  it ('Only owner of the nft burn it', async() => {
    const mintTx = await soul.safeMint(signer.address, 'www.test.com/1');
    await mintTx.wait();

    expect(await soul.balanceOf(signer.address)).to.be.equal(1);

    await expect(soul.connect(user1).burn('1')).to.revertedWithCustomError(soul, 'NotTokenOwner');
    expect(await soul.balanceOf(signer.address)).to.be.equal(1);

    const burnTx = await soul.connect(signer).burn('1');
    await burnTx.wait();

    expect(await soul.balanceOf(signer.address)).to.be.equal(0);
  });

  it ('Mints on payable and withdraw eth', async() => {
    const mintTx = await soul.safeMint(signer.address, 'www.test.com/1', { value: ethers.utils.parseEther('1' )});
    await mintTx.wait();

    expect(await soul.balanceOf(signer.address)).to.be.equal(1);

    const balanceAfterDeposit = await signer.provider.getBalance(soul.address);
    expect(ethers.utils.formatEther(balanceAfterDeposit.toString())).to.eq('1.0');

    const mint2Tx = await soul.lockMint(signer.address, 'www.test.com/1', { value: ethers.utils.parseEther('1') });
    await mint2Tx.wait()

    expect(await soul.balanceOf(signer.address)).to.be.eq(2);

    const balanceAftersSecondDeposit = await signer.provider.getBalance(soul.address);
    expect(ethers.utils.formatEther(balanceAftersSecondDeposit.toString())).to.eq('2.0');

    await expect(soul.withdrawEther(user1.address, balanceAfterDeposit)).to.emit(soul, 'WithdrawStuckEther');

    const balanceAftersWithdraw = await signer.provider.getBalance(soul.address);
    expect(ethers.utils.formatEther(balanceAftersWithdraw.toString())).to.eq('1.0');
  });
});