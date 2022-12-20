// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./lib/BlackholePrevention.sol";
import "./lib/Particle.sol";
import "./ERC5192.sol";

contract Soul is 
  IERC5192, 
  ERC721, 
  ERC721URIStorage, 
  Particle
{
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIdCounter;

  error NotTokenOwner();
  error BondedToken();

  mapping (uint256 => bool) public lockedTokens;

  constructor() ERC721("Soul", "SBT") {}

  function safeMint(address to, string memory uri) public payable returns(uint256) {
    _tokenIdCounter.increment();
    uint256 tokenId = _tokenIdCounter.current();
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);

    _tokenCreator[tokenId] = msg.sender;

    return tokenId;
  }

  function lockMint(address to, string memory uri) public payable returns(uint256) {
    uint256 tokenId = safeMint(to, uri);
    lockToken(tokenId);
    emit Locked(tokenId);

    return tokenId;
  }

  function lockToken(uint256 tokenId) public {
    onlyTokenOwner(tokenId);   
    lockedTokens[tokenId] = true;
    emit Locked(tokenId);
  }

  function unlockToken(uint256 tokenId) private {
    lockedTokens[tokenId] = false;
    emit Unlocked(tokenId);
  }

  function locked(uint256 tokenId) 
    external 
    view 
    override(IERC5192) 
    returns (bool) 
  {
    return lockedTokens[tokenId];
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function burn(uint256 tokenId) public {
    onlyTokenOwner(tokenId); 
    _burn(tokenId);
  }


  function onlyTokenOwner(uint256 tokenId) view internal{
    if (ownerOf(tokenId) != msg.sender ) {
     revert NotTokenOwner();
    }
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) 
    internal
    virtual 
    override(ERC721)
  {
    if (lockedTokens[tokenId] == true) {
      revert BondedToken();
    }
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    unlockToken(tokenId);
    super._burn(tokenId);
  }
}
