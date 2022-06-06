import '../helpers/hardhat-imports';
import './helpers/chai-imports';

import { expect } from 'chai';
import { deployMockContract } from 'ethereum-waffle';
import { BigNumber, Contract, ethers } from 'ethers';
import { IPosBlockOracle__factory, PosNFT, PosNFT__factory } from 'generated/contract-types';
import hre from 'hardhat';
import { ABI } from 'hardhat-deploy/dist/types';
import { getHardhatSigners } from 'tasks/functions/accounts';

describe('PosNFT', function () {
  let PosNFTContract: PosNFT;
  let mockPosBlockOracle: Contract;
  let mintPrice: BigNumber;

  beforeEach(async () => {
    const { deployer } = await getHardhatSigners(hre);

    const PosBlockOracle: ABI = IPosBlockOracle__factory.abi;
    mockPosBlockOracle = await deployMockContract(deployer, PosBlockOracle);

    const factory = new PosNFT__factory(deployer);
    PosNFTContract = await factory.deploy(mockPosBlockOracle.address);

    mintPrice = await PosNFTContract.MINT_PRICE();
  });

  it('Should allow to MINT a valid blockNumber NFT', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const blockNumber = 14914072;
    const mintTx = await PosNFTContract.mint(user1.address, blockNumber, {
      value: mintPrice,
    });
    await mintTx.wait();

    expect(await PosNFTContract.ownerOf(blockNumber)).to.equal(user1.address);
  });

  it('Should revert if trying to MINT a repeated blockNumber NFT', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const blockNumber = 14914072;
    const mintTx = await PosNFTContract.mint(user1.address, blockNumber, {
      value: mintPrice,
    });
    await mintTx.wait();

    await expect(PosNFTContract.mint(user1.address, blockNumber)).to.be.reverted;
  });

  it('Should revert if the user send less than the minting price', async function () {
    const { user1 } = await getHardhatSigners(hre);

    const sentPrice = mintPrice.sub(ethers.utils.parseUnits('1', 'wei'));
    const blockNumber = 14914072;

    const mintTx = PosNFTContract.mint(user1.address, blockNumber, {
      value: sentPrice,
    });

    await expect(mintTx).to.be.reverted;
  });

  it('Should revert if the PoS block is not set on the Oracle (getWinner)', async () => {
    await mockPosBlockOracle.mock.getFirstRegisteredPosBlock.returns(ethers.utils.parseEther('0'));

    await expect(PosNFTContract._getWinner()).to.be.reverted;
  });

  it('Should get the winner (exact match)', async () => {
    const { user1 } = await getHardhatSigners(hre);

    const blockNumber = 14914072;
    const mintTx = await PosNFTContract.mint(user1.address, blockNumber, {
      value: mintPrice,
    });
    await mintTx.wait();

    await mockPosBlockOracle.mock.getFirstRegisteredPosBlock.returns(blockNumber);

    expect(await PosNFTContract._getWinner()).to.be.equal(user1.address);
  });

  it('Should get the winner (no exact match)', async () => {
    const { user1, user2 } = await getHardhatSigners(hre);

    const user1BlockSelection = 14914100;
    const user2BlockSelection = 14914000;

    const mintUser1Tx = await PosNFTContract.mint(user1.address, user1BlockSelection, {
      value: mintPrice,
    });
    await mintUser1Tx.wait();

    const mintUser2Tx = await PosNFTContract.mint(user2.address, user2BlockSelection, {
      value: mintPrice,
    });
    await mintUser2Tx.wait();

    const winnerBlock = 14914040;
    await mockPosBlockOracle.mock.getFirstRegisteredPosBlock.returns(winnerBlock);

    expect(await PosNFTContract._getWinner()).to.be.equal(user2.address);
  });

  it('Should revert if the PoS block is not set on the Oracle (claim)', async () => {
    await mockPosBlockOracle.mock.getFirstRegisteredPosBlock.returns(ethers.utils.parseEther('0'));

    await expect(PosNFTContract.claim()).to.be.reverted;
  });

  it('Should pay the winner & BG on a valid claim', async () => {
    const { user1, user2 } = await getHardhatSigners(hre);

    const user1BlockSelection = 14914100;
    const user2BlockSelection = 14914000;

    const mintUser1Tx = await PosNFTContract.mint(user1.address, user1BlockSelection, {
      value: mintPrice,
    });
    await mintUser1Tx.wait();

    const mintUser2Tx = await PosNFTContract.mint(user2.address, user2BlockSelection, {
      value: mintPrice,
    });
    await mintUser2Tx.wait();

    const winnerBlock = 14914040;
    await mockPosBlockOracle.mock.getFirstRegisteredPosBlock.returns(winnerBlock);

    const contractBalance = await hre.ethers.provider.getBalance(PosNFTContract.address);

    const existingUser2Balance = await user2.getBalance();

    const claimTx = await PosNFTContract.claim();
    await claimTx.wait();
    const bgAddress: string = await PosNFTContract.buidlGuidl();

    const winnerPrize = contractBalance.mul(90).div(100);
    const winnerBalance = winnerPrize.add(existingUser2Balance);
    expect(await user2.getBalance()).to.be.equal(winnerBalance);

    expect(await hre.ethers.provider.getBalance(bgAddress)).to.be.equal(contractBalance.mul(10).div(100));
  });
});
