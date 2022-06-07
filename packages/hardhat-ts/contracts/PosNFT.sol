// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IPosBlockOracle {
  function getFirstRegisteredPosBlock() external view returns (uint256);
}

// ToDo. SVG Generation on tokenURI
// ToDo. Metadata on chain generation
contract PosNFT is ERC721, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter public totalCounter;

  address public PosBlockOracleAddress;
  address public buidlGuidl = 0x97843608a00e2bbc75ab0C1911387E002565DEDE;

  uint256 public MINT_PRICE = 0.01 ether;

  bool public claimed = false;

  constructor(address _PosBlockOracleAddress) ERC721("PosNFT", "PNFT") {
    PosBlockOracleAddress = _PosBlockOracleAddress;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return "https://ipfs.io/ipfs/";
  }

  function mint(address _to, uint256 _blockNumber) external payable {
    require(!claimed, "Game is over :)");
    require(msg.value >= MINT_PRICE, "Insufficient ETH amount");

    _mint(_to, _blockNumber);
    totalCounter.increment();
  }

  function claim() public {
    require(!claimed, "Already claimed");
    uint256 oracleFirstPosBlock = IPosBlockOracle(PosBlockOracleAddress).getFirstRegisteredPosBlock();
    require(oracleFirstPosBlock > 0, "First PoS block not set yet");

    address winner = _getWinner(oracleFirstPosBlock);
    // 90% for the winner
    (bool sentWinner,) = winner.call{value: (address(this).balance / 100) * 90}("");
    // Remaining (10%) goes for the buidlGuidl
    (bool sentBG,) = buidlGuidl.call{value: address(this).balance}("");

    claimed = true;
  }

  function _getWinner(uint256 _winnerBlock) internal view returns (address) {
    // Exact match.
    if (super._exists(_winnerBlock)) {
      return super.ownerOf(_winnerBlock);
    }

    // No match => search for closest.
    uint256 indexShift = 0;
    // ToDo. Handle equal distance?. RN the closest below wins on equal distance.
    // Loop until we find the winner. 60000 blocks ~ 10 days
    while (indexShift < 60000) {
      indexShift++;
      if (super._exists(_winnerBlock - indexShift)) {
        return super.ownerOf(_winnerBlock - indexShift);
      }

      if (super._exists(_winnerBlock + indexShift)) {
        return super.ownerOf(_winnerBlock + indexShift);
      }
    }

    revert("No winners");
  }

  receive() external payable {}
}