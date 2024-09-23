// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

import {SafeCastUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";

import {IMembership} from "@aragon/osx-commons-contracts/src/plugin/extensions/membership/IMembership.sol";

// solhint-disable-next-line max-line-length
import {ProposalUpgradeable} from "@aragon/osx-commons-contracts/src/plugin/extensions/proposal/ProposalUpgradeable.sol";
import {PluginCloneable} from "@aragon/osx-commons-contracts/src/plugin/PluginCloneable.sol";
import {IDAO} from "@aragon/osx-commons-contracts/src/dao/IDAO.sol";
import {IProposal} from "@aragon/osx-commons-contracts/src/plugin/extensions/proposal/IProposal.sol";

/// @title Admin
/// @author Aragon X - 2022-2023
/// @notice The admin governance plugin giving execution permission on the DAO to a single address.
/// @dev v1.2 (Release 1, Build 2)
/// @custom:security-contact sirt@aragon.org
contract Admin is IMembership, PluginCloneable, ProposalUpgradeable {
    using SafeCastUpgradeable for uint256;

    /// @notice The [ERC-165](https://eips.ethereum.org/EIPS/eip-165) interface ID of the contract.
    bytes4 internal constant ADMIN_INTERFACE_ID =
        this.initialize.selector ^ this.executeProposal.selector;

    /// @notice The ID of the permission required to call the `executeProposal` function.
    bytes32 public constant EXECUTE_PROPOSAL_PERMISSION_ID =
        keccak256("EXECUTE_PROPOSAL_PERMISSION");

    /// @notice Initializes the contract.
    /// @param _dao The associated DAO.
    /// @dev This method is required to support [ERC-1167](https://eips.ethereum.org/EIPS/eip-1167).
    function initialize(IDAO _dao) external initializer {
        __PluginCloneable_init(_dao);

        emit MembershipContractAnnounced({definingContract: address(_dao)});
    }

    /// @notice Checks if this or the parent contract supports an interface by its ID.
    /// @param _interfaceId The ID of the interface.
    /// @return Returns `true` if the interface is supported.
    function supportsInterface(
        bytes4 _interfaceId
    ) public view override(PluginCloneable, ProposalUpgradeable) returns (bool) {
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
        IDAO.Action[] calldata _actions,
        bytes memory _metadata
    ) public pure override returns (uint256) {
        return uint256(keccak256(abi.encode(_actions, _metadata)));
    }

    /// @inheritdoc IProposal
    function createProposal(
        bytes calldata _metadata,
        IDAO.Action[] calldata _actions,
        uint64 _startDate,
        uint64 _endDate
    ) external override returns (uint256 proposalId) {}

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
    function executeProposal(
        bytes calldata _metadata,
        IDAO.Action[] calldata _actions,
        uint256 _allowFailureMap
    ) external auth(EXECUTE_PROPOSAL_PERMISSION_ID) {
        uint256 proposalId = createProposalId(_actions, _metadata);

        _execute(address(dao()), bytes32(proposalId), _actions, _allowFailureMap, Operation.Call);
    }
}
