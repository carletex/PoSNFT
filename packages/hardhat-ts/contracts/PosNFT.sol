// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import 'base64-sol/base64.sol';

interface IPosBlockIncentivizedOracle {
  function getFirstRegisteredPosBlock() external view returns (uint256);
}

contract PosNFT is ERC721Enumerable, Ownable {
  using Strings for uint256;

  address public PosBlockIncentivizedOracleAddress;
  address public buidlGuidl = 0x97843608a00e2bbc75ab0C1911387E002565DEDE;

  uint256 public MINT_PRICE = 0.01 ether;

  bool public claimed = false;

  constructor(address _PosBlockIncentivizedOracleAddress) ERC721("PosNFT", "PNFT") {
    PosBlockIncentivizedOracleAddress = _PosBlockIncentivizedOracleAddress;
  }

  function mint(address _to, uint256 _blockNumber) external payable {
    require(!claimed, "Game is over :)");
    require(msg.value >= MINT_PRICE, "Insufficient ETH amount");

    _mint(_to, _blockNumber);
  }

  function claim() public {
    require(!claimed, "Already claimed");
    uint256 oracleFirstPosBlock = IPosBlockIncentivizedOracle(PosBlockIncentivizedOracleAddress).getFirstRegisteredPosBlock();
    require(oracleFirstPosBlock > 0, "First PoS block not set yet");

    address winner = getWinner(oracleFirstPosBlock);
    require(winner != address(0), "No winners");

    // 90% for the winner
    (bool sentWinner,) = winner.call{value: (address(this).balance / 100) * 90}("");
    // Remaining (10%) goes for the buidlGuidl
    (bool sentBG,) = buidlGuidl.call{value: address(this).balance}("");

    claimed = true;
  }

  function getWinner(uint256 _winnerBlock) public view returns (address) {
    // Exact match.
    if (super._exists(_winnerBlock)) {
      return super.ownerOf(_winnerBlock);
    }

    // No match => search for closest.
    uint256 indexShift = 0;
    while (indexShift < 100) {
      indexShift++;
      // ToDo. Handle equal distance?. RN the closest below wins on equal distance.
      if (super._exists(_winnerBlock - indexShift)) {
        return super.ownerOf(_winnerBlock - indexShift);
      }

      if (super._exists(_winnerBlock + indexShift)) {
        return super.ownerOf(_winnerBlock + indexShift);
      }
    }

    // No winner
    return address(0);
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
    require(_exists(id), "Token Id doesn't exist");
    string memory name = string(abi.encodePacked('PoS Block #', id.toString()));
    string memory description = string(abi.encodePacked('First PoS Block Number guess'));
    string memory image = Base64.encode(bytes(generateSVGofTokenById(id)));

    return string(
      abi.encodePacked(
        'data:application/json;base64,',
        Base64.encode(
          bytes(
            abi.encodePacked(
              '{',
                '"name":"', name,'",',
                '"description":"',description,'",',
                '"image": "data:image/svg+xml;base64,', image,'"',
              '}'
            )
          )
        )
      )
    );
  }

  function generateSVGofTokenById(uint256 id) internal pure returns (string memory) {
    string memory svg = string(abi.encodePacked(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80px" height="40px">',
      '<text x="50%" y="15" dominant-baseline="middle" text-anchor="middle" stroke-width="25">PoS Block</text>',
      '<text x="50%" y="32" dominant-baseline="middle" text-anchor="middle">#',id.toString(),'</text>',
      '</svg>'
    ));

    return svg;
  }

  receive() external payable {}
}
