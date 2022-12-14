const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}


describe('Exchange', () => {
    const feePercent = 10
    let accounts, exchange, feeAccount, deployer, token1, token2, user1, user2

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')

        token1 = await Token.deploy("DEX O", "DEXO", "1000000")
        token2 = await Token.deploy("USD Tether", "USDT", "1000000")

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

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
                // 2 events are emitted so we need to take the second one
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

    describe('Withdrawing Tokens', () => {
        let transaction, result
        let amount = tokens(10)

        describe('Success', () => {
            beforeEach(async () => {
                // Deposit tokens before withdrawing

                // Approve Token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                // Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()

                // Now withdraw Tokens
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
                result = await transaction.wait()
            })

            it('withdraws token funds', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
            })

            it('emits a Withdraw event', async () => {
                const event = result.events[1] // 2 events are emitted
                expect(event.event).to.equal('Withdraw')

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(0)
            })

        })

        describe('Failure', () => {
            it('fails for insufficient balances', async () => {
                // Attempt to withdraw tokens without depositing
                await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
            })
        })

    })

    describe('Checking Balances', () => {
        let transaction, result
        let amount = tokens(1)

        beforeEach(async () => {
            // Approve Token
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()
            // Deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()
        })

        it('returns user balance', async () => {
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
        })

    })

    describe('Making orders', async () => {
        let transaction, result

        let amount = tokens(1)

        describe('Success', async () => {
            beforeEach(async () => {
                // Deposit tokens before making order

                // Approve Token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                // Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()

                // Make order
                transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                result = await transaction.wait()
            })

            it('tracks the newly created order', async () => {
                expect(await exchange.orderCount()).to.equal(1)
            })

            it('emits an Order event', async () => {
                const event = result.events[0]
                expect(event.event).to.equal('Order')

                const args = event.args
                expect(args.id).to.equal(1)
                expect(args.timestamp).to.at.least(1)
                expect(args.user).to.equal(user1.address)
                expect(args.tokenGet).to.equal(token2.address)
                expect(args.amountGet).to.equal(tokens(1))
                expect(args.tokenGive).to.equal(token1.address)
                expect(args.amountGive).to.equal(tokens(1))
            })

        })

        describe('Failure', async () => {
            it('Rejects with no balance', async () => {
                await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted
            })
        })
    })

    describe('Order actions', async () => {
        let transaction, result
        let amount = tokens(1)
        beforeEach(async () => {
            // user1 deposits tokens
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()

            // Deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()


            // Make order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
            result = await transaction.wait()
        })
        describe('Cancelling orders', async () => {
            describe('Success', async () => {
                beforeEach(async () => {
                    transaction = await exchange.connect(user1).cancelOrder(1)
                    result = await transaction.wait()
                })

                it('Updates canceled orders', async () => {
                    expect(await exchange.orderCancelled(1)).to.equal(true)
                })

                it('emits a Cancel event', async () => {
                    const event = result.events[0]
                    expect(event.event).to.equal('Cancel')

                    const args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.timestamp).to.at.least(1)
                    expect(args.user).to.equal(user1.address)
                    expect(args.tokenGet).to.equal(token2.address)
                    expect(args.amountGet).to.equal(tokens(1))
                    expect(args.tokenGive).to.equal(token1.address)
                    expect(args.amountGive).to.equal(tokens(1))
                })

            })
            describe('Failure', async () => {
                beforeEach(async () => {
                    // user1 deposits tokens
                    transaction = await token1.connect(user1).approve(exchange.address, amount)
                    result = await transaction.wait()

                    // Deposit token
                    transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                    result = await transaction.wait()

                    // Make order
                    transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                    result = await transaction.wait()
                })

                it('Rejects invalid order ids', async () => {
                    const INVALID_ORDER_ID = 99999
                    await expect(exchange.connect(user1).cancelOrder(INVALID_ORDER_ID)).to.be.reverted
                })

                it('Rejects unauthorized cancelations', async () => {
                    await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
                })
            })
        })
    })

})