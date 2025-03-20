import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenModule = buildModule("TokenModule", (m) => {
  const reserveWallet = "0xYourReserveWalletAddress"; // Change this
  const basePrice = 100000000000000000; // 0.1 MATIC in wei
  const slope = 1000000000000000; // 0.001 MATIC in wei

  const token = m.contract("LinearBondingToken", [
    "Linear Token",
    "LBT",
    reserveWallet,
    basePrice,
    slope,
  ]);

  return { token };
});

export default TokenModule;
