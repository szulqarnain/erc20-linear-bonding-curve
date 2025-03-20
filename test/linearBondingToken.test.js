const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LinearBondingToken", function () {
  let LinearBondingToken, token, owner, addr1, addr2;
  const basePrice = ethers.utils.parseEther("0.1"); // 0.1 MATIC
  const slope = ethers.utils.parseEther("0.001"); // 0.001 MATIC

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const reserveWallet = owner.address;

    LinearBondingToken = await ethers.getContractFactory("LinearBondingToken");
    token = await LinearBondingToken.deploy(
      "Linear Token",
      "LBT",
      reserveWallet,
      basePrice,
      slope
    );
    await token.deployed();
  });

  it("Should deploy with correct parameters", async function () {
    expect(await token.basePrice()).to.equal(basePrice);
    expect(await token.slope()).to.equal(slope);
    expect(await token.reserveWallet()).to.equal(owner.address);
  });

  it("Should correctly calculate price based on supply", async function () {
    expect(await token.currentPrice()).to.equal(basePrice);

    await token.connect(addr1).mint(1, { value: basePrice });
    expect(await token.currentPrice()).to.equal(basePrice.add(slope));
  });

  it("Should allow users to mint tokens", async function () {
    const mintAmount = 3;
    const mintCost = await token.getMintingCost(mintAmount);

    await token.connect(addr1).mint(mintAmount, { value: mintCost });

    expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await ethers.provider.getBalance(token.reserveWallet())).to.equal(
      mintCost
    );
  });

  it("Should allow users to burn tokens and receive MATIC", async function () {
    const mintAmount = 3;
    const mintCost = await token.getMintingCost(mintAmount);

    await token.connect(addr1).mint(mintAmount, { value: mintCost });
    const burnValue = await token.getBurnValue(mintAmount);

    const beforeBalance = await ethers.provider.getBalance(addr1.address);
    await token.connect(addr1).burn(mintAmount);
    const afterBalance = await ethers.provider.getBalance(addr1.address);

    expect(afterBalance.sub(beforeBalance)).to.be.closeTo(
      burnValue,
      ethers.utils.parseEther("0.001")
    ); // Account for gas fees
  });

  it("Should not allow minting without enough funds", async function () {
    await expect(
      token.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") })
    ).to.be.revertedWith("Insufficient funds");
  });

  it("Should not allow burning more tokens than owned", async function () {
    await expect(token.connect(addr1).burn(1)).to.be.revertedWith(
      "Insufficient balance"
    );
  });
});
