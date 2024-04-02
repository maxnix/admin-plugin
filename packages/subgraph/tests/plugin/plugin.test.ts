import {Action} from '../../generated/schema';
import {
  handleProposalExecuted,
  _handleProposalCreated,
  handleMembershipContractAnnounced,
} from '../../src/plugin/plugin';
import {
  ADDRESS_ONE,
  ADDRESS_TWO,
  STRING_DATA,
  PLUGIN_PROPOSAL_ID,
  START_DATE,
  ALLOW_FAILURE_MAP,
  CONTRACT_ADDRESS,
  DAO_ADDRESS,
} from '../utils/constants';
import {
  createNewProposalCreatedEvent,
  createProposalExecutedEvent,
  createMembershipContractAnnouncedEvent,
  createAdminPluginState,
  createAdminProposalState,
} from '../utils/events/plugin';
import {
  generateActionEntityId,
  generatePluginEntityId,
  generateProposalEntityId,
  createDummyAction,
} from '@aragon/osx-commons-subgraph';
import {
  Address,
  Bytes,
  BigInt,
  DataSourceContext,
} from '@graphprotocol/graph-ts';
import {dataSource} from '@graphprotocol/graph-ts';
import {
  assert,
  afterEach,
  beforeEach,
  clearStore,
  test,
  describe,
  dataSourceMock,
} from 'matchstick-as';

const actionValue = '0';
const actionData = '0x00000000';
const actions = [createDummyAction(ADDRESS_TWO, actionValue, actionData)];

const pluginAddress = Address.fromString(CONTRACT_ADDRESS);
const pluginEntityId = generatePluginEntityId(pluginAddress);
const pluginProposalId = BigInt.fromString(PLUGIN_PROPOSAL_ID);
const proposalEntityId = generateProposalEntityId(
  pluginAddress,
  pluginProposalId
);

describe('Plugin', () => {
  beforeEach(function () {
    let context = new DataSourceContext();
    context.setString('daoAddress', DAO_ADDRESS);
    dataSourceMock.setContext(context);
  });

  afterEach(() => {
    clearStore();
  });

  describe('handleProposalCreated', () => {
    test('test the event', () => {
      // check the entities are not in the store
      assert.entityCount('AdminProposal', 0);
      assert.entityCount('Action', 0);

      // create state
      createAdminPluginState(pluginEntityId);

      // create event
      let event = createNewProposalCreatedEvent(
        PLUGIN_PROPOSAL_ID,
        ADDRESS_ONE,
        START_DATE,
        START_DATE,
        STRING_DATA,
        actions,
        ALLOW_FAILURE_MAP,
        pluginEntityId
      );

      // handle event
      _handleProposalCreated(event, DAO_ADDRESS, STRING_DATA);

      let proposalEntityId = generateProposalEntityId(
        pluginAddress,
        BigInt.fromString(PLUGIN_PROPOSAL_ID)
      );

      // checks proposal
      assert.entityCount('AdminProposal', 1);
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'id',
        proposalEntityId
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'daoAddress',
        DAO_ADDRESS
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'plugin',
        pluginEntityId
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'pluginProposalId',
        PLUGIN_PROPOSAL_ID
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'creator',
        ADDRESS_ONE
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'metadata',
        STRING_DATA
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'executed',
        'false'
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'createdAt',
        event.block.timestamp.toString()
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'startDate',
        START_DATE
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'endDate',
        START_DATE
      );
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'allowFailureMap',
        ALLOW_FAILURE_MAP
      );

      // check action
      assert.entityCount('Action', 1);
      const actionEntityId = generateActionEntityId(
        pluginAddress,
        Address.fromString(DAO_ADDRESS),
        pluginProposalId.toString(),
        0
      );
      const actionEntity = Action.load(actionEntityId);
      assert.entityCount('Action', 1);
      assert.fieldEquals('Action', actionEntityId, 'id', actionEntityId);
      assert.fieldEquals('Action', actionEntityId, 'to', ADDRESS_TWO);
      assert.fieldEquals('Action', actionEntityId, 'value', actionValue);
      assert.fieldEquals('Action', actionEntityId, 'data', actionData);
      assert.fieldEquals('Action', actionEntityId, 'daoAddress', DAO_ADDRESS);
      assert.fieldEquals(
        'Action',
        actionEntityId,
        'proposal',
        proposalEntityId
      );
    });
  });

  describe('handleProposalExecuted', () => {
    test('test the event', () => {
      // create state
      createAdminPluginState(pluginEntityId);

      let administratorAddress = Address.fromString(ADDRESS_ONE);

      createAdminProposalState(proposalEntityId, administratorAddress);

      const actionEntityId = generateActionEntityId(
        pluginAddress,
        Address.fromString(DAO_ADDRESS),
        pluginProposalId.toString(),
        0
      );
      let action = new Action(actionEntityId);
      action.to = Address.fromString(ADDRESS_TWO);
      action.value = BigInt.fromString(actionValue);
      action.data = Bytes.fromHexString(actionData);
      action.daoAddress = Address.fromString(DAO_ADDRESS);
      action.proposal = proposalEntityId;
      action.save();

      assert.entityCount('AdminProposal', 1);

      // create event
      let event = createProposalExecutedEvent(
        PLUGIN_PROPOSAL_ID,
        pluginEntityId
      );

      // handle event
      handleProposalExecuted(event);

      // checks
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'id',
        proposalEntityId
      );
      assert.fieldEquals('AdminProposal', proposalEntityId, 'executed', 'true');
      assert.fieldEquals(
        'AdminProposal',
        proposalEntityId,
        'executionTxHash',
        event.transaction.hash.toHexString()
      );
    });
  });

  describe('handleMembershipContractAnnounced', () => {
    test('test the event', () => {
      let context = dataSource.context();

      assert.dataSourceCount('AdminMembers', 0);
      assert.assertNull(context.get('pluginAddress'));
      assert.assertNull(context.get('permissionId'));

      // create event
      let event = createMembershipContractAnnouncedEvent(
        DAO_ADDRESS,
        pluginAddress
      );

      // handle event
      handleMembershipContractAnnounced(event);

      // check
      assert.dataSourceCount('AdminMembers', 1);
      assert.dataSourceExists('AdminMembers', DAO_ADDRESS);
    });
  });

  test('We correctly generate the action ID', () => {
    let caller = pluginAddress;
    let daoAddress = DAO_ADDRESS;
    let callId = 'c4ll me';
    let index = 255;

    let actionId = generateActionEntityId(
      caller,
      Address.fromString(daoAddress),
      callId,
      index
    );

    assert.stringEquals(
      actionId,
      [caller.toHexString(), daoAddress, callId, index.toString()].join('_')
    );
  });
});
