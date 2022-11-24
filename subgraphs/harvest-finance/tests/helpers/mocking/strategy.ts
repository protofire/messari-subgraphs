import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { newMockEvent } from 'matchstick-as'
import { ProfitLogInReward as ProfitLogInRewardEvent } from '../../../generated/templates/Strategy/Strategy'

export function createProfitLogInRewardEvent(
  strategyAddress: Address,
  profitAmount: BigInt,
  feeAmount: BigInt
): ProfitLogInRewardEvent {
  let mockEvent = newMockEvent()

  let event = new ProfitLogInRewardEvent(
    strategyAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null
  )

  event.parameters = [
    new ethereum.EventParam(
      'profitAmount',
      ethereum.Value.fromUnsignedBigInt(profitAmount)
    ),
    new ethereum.EventParam(
      'feeAmount',
      ethereum.Value.fromUnsignedBigInt(feeAmount)
    ),
    new ethereum.EventParam(
      'timestamp',
      ethereum.Value.fromUnsignedBigInt(event.block.timestamp)
    ),
  ]

  return event
}
