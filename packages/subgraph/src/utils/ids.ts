import {generateEntityIdFromAddress} from '@aragon/osx-commons-subgraph';
import {Address} from '@graphprotocol/graph-ts';

export function generateAdministratorAdminPluginEntityId(
  pluginAddress: Address,
  administratorAddress: Address
): string {
  return [
    generateEntityIdFromAddress(pluginAddress),
    generateEntityIdFromAddress(administratorAddress),
  ].join('_');
}

/**
 * @dev TODO: remove this function and use the one in the commons
 */
export function generateActionEntityId(
  caller: Address,
  daoAddress: Address,
  callId: string,
  index: i32
): string {
  return [
    generateEntityIdFromAddress(caller),
    generateEntityIdFromAddress(daoAddress),
    callId,
    index.toString(),
  ].join('_');
}
