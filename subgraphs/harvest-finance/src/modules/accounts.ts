import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Account, ActiveAccount } from '../../generated/schema'
import { shared } from './shared'

export namespace accounts {
  export function parseAccountId(id: Address): string {
    return id.toHexString()
  }
  // this function can be less verbose but it's better to keep consistency
  export function loadOrCreateAccount(address: Address): Account {
    let id = parseAccountId(address)
    let entity = Account.load(id)
    if (entity == null) {
      entity = new Account(id)
    }
    return entity as Account
  }

  export function getActiveAccountId(id: Address, timestamp: BigInt): string {
    // " { Address of the account }-{ Days since Unix epoch }-{ [Optional] HH: hour of the day } "
    return `${parseAccountId(id)}-${shared.date.truncateDays(timestamp)}`
  }

  export function isNewAccount(address: Address): bool {
    let newAccount = false
    let id = parseAccountId(address)
    let entity = Account.load(id)
    if (entity === null) newAccount = true

    return newAccount
  }

  export function loadOrCreateActiveAccount(address: Address, timestamp: BigInt): ActiveAccount {
    let id = getActiveAccountId(address, timestamp)
    let entity = ActiveAccount.load(id)
    if (entity == null) {
      entity = new ActiveAccount(id)
    }
    return entity as ActiveAccount
  }
}
