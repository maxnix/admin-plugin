// import {Administrator, AdministratorAdminPlugin} from '../../generated/schema';
// import {Granted, Revoked} from '../../generated/templates/Admin/DAO';
// import {generateAdministratorAdminPluginEntityId} from '../../utils/ids';
// import {
//   generateEntityIdFromAddress,
//   generatePluginEntityId,
// } from '@aragon/osx-commons-subgraph';
// import {dataSource, store} from '@graphprotocol/graph-ts';

// export function handleGranted(event: Granted): void {
//   if (
//     isCorrectEvent(
//       event.params.permissionId.toHexString(),
//       event.params.where.toHexString()
//     )
//   ) {
//     const pluginAddress = event.params.where;
//     const administratorAddress = event.params.who;
//     const pluginEntityId = generatePluginEntityId(pluginAddress);
//     const administratorEntityId =
//       generateEntityIdFromAddress(administratorAddress);
//     let administrator = Administrator.load(administratorEntityId);
//     if (!administrator) {
//       administrator = new Administrator(administratorEntityId);
//       administrator.address = administratorEntityId;
//       administrator.save();
//     }

//     let administratorMappingId = generateAdministratorAdminPluginEntityId(
//       pluginAddress,
//       administratorAddress
//     );
//     let administratorPluginMapping = AdministratorAdminPlugin.load(
//       administratorMappingId
//     );
//     if (!administratorPluginMapping) {
//       administratorPluginMapping = new AdministratorAdminPlugin(
//         administratorMappingId
//       );
//       administratorPluginMapping.administrator = administratorEntityId;
//       administratorPluginMapping.plugin = pluginEntityId;
//       administratorPluginMapping.save();
//     }
//   }
// }

// export function handleRevoked(event: Revoked): void {
//   if (
//     isCorrectEvent(
//       event.params.permissionId.toHexString(),
//       event.params.where.toHexString()
//     )
//   ) {
//     // where is the plugin address
//     // who is the administrator address
//     const mappingId = generateAdministratorAdminPluginEntityId(
//       event.params.where,
//       event.params.who
//     );
//     if (AdministratorAdminPlugin.load(mappingId)) {
//       store.remove('AdministratorAdminPlugin', mappingId);
//     }
//   }
// }

// function isCorrectEvent(permissionId: string, where: string): boolean {
//   const context = dataSource.context();
//   const requiredPermissionId = context.getString('permissionId');
//   if (permissionId == requiredPermissionId) {
//     const pluginAddress = context.getString('pluginAddress');
//     if (where == pluginAddress) {
//       return true;
//     }
//   }
//   return false;
// }
