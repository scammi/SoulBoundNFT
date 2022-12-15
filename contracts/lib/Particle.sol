// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

contract Particle {
  mapping (uint256 => address) internal _tokenCreator;

  function creatorOf(uint256 tokenId) external view virtual returns (address) {
    return _tokenCreator[tokenId];
  }
}