const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}


describe("Token", () => {
    let token

    beforeEach(async () => {
        // Fetch Token from Blockchain
        const Token = await ethers.getContractFactory("Token")
        token = await Token.deploy("DEX O", "DEXO", "1000000")
    })

    describe('Deployment', () => {
        const name = 'DEX O';
        const symbol = 'DEXO';
        const decimals = '18';
        const totalSupply = tokens('1000000');

            it("Has correct name.", async () => {
                // Check that name is correct
                expect(await token.name()).to.equal(name)
            })

        it("Has correct symbol.", async () => {
            // Check that symbol is correct
            expect(await token.symbol()).to.equal(symbol)
        })

        it("Has correct decimals.", async () => {
            // Check that decimals is correct
            expect(await token.decimals()).to.equal(decimals)
        })

        it("Has correct total supply.", async () => {
            // Check that decimals is correct
            expect(await token.totalSupply()).to.equal(totalSupply)
        })

    })



})