pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPosOracle {
  function getFirstPosBlock() external view returns (uint256);
}

// ToDo. Mint price.
// ToDo. SVG Generation on tokenURI
// ToDo. Metadata on chain generation
// ToDo. % for BG
contract PosNFT is ERC721, Ownable {
  address public PosOracleAddress;

  // ToDo. July?
  uint256 public constant FIRST_BLOCK = 14885900;
  // ToDo. December?
  uint256 public constant LAST_BLOCK = 14905900;

  // ToDo. Should come from Oracle.
  // uint public firstPosBlock = 14905900;

  constructor(address _PosOracleAddress) ERC721("PosNFT", "PNFT") {
    PosOracleAddress = _PosOracleAddress;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return "https://ipfs.io/ipfs/";
  }

  function mint(address _to, uint256 _blockNumber) public {
    require(_blockNumber >= FIRST_BLOCK && _blockNumber <= LAST_BLOCK, "Block number off limits");
    _mint(_to, _blockNumber);
  }

  // ToDo. Private (public for testing)
  // ToDo. Remove oracleFirstPosBlock => use mock.
  function _getWinner() public view returns (address) {
    uint256 oracleFirstPosBlock = IPosOracle(PosOracleAddress).getFirstPosBlock();
     require(oracleFirstPosBlock > 0, "First PoS block not set yet");

    // Exact match.
    if (super._exists(oracleFirstPosBlock)) {
      return super.ownerOf(oracleFirstPosBlock);
    }

    // Before match. The merge happened before FIRST_BLOCK
    // (the first tokenID, representing a blockNumber, we allowed to mint).
    if (oracleFirstPosBlock <= FIRST_BLOCK) {
      return super.ownerOf(FIRST_BLOCK);
    }

    // After match. The merge happened after LAST_BLOCK.
    // (the last tokenID, representing a blockNumber, we allowed to mint).
    if (oracleFirstPosBlock >= LAST_BLOCK) {
      return super.ownerOf(LAST_BLOCK);
    }

    // In-between match => search for closest.
    uint256 indexShift = 0;
    // ToDo. Handle equal distance?. RN the closest below wins on equal distance.
    // Loop until we find the winner.
    while (oracleFirstPosBlock - indexShift > FIRST_BLOCK && oracleFirstPosBlock + indexShift < LAST_BLOCK) {
      indexShift++;
      if (super._exists(oracleFirstPosBlock - indexShift)) {
        return super.ownerOf(oracleFirstPosBlock - indexShift);
      }

      if (super._exists(oracleFirstPosBlock + indexShift)) {
        return super.ownerOf(oracleFirstPosBlock + indexShift);
      }
    }

    // Should only happen if we sell 0 NFTs :)
    revert("No winners");
  }
}
