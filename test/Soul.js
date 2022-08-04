const { expect } = require("chai");

describe('Soul', () => {
  let soul, signers, signer, user1;

  beforeEach(async () => {
    const Soul = await hre.ethers.getContractFactory("Soul");

    soul = await Soul.deploy();

    signer = await hre.ethers.getSigner();
    signers = await hre.ethers.getSigners();
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

  it ('Locks NFT', async() => {
    const mintTx = await soul.safeMint(signer.address, 'www.test.com/1');
    await mintTx.wait();

    expect(await soul.locked('1')).to.equal(false);

    const boundTx = await soul.bound('1');
    await boundTx.wait();

    expect(await soul.locked('1')).to.equal(true);
    await expect(soul.transferFrom(signer.address, signers[1].address, '1')).to.revertedWith('Bonded token');
  });
});