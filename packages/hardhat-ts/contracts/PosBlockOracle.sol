// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract PosBlockOracle {
  uint256 firstRegisteredPosBlock = 0;
  event RegisterPos(uint256 _blockNumber, address _setter);

  function setPosBlock() public {
    require(firstRegisteredPosBlock == 0, "First registered PoS Block already set");
    require(isPosActive(), "We are still on PoW");

    firstRegisteredPosBlock = block.number;
    emit RegisterPos(firstRegisteredPosBlock, msg.sender);
  }

  function getFirstRegisteredPosBlock() public view returns (uint256) {
    require(firstRegisteredPosBlock >= 0, "PoS Block not set yet");
    return firstRegisteredPosBlock;
  }

  function isPosActive() public view returns (bool) {
    return block.difficulty > 2**64;
  }
}
