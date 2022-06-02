import '../helpers/hardhat-imports';
import './helpers/chai-imports';

import { expect } from 'chai';
import { ethers } from 'ethers';
import { deployMockContract } from 'ethereum-waffle';
import { Contract } from 'ethers';
import { IPosOracle__factory, PosNFT, PosNFT__factory } from 'generated/contract-types';
import hre from 'hardhat';
import { ABI } from 'hardhat-deploy/dist/types';
import { getHardhatSigners } from 'tasks/functions/accounts';

describe('PosNFT', function () {
  let PosNFTContract: PosNFT;
  let mockPosOracle: Contract;

  beforeEach(async () => {
    const { deployer } = await getHardhatSigners(hre);

    const PosOracleAbi: ABI = IPosOracle__factory.abi;
    mockPosOracle = await deployMockContract(deployer, PosOracleAbi);

    const factory = new PosNFT__factory(deployer);
    PosNFTContract = await factory.deploy(mockPosOracle.address);
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

  it('Should revert if trying to MINT a repeated blockNumber NFT', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const firstBlock = await PosNFTContract.FIRST_BLOCK();
    const mintTx = await PosNFTContract.mint(user1.address, firstBlock);
    await mintTx.wait();

    await expect(PosNFTContract.mint(user1.address, firstBlock)).to.be.reverted;
  });

  it('Should revert if the PoS block is not set on the Oracle', async () => {
    await mockPosOracle.mock.getFirstPosBlock.returns(ethers.utils.parseEther('0'));

    await expect(PosNFTContract._getWinner()).to.be.reverted;
  });

  it('Should get the winner (exact match)', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const mintBlockNumber = (await PosNFTContract.LAST_BLOCK()).sub(100);
    const mintTx = await PosNFTContract.mint(user1.address, mintBlockNumber);
    await mintTx.wait();

    await mockPosOracle.mock.getFirstPosBlock.returns(mintBlockNumber);

    expect(await PosNFTContract._getWinner()).to.be.equal(user1.address);
  });

  it('Should get the winner (before match)', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const firstBlock = await PosNFTContract.FIRST_BLOCK();
    const mintTx = await PosNFTContract.mint(user1.address, firstBlock);
    await mintTx.wait();

    await mockPosOracle.mock.getFirstPosBlock.returns(firstBlock.sub(100));

    expect(await PosNFTContract._getWinner()).to.be.equal(user1.address);
  });

  it('Should get the winner (after match)', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const lastBlock = await PosNFTContract.LAST_BLOCK();
    const mintTx = await PosNFTContract.mint(user1.address, lastBlock);
    await mintTx.wait();

    await mockPosOracle.mock.getFirstPosBlock.returns(lastBlock.add(100));

    expect(await PosNFTContract._getWinner()).to.be.equal(user1.address);
  });

  it('Should get the winner (in between no exact match)', async () => {
    const { user1, user2 } = await getHardhatSigners(hre);

    const lastBlock = await PosNFTContract.LAST_BLOCK();
    const user1BlockSelection = lastBlock.sub(100);
    const user2BlockSelection = lastBlock.sub(200);

    const mintUser1Tx = await PosNFTContract.mint(user1.address, user1BlockSelection);
    await mintUser1Tx.wait();

    const mintUser2Tx = await PosNFTContract.mint(user2.address, user2BlockSelection);
    await mintUser2Tx.wait();

    const winnerBlock = lastBlock.sub(160);
    await mockPosOracle.mock.getFirstPosBlock.returns(winnerBlock);

    expect(await PosNFTContract._getWinner()).to.be.equal(user2.address);
  });
});
