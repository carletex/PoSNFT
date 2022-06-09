// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// PoS Block Incentivized Oracle.
contract PosBlockIncentivizedOracle {
  event RegisterPos(uint256 _blockNumber, address _winner);

  uint256 firstRegisteredPosBlock = 0;
  address public winner;

  constructor() payable {}

  // Set the current block as the first PoS Block if:
  // - We are in PoS
  // - It's not set yet
  function setPosBlock() public {
    require(firstRegisteredPosBlock == 0, "PoS Block already set");
    require(isPosActive(), "We are still on PoW");

    firstRegisteredPosBlock = block.number;
    winner = msg.sender;

    emit RegisterPos(firstRegisteredPosBlock, msg.sender);
  }

  function getFirstRegisteredPosBlock() public view returns (uint256) {
    return firstRegisteredPosBlock;
  }

  function rewardWinner() public {
    require(firstRegisteredPosBlock > 0, "PoS Block not set");

    (bool sent, ) = winner.call{value: address(this).balance}("");
    require(sent, "Failed to send Ether");
  }

  // Check if we are in PoS.
  // @dev Check https://eips.ethereum.org/EIPS/eip-4399#using-264-threshold-to-determine-pos-blocks
  function isPosActive() public view returns (bool) {
    return block.difficulty > 2**64;
  }

  receive() external payable {
    require(firstRegisteredPosBlock == 0, "PoS Block already set");
  }

  // ToDo. Remove this.
  // Creating for testing this contract on testnets
  function _setPosBlockForce(uint _blockNumber) public {
    require(block.chainid != 1, "No mainnet");
    firstRegisteredPosBlock = _blockNumber;
    winner = msg.sender;
  }
}
