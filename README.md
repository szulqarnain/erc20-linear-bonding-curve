# Smart Contract Boilerplate - Linear Bonding Curve

## Overview
This is an ERC-20 smart contract implementing a **linear bonding curve pricing model**. The price of tokens increases linearly based on the total supply, ensuring liquidity at all times.

## Features
- **Linear Bonding Curve Pricing**: The token price follows the formula:
  
  \[ P(S) = basePrice + (slope * S) \]
  
  Where:
  - `basePrice`: Initial price of the token
  - `slope`: Price increase per additional token minted
  - `S`: Current total supply of tokens
  
- **Minting (Buying) Tokens**: Users can buy tokens by sending MATIC.
- **Burning (Selling) Tokens**: Users can sell tokens back to the reserve and receive MATIC.
- **Reserve Wallet**: All funds from token sales are stored in a reserve wallet for liquidity.
- **Reentrancy Protection**: Uses `ReentrancyGuard` from OpenZeppelin to prevent attacks.

## Smart Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LinearBondingToken is ERC20, ReentrancyGuard {
    address public reserveWallet;
    uint256 public basePrice; // Initial price (e.g., 0.1 MATIC)
    uint256 public slope; // Price increase per token (e.g., 0.001 MATIC)

    constructor(
        string memory name,
        string memory symbol,
        address _reserveWallet,
        uint256 _basePrice,
        uint256 _slope
    ) ERC20(name, symbol) {
        require(_reserveWallet != address(0), "Invalid reserve wallet");
        require(_basePrice > 0, "Base price must be greater than zero");
        require(_slope > 0, "Slope must be greater than zero");

        reserveWallet = _reserveWallet;
        basePrice = _basePrice;
        slope = _slope;
    }

    // Bonding curve price calculation
    function currentPrice() public view returns (uint256) {
        return basePrice + (slope * totalSupply());
    }

    // Calculate cost to mint a specific amount of tokens
    function getMintingCost(uint256 amount) public view returns (uint256) {
        uint256 totalCost = 0;
        for (uint256 i = 0; i < amount; i++) {
            totalCost += currentPrice() + (slope * i);
        }
        return totalCost;
    }

    // Calculate value when burning tokens
    function getBurnValue(uint256 amount) public view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < amount; i++) {
            totalValue += currentPrice() - (slope * i);
        }
        return totalValue;
    }

    // Buy tokens from reserve
    function mint(uint256 amount) external payable nonReentrant {
        uint256 totalCost = getMintingCost(amount);
        require(msg.value >= totalCost, "Insufficient funds");

        _mint(msg.sender, amount);
        payable(reserveWallet).transfer(totalCost);

        // Refund excess funds if any
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    // Sell tokens to reserve
    function burn(uint256 amount) external nonReentrant {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        uint256 totalValue = getBurnValue(amount);

        _burn(msg.sender, amount);
        payable(msg.sender).transfer(totalValue);
    }
}
```

## Deployment Guide
1. **Install Dependencies**:
   ```sh
   npm install @openzeppelin/contracts
   ```
2. **Compile & Deploy** using Hardhat or Remix.
3. **Configure Parameters**:
   - `basePrice`: Set an initial base price (e.g., `0.1 MATIC`).
   - `slope`: Set how much the price increases per token.
   - `reserveWallet`: Set the address where funds will be held.
4. **Use the Contract**:
   - Call `mint(amount)` to buy tokens.
   - Call `burn(amount)` to sell tokens.

## Repository Name
**`erc20-linear-bonding-curve`**

## License
This project is licensed under the MIT License.
