// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// PoS Block Incentivized Oracle.
contract PosBlockIncentivizedOracle {
  uint256 firstRegisteredPosBlock = 0;
  event RegisterPos(uint256 _blockNumber, address _setter);

  constructor() payable {}

  // Set the current block as the first PoS Block if:
  // - We are in PoS
  // - It's not set yet
  function setPosBlock() public {
    require(firstRegisteredPosBlock == 0, "First registered PoS Block already set");
    require(isPosActive(), "We are still on PoW");

    firstRegisteredPosBlock = block.number;
    emit RegisterPos(firstRegisteredPosBlock, msg.sender);

    // Reward the setter.
    (bool success,) = msg.sender.call{value: address(this).balance}("");
  }

  function getFirstRegisteredPosBlock() public view returns (uint256) {
    require(firstRegisteredPosBlock >= 0, "PoS Block not set yet");
    return firstRegisteredPosBlock;
  }

  // Check if we are in PoS.
  // @dev Check https://eips.ethereum.org/EIPS/eip-4399#using-264-threshold-to-determine-pos-blocks
  function isPosActive() public view returns (bool) {
    return block.difficulty > 2**64;
  }

  receive() external payable {}
}
