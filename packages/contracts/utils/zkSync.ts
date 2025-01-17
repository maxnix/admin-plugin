import hre, {ethers} from 'hardhat';

export const ZK_SYNC_NETWORKS = ['zkMainnet', 'zkLocalTestnet', 'zkTestnet'];
export const isZkSync = ZK_SYNC_NETWORKS.includes(hre.network.name);
