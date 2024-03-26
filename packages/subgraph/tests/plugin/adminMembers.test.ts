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
const adminEntityId = generateEntityIdFromAddress(adminAddress);
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
    let event = createGrantedEvent(
      EXECUTE_PROPOSAL_PERMISSION_HASH,
      DAO_ADDRESS,
      pluginEntityId,
      adminEntityId
    );
    handleGranted(event);

    assert.entityCount('Administrator', 1);
    assert.fieldEquals('Administrator', adminEntityId, 'id', adminEntityId);
    assert.fieldEquals(
      'Administrator',
      adminEntityId,
      'address',
      adminEntityId
    );

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
      adminEntityId
    );
    assert.fieldEquals(
      'AdministratorAdminPlugin',
      administratorAdminPluginId,
      'plugin',
      pluginEntityId
    );
  });

  test('handleRevoked', function () {
    let administrator = new Administrator(adminEntityId);
    administrator.address = adminEntityId;
    administrator.save();

    let administratorAdminPluginId = generateAdministratorAdminPluginEntityId(
      pluginAddress,
      adminAddress
    );
    let administratorAdminPluginEntity = new AdministratorAdminPlugin(
      administratorAdminPluginId
    );
    administratorAdminPluginEntity.administrator = adminEntityId;
    administratorAdminPluginEntity.plugin = pluginEntityId;
    administratorAdminPluginEntity.save();

    assert.entityCount('Administrator', 1);
    assert.entityCount('AdministratorAdminPlugin', 1);

    let revokedEvent = createRevokedEvent(
      EXECUTE_PROPOSAL_PERMISSION_HASH,
      DAO_ADDRESS,
      pluginEntityId,
      adminEntityId
    );
    handleRevoked(revokedEvent);

    // when revoking the permission the admin is not removed, only the mapping with the admin plugin
    assert.entityCount('Administrator', 1);
    assert.entityCount('AdministratorAdminPlugin', 0);
    assert.notInStore('AdministratorAdminPlugin', administratorAdminPluginId);
  });
});
