import {AdminPlugin, AdminProposal} from '../../../generated/schema';
import {
  ProposalCreated,
  ProposalExecuted,
} from '../../../generated/templates/Admin/Admin';
import {
  ADDRESS_ONE,
  ADDRESS_TWO,
  STRING_DATA,
  PLUGIN_PROPOSAL_ID,
  START_DATE,
  ALLOW_FAILURE_MAP,
  CONTRACT_ADDRESS,
  DAO_ADDRESS,
} from '../constants';
import {Address, BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';
import {newMockEvent} from 'matchstick-as';

export function createNewProposalCreatedEvent(
  proposalId: string,
  creator: string,
  startDate: string,
  endDate: string,
  metadata: string,
  actions: ethereum.Tuple[],
  allowFailureMap: string,
  contractAddress: string
): ProposalCreated {
  let createProposalCreatedEvent = changetype<ProposalCreated>(newMockEvent());

  createProposalCreatedEvent.address = Address.fromString(contractAddress);
  createProposalCreatedEvent.parameters = [];

  let proposalIdParam = new ethereum.EventParam(
    'proposalId',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(proposalId))
  );
  let creatorParam = new ethereum.EventParam(
    'creator',
    ethereum.Value.fromAddress(Address.fromString(creator))
  );
  let startDateParam = new ethereum.EventParam(
    'startDate',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(startDate))
  );
  let endDateParam = new ethereum.EventParam(
    'endDate',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(endDate))
  );
  let metadataParam = new ethereum.EventParam(
    'metadata',
    ethereum.Value.fromBytes(Bytes.fromUTF8(metadata))
  );
  let actionsParam = new ethereum.EventParam(
    'actions',
    ethereum.Value.fromTupleArray(actions)
  );
  let allowFailureMapParam = new ethereum.EventParam(
    'allowFailureMap',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(allowFailureMap))
  );

  createProposalCreatedEvent.parameters.push(proposalIdParam);
  createProposalCreatedEvent.parameters.push(creatorParam);
  createProposalCreatedEvent.parameters.push(startDateParam);
  createProposalCreatedEvent.parameters.push(endDateParam);
  createProposalCreatedEvent.parameters.push(metadataParam);
  createProposalCreatedEvent.parameters.push(actionsParam);
  createProposalCreatedEvent.parameters.push(allowFailureMapParam);

  return createProposalCreatedEvent;
}

export function createProposalExecutedEvent(
  proposalId: string,
  contractAddress: string
): ProposalExecuted {
  let createProposalExecutedEvent = changetype<ProposalExecuted>(
    newMockEvent()
  );

  createProposalExecutedEvent.address = Address.fromString(contractAddress);
  createProposalExecutedEvent.parameters = [];

  let proposalIdParam = new ethereum.EventParam(
    'proposalId',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(proposalId))
  );

  createProposalExecutedEvent.parameters.push(proposalIdParam);

  return createProposalExecutedEvent;
}

// state

export function createAdminPluginState(
  pluginEntityId: string,
  dao: string = DAO_ADDRESS,
  pluginAddress: string = CONTRACT_ADDRESS
): AdminPlugin {
  let adminPlugin = new AdminPlugin(pluginEntityId);
  adminPlugin.dao = Address.fromString(dao);
  adminPlugin.pluginAddress = Address.fromString(pluginAddress);
  adminPlugin.save();

  return adminPlugin;
}

export function createAdminProposalState(
  proposalEntityId: string,
  administratorAddress: Address,
  daoEntityId: string = DAO_ADDRESS,
  pluginEntityId: string = CONTRACT_ADDRESS
): AdminProposal {
  let adminProposal = new AdminProposal(proposalEntityId);
  adminProposal.dao = Address.fromString(daoEntityId);
  adminProposal.plugin = pluginEntityId;
  adminProposal.pluginProposalId = BigInt.fromString(PLUGIN_PROPOSAL_ID);
  adminProposal.creator = administratorAddress;
  adminProposal.metadata = STRING_DATA;
  adminProposal.executed = false;
  adminProposal.createdAt = BigInt.fromString(START_DATE);
  adminProposal.startDate = BigInt.fromString(START_DATE);
  adminProposal.endDate = BigInt.fromString(START_DATE);
  adminProposal.allowFailureMap = BigInt.fromString(ALLOW_FAILURE_MAP);
  adminProposal.administrator = administratorAddress.toHexString();
  adminProposal.save();

  return adminProposal;
}
