const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}


describe('Exchange', () => {
    const feePercent = 10
    let accounts, exchange, feeAccount, deployer, token1, user1

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')

        token1 = await Token.deploy("DEX O", "DEXO", "1000000")

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]

        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await transaction.wait()

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

    describe('Depositing Tokens', () => {
        let transaction, result
        let amount = tokens(30)

        describe('Success', () => {
            beforeEach(async () => {
                //console.log(user1.address, exchange.address, amount.toString())
                // Approve Token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()

                // Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
            })

            it('Tracks the token deposit', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })

            it('Emits an Deposit event', async () => {
                // 2 events are emited so we need to take the second one
                const event = result.events[1]
                expect(event.event).to.equal('Deposit')

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(amount)
            })
        })

        describe('Failure', () => {
            it('Fails when no tokens are approved', async () => {
                // Don't approve any tokens before depositing
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted

            })
        })

    })

})