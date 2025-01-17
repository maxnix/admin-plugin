export const ZK_SYNC_NETWORKS = ['zkMainnet', 'zkLocalTestnet', 'zkTestnet'];
export function isZkSync(networkName: string): boolean {
  return (
    networkName === 'zksyncSepolia' ||
    networkName === 'zkLocalTestnet' ||
    networkName === 'zksyncMainnet'
  );
}
