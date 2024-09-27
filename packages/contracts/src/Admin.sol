// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

import {SafeCastUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";

import {IMembership} from "@aragon/osx-commons-contracts/src/plugin/extensions/membership/IMembership.sol";

// solhint-disable-next-line max-line-length
import {ProposalUpgradeable} from "@aragon/osx-commons-contracts/src/plugin/extensions/proposal/ProposalUpgradeable.sol";
import {PluginUUPSUpgradeable} from "@aragon/osx-commons-contracts/src/plugin/PluginUUPSUpgradeable.sol";
import {IDAO} from "@aragon/osx-commons-contracts/src/dao/IDAO.sol";
import {IProposal} from "@aragon/osx-commons-contracts/src/plugin/extensions/proposal/IProposal.sol";
import {IExecutor, Action} from "@aragon/osx-commons-contracts/src/executors/IExecutor.sol";

/// @title Admin
/// @author Aragon X - 2022-2023
/// @notice The admin governance plugin giving execution permission on the DAO to a single address.
/// @dev v1.2 (Release 1, Build 2)
/// @custom:security-contact sirt@aragon.org
contract Admin is IMembership, PluginUUPSUpgradeable, ProposalUpgradeable {
    using SafeCastUpgradeable for uint256;

    /// @notice The [ERC-165](https://eips.ethereum.org/EIPS/eip-165) interface ID of the contract.
    bytes4 internal constant ADMIN_INTERFACE_ID = this.initialize.selector ^ this.execute.selector;

    /// @notice The ID of the permission required to call the `executeProposal` function.
    bytes32 public constant EXECUTE_PROPOSAL_PERMISSION_ID =
        keccak256("EXECUTE_PROPOSAL_PERMISSION");

    error NotAllowedOperation();

    /// @notice Initializes the contract.
    /// @param _dao The associated DAO.
    /// @dev This method is required to support [ERC-1167](https://eips.ethereum.org/EIPS/eip-1167).
    function initialize(IDAO _dao, TargetConfig calldata _targetConfig) external initializer {
        __PluginUUPSUpgradeable_init(_dao);

        _setTargetConfig(_targetConfig);

        emit MembershipContractAnnounced({definingContract: address(_dao)});
    }

    /// @notice Checks if this or the parent contract supports an interface by its ID.
    /// @param _interfaceId The ID of the interface.
    /// @return Returns `true` if the interface is supported.
    function supportsInterface(
        bytes4 _interfaceId
    ) public view override(PluginUUPSUpgradeable, ProposalUpgradeable) returns (bool) {
        return
            _interfaceId == ADMIN_INTERFACE_ID ||
            _interfaceId == type(IMembership).interfaceId ||
            super.supportsInterface(_interfaceId);
    }

    /// @inheritdoc IMembership
    function isMember(address _account) external view returns (bool) {
        return
            dao().hasPermission({
                _where: address(this),
                _who: _account,
                _permissionId: EXECUTE_PROPOSAL_PERMISSION_ID,
                _data: bytes("")
            });
    }

    /// @notice Hashing function used to (re)build the proposal id from the proposal details..
    /// @dev The proposal id is produced by hashing the ABI encoded `targets` array, the `values` array, the `calldatas` array
    /// and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id
    /// can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in
    /// advance, before the proposal is submitted.
    /// The chainId and the governor address are not part of the proposal id computation. Consequently, the
    /// same proposal (with same operation and same description) will have the same id if submitted on multiple governors
    /// across multiple networks. This also means that in order to execute the same operation twice (on the same
    /// governor) the proposer will have to change the description in order to avoid proposal id conflicts.
    /// @param _actions The actions that will be executed after the proposal passes.
    /// @param _metadata The metadata of the proposal.
    /// @return proposalId The ID of the proposal.
    function createProposalId(
        Action[] calldata _actions,
        bytes memory _metadata
    ) public pure override returns (uint256) {
        return uint256(keccak256(abi.encode(_actions, _metadata)));
    }

    /// @inheritdoc IProposal
    /// @dev Admin doesn't allow creating a proposal, so we return empty string.
    function createProposalParamsABI() external pure override returns (string memory) {
        return "(uint256 allowFailureMap)";
    }

    /// @inheritdoc IProposal
    function createProposal(
        bytes calldata _metadata,
        Action[] calldata _actions,
        uint64,
        uint64,
        bytes memory _data
    ) public override returns (uint256) {
        uint256 allowFailureMap;

        if (_data.length > 0) {
            allowFailureMap = abi.decode(_data, (uint256));
        }

        // Uses public function for permission check.
        execute(_metadata, _actions, allowFailureMap);
    }

    /// @inheritdoc IProposal
    function canExecute(uint256) public view virtual override returns (bool) {
        return true;
    }

    /// @notice Creates and executes a new proposal.
    /// @param _metadata The metadata of the proposal.
    /// @param _actions The actions to be executed.
    /// @param _allowFailureMap A bitmap allowing the proposal to succeed, even if individual actions might revert.
    /// If the bit at index `i` is 1, the proposal succeeds even if the `i`th action reverts. A failure map value
    // of 0 requires every action to not revert.
    function execute(
        bytes calldata _metadata,
        Action[] calldata _actions,
        uint256 _allowFailureMap
    ) public auth(EXECUTE_PROPOSAL_PERMISSION_ID) {
        uint64 currentTimestamp64 = block.timestamp.toUint64();

        uint256 proposalId = createProposalId(_actions, _metadata);

        TargetConfig memory targetConfig = getTargetConfig();

        _execute(
            targetConfig.target,
            bytes32(proposalId),
            _actions,
            _allowFailureMap,
            targetConfig.operation
        );

        emit ProposalCreated(
            proposalId,
            _msgSender(),
            currentTimestamp64,
            currentTimestamp64,
            _metadata,
            _actions,
            _allowFailureMap
        );

        emit ProposalExecuted(proposalId);
    }

    /// @notice Internal method authorizing the upgrade of the contract via the [upgradeability mechanism for UUPS proxies](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable) (see [ERC-1822](https://eips.ethereum.org/EIPS/eip-1822)).
    /// @dev The Upgradeability disabled.
    function _authorizeUpgrade(
        address
    ) internal virtual override auth(UPGRADE_PLUGIN_PERMISSION_ID) {
        revert NotAllowedOperation();
    }
}
