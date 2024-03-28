import {Administrator, AdministratorAdminPlugin} from '../../generated/schema';
import {handleGranted, handleRevoked} from '../../src/plugin/adminMembers';
import {EXECUTE_PROPOSAL_PERMISSION_HASH} from '../../src/utils/constants';
import {generateAdministratorAdminPluginEntityId} from '../../src/utils/ids';
import {ADDRESS_ONE, ADDRESS_TWO, DAO_ADDRESS} from '../utils/constants';
import {createGrantedEvent, createRevokedEvent} from '../utils/events/plugin';
import {generateEntityIdFromAddress} from '@aragon/osx-commons-subgraph';
import {Address, DataSourceContext} from '@graphprotocol/graph-ts';
import {
  assert,
  clearStore,
  dataSourceMock,
  test,
  describe,
  beforeEach,
  afterEach,
} from 'matchstick-as/assembly/index';

const adminAddress = Address.fromString(ADDRESS_ONE);
const administratorEntityId = generateEntityIdFromAddress(adminAddress);
const pluginAddress = Address.fromString(ADDRESS_TWO);
const pluginEntityId = generateEntityIdFromAddress(pluginAddress);

describe('AdminMembers', function () {
  // keccack256 of EXECUTE_PROPOSAL_PERMISSION

  beforeEach(function () {
    let context = new DataSourceContext();
    context.setString('permissionId', EXECUTE_PROPOSAL_PERMISSION_HASH);
    context.setString('pluginAddress', pluginEntityId);
    dataSourceMock.setContext(context);
  });

  afterEach(function () {
    clearStore();
  });

  test('handleGranted', function () {
    // check the entities are not in the store
    assert.entityCount('Administrator', 0);
    assert.entityCount('AdministratorAdminPlugin', 0);

    // create the event and handle it
    let event = createGrantedEvent(
      EXECUTE_PROPOSAL_PERMISSION_HASH,
      DAO_ADDRESS,
      pluginEntityId,
      administratorEntityId
    );
    handleGranted(event);

    // check the administrator entity
    assert.entityCount('Administrator', 1);
    assert.fieldEquals(
      'Administrator',
      administratorEntityId,
      'id',
      administratorEntityId
    );
    assert.fieldEquals(
      'Administrator',
      administratorEntityId,
      'address',
      administratorEntityId
    );

    // check the mapping with the admin pluging entity
    assert.entityCount('AdministratorAdminPlugin', 1);
    let administratorAdminPluginId = generateAdministratorAdminPluginEntityId(
      pluginAddress,
      adminAddress
    );
    assert.fieldEquals(
      'AdministratorAdminPlugin',
      administratorAdminPluginId,
      'id',
      administratorAdminPluginId
    );
    assert.fieldEquals(
      'AdministratorAdminPlugin',
      administratorAdminPluginId,
      'administrator',
      administratorEntityId
    );
    assert.fieldEquals(
      'AdministratorAdminPlugin',
      administratorAdminPluginId,
      'plugin',
      pluginEntityId
    );
  });

  test('handleRevoked', function () {
    let administrator = new Administrator(administratorEntityId);
    administrator.address = administratorEntityId;
    administrator.save();

    let administratorAdminPluginId = generateAdministratorAdminPluginEntityId(
      pluginAddress,
      adminAddress
    );
    let administratorAdminPluginEntity = new AdministratorAdminPlugin(
      administratorAdminPluginId
    );
    administratorAdminPluginEntity.administrator = administratorEntityId;
    administratorAdminPluginEntity.plugin = pluginEntityId;
    administratorAdminPluginEntity.save();

    // check the entities are in the store
    assert.entityCount('Administrator', 1);
    assert.entityCount('AdministratorAdminPlugin', 1);

    // create revoke event and handle it
    let revokedEvent = createRevokedEvent(
      EXECUTE_PROPOSAL_PERMISSION_HASH,
      DAO_ADDRESS,
      pluginEntityId,
      administratorEntityId
    );
    handleRevoked(revokedEvent);

    // when revoking the permission the admin is not removed, only the mapping with the admin plugin
    assert.entityCount('Administrator', 1);
    assert.entityCount('AdministratorAdminPlugin', 0);
    assert.notInStore('AdministratorAdminPlugin', administratorAdminPluginId);
  });
});
