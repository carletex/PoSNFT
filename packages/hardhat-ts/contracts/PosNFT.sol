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

    address winner = ownerOf(oracleFirstPosBlock);

    // 90% for the winner
    (bool sentWinner,) = winner.call{value: (address(this).balance / 100) * 90}("");
    // Remaining (10%) goes for the buidlGuidl
    (bool sentBG,) = buidlGuidl.call{value: address(this).balance}("");

    claimed = true;
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
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">',
      '<style>.base{font-family:serif;font-size:14px;}.title{font-weight:bold;}</style>',
      '<rect width="100%" height="100%" fill="#9cdbcf" />',
      '<text x="50%" y="40" dominant-baseline="middle" text-anchor="middle" class="base title">PoS Block</text>',
      '<text x="50%" y="60" dominant-baseline="middle" text-anchor="middle" class="base">#',id.toString(),'</text>',
      '</svg>'
    ));

    return svg;
  }

  receive() external payable {}
}
