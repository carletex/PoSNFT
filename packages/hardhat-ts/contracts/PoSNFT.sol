pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ToDo. Mint price.
// ToDo. SVG Generation on tokenURI
// ToDo. Metadata on chain generation
// ToDo. % for BG
contract PosNFT is ERC721, Ownable {

  // ToDo. July?
  uint256 public constant FIRST_BLOCK = 14885900;
  // ToDo. December?
  uint256 public constant LAST_BLOCK = 14905900;

  // ToDo. Should come from Oracle.
  // uint public firstPosBlock = 14905900;

  constructor() ERC721("PosNFT", "PNFT") {}

  function _baseURI() internal view virtual override returns (string memory) {
    return "https://ipfs.io/ipfs/";
  }

  function mint(address _to, uint256 _blockNumber) public {
    require(_blockNumber >= FIRST_BLOCK && _blockNumber <= LAST_BLOCK, "Block number off limits");
    _mint(_to, _blockNumber);
  }

  // ToDo. Private (public for testing)
  // ToDo. Remove oracleFirstPosBlock => use mock.
  function _getWinner(uint256 _oracleFirstPosBlock) public view returns (address) {
    // require(firstPosBlock > 0, "First PoS block not set yet");
//    console.log(super.ownerOf(_oracleFirstPosBlock));

    // Exact match
    // ????????? Not working. use call? (bool, data)
//    (bool success, bytes memory result) = address(this).call(abi.encodeWithSignature("ownerOf(uint256)", _oracleFirstPosBlock));
//    if (success) {
//      console.log(success);
//      console.log(super.ownerOf(_oracleFirstPosBlock));
//      // ToDo. How can we use "result"?
//      return super.ownerOf(_oracleFirstPosBlock);
//    }
    try ownerOf(_oracleFirstPosBlock) returns (address ownerAddress) {
      return (ownerAddress);
    } catch Error(string memory _) {}

    // Before match
    if (_oracleFirstPosBlock <= FIRST_BLOCK) {
      return super.ownerOf(FIRST_BLOCK);
    }
    // After match
    if (_oracleFirstPosBlock >= LAST_BLOCK) {
      return super.ownerOf(LAST_BLOCK);
    }

    // In between match, with no owner => search for closest.

    // Shouldn't happen.
    revert();
  }
}
