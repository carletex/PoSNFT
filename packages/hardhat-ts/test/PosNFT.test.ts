import '../helpers/hardhat-imports';
import './helpers/chai-imports';

import { expect } from 'chai';
import { PosNFT__factory } from 'generated/contract-types';
import hre from 'hardhat';
import { getHardhatSigners } from 'tasks/functions/accounts';

import { PosNFT } from '../generated/contract-types/PosNFT';

describe('PosNFT', function () {
  let PosNFTContract: PosNFT;

  beforeEach(async () => {
    const { deployer } = await getHardhatSigners(hre);
    const factory = new PosNFT__factory(deployer);
    PosNFTContract = await factory.deploy();
  });

  it('Should revert when trying to MINT an off-limit blockNumber NFT', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const firstBlock = await PosNFTContract.FIRST_BLOCK();
    const lastBlock = await PosNFTContract.LAST_BLOCK();

    await expect(PosNFTContract.mint(user1.address, firstBlock.sub(1))).to.be.reverted;
    await expect(PosNFTContract.mint(user1.address, lastBlock.add(1))).to.be.reverted;
  });

  it('Should allow to MINT a valid blockNumber NFT', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const firstBlock = await PosNFTContract.FIRST_BLOCK();
    const mintTx = await PosNFTContract.mint(user1.address, firstBlock);
    await mintTx.wait();

    expect(await PosNFTContract.ownerOf(firstBlock)).to.equal(user1.address);
  });

  it("Shouldn't allow to MINT a repeated blockNumber NFT", async () => {
    const { user1 } = await getHardhatSigners(hre);

    const firstBlock = await PosNFTContract.FIRST_BLOCK();
    const mintTx = await PosNFTContract.mint(user1.address, firstBlock);
    await mintTx.wait();

    await expect(PosNFTContract.mint(user1.address, firstBlock)).to.be.reverted;
  });

  // ToDo. We need to fix the exact match => catch the revert.
  it('Should get the winner (exact match)', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const mintBlockNumber = (await PosNFTContract.LAST_BLOCK()).sub(100);
    const mintTx = await PosNFTContract.mint(user1.address, mintBlockNumber);
    await mintTx.wait();

    expect(await PosNFTContract._getWinner(mintBlockNumber)).to.be.equal(user1.address);
  });

  it('Should get the winner (before match)', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const firstBlock = await PosNFTContract.FIRST_BLOCK();
    const mintTx = await PosNFTContract.mint(user1.address, firstBlock);
    await mintTx.wait();

    expect(await PosNFTContract._getWinner(firstBlock.sub(100))).to.be.equal(user1.address);
  });

  it('Should get the winner (after match)', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const lastBlock = await PosNFTContract.LAST_BLOCK();
    const mintTx = await PosNFTContract.mint(user1.address, lastBlock);
    await mintTx.wait();

    expect(await PosNFTContract._getWinner(lastBlock.add(1000))).to.be.equal(user1.address);
  });

  it('Should get the winner (in between no exact match)', async () => {
    const { user1, user2 } = await getHardhatSigners(hre);

    const lastBlock = await PosNFTContract.LAST_BLOCK();
    const user1BlockSelection = lastBlock.sub(100);
    const user2BlockSelection = lastBlock.sub(200);

    const winnerBlock = lastBlock.sub(160);

    const mintUser1Tx = await PosNFTContract.mint(user1.address, user1BlockSelection);
    await mintUser1Tx.wait();

    const mintUser2Tx = await PosNFTContract.mint(user2.address, user2BlockSelection);
    await mintUser2Tx.wait();

    expect(await PosNFTContract._getWinner(winnerBlock)).to.be.equal(user2.address);
  });
});
