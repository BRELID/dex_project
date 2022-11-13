const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}


describe('Exchange', () => {
    const feePercent = 10
    let accounts, exchange, feeAccount, deployer

    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]

        // Fetch Token from Blockchain
        const Exchange = await ethers.getContractFactory('Exchange')
        exchange = await Exchange.deploy(feeAccount.address, feePercent)
    })

    describe('Deployment', () => {

        it("Tracks the fee account.", async () => {
            // Check that name is correct
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it("Tracks the fee percent.", async () => {
            // Check that name is correct
            expect(await exchange.feePercent()).to.equal(feePercent)
        })

    })


})