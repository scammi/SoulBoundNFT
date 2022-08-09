// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC5192.sol";

contract Soul is ERC721, IERC5192 ,ERC721URIStorage {
  using Counters for Counters.Counter;

  Counters.Counter private _tokenIdCounter;

  mapping (uint256 => bool) public lockedTOkens;
  constructor() ERC721("Soul", "SBT") {}

  function safeMint(address to, string memory uri) public returns(uint256) {
    _tokenIdCounter.increment();
    uint256 tokenId = _tokenIdCounter.current();
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);

    return tokenId;
  }

  function mintLocked(address to, string memory uri) public returns(uint256) {
    uint256 tokenId = safeMint(to, uri);
    lockToken(tokenId);

    return tokenId;
  }

  // The following functions are overrides required by Solidity.
  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function locked(uint256 tokenId) 
    external 
    view 
    override(IERC5192) 
    returns (bool) 
  {
    return lockedTOkens[tokenId];
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) 
    internal
    virtual 
    override(ERC721)
  {
    require(lockedTOkens[tokenId] == false, "Locked token");
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function lockToken(uint256 tokenId) public {
    require(ownerOf(tokenId) == msg.sender, "Not token owner");
    lockedTOkens[tokenId] = true;
  }
}