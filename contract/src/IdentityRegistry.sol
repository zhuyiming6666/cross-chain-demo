// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * IdentityRegistry —— 隐私身份子模块演示用最小注册表
 *
 * 设计目标：
 * - 给"凭证颁发"留一个可信链上锚点（commitment + 来源链 + 颁发者 + 时间）
 * - 给"凭证验证"提供 isActive 视图，让其他业务合约能用 onlyHadesUser modifier
 * - 给"身份恢复/追溯"提供事件流（CommitmentAdded / CommitmentRevoked）
 *
 * 本合约不做任何零知识证明；ZK proof 解码在链下做。
 * 这里只保存 commit、撤销状态、颁发者，足够 demo 流程跑通"链上有据可查"。
 */
contract IdentityRegistry {
    struct CommitInfo {
        uint64 chainTag;     // 凭证声明的来源链（network1=1 / network2=2 / 其他自定义）
        uint64 issuedAt;     // 写入区块时间戳
        uint64 revokedAt;    // 0 表示未撤销
        address issuer;      // 颁发该 commitment 的监管方地址
    }

    mapping(bytes32 => CommitInfo) private _commits;
    bytes32[] private _allCommits;

    event CommitmentAdded(bytes32 indexed commitment, address indexed issuer, uint64 chainTag, uint64 issuedAt);
    event CommitmentRevoked(bytes32 indexed commitment, address indexed by, uint64 revokedAt);

    error CommitmentExists();
    error CommitmentMissing();
    error AlreadyRevoked();
    error NotIssuer();

    /**
     * 监管方颁发凭证后调用，把 commitment 写到链上。
     * commitment 推荐取法：keccak256(canonical(credential_payload) || salt)。
     */
    function commit(bytes32 commitment, uint64 chainTag) external {
        if (_commits[commitment].issuedAt != 0) revert CommitmentExists();
        _commits[commitment] = CommitInfo({
            chainTag: chainTag,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0,
            issuer: msg.sender
        });
        _allCommits.push(commitment);
        emit CommitmentAdded(commitment, msg.sender, chainTag, uint64(block.timestamp));
    }

    /**
     * 仅原颁发者可撤销该 commitment。
     */
    function revoke(bytes32 commitment) external {
        CommitInfo storage c = _commits[commitment];
        if (c.issuedAt == 0) revert CommitmentMissing();
        if (c.revokedAt != 0) revert AlreadyRevoked();
        if (c.issuer != msg.sender) revert NotIssuer();
        c.revokedAt = uint64(block.timestamp);
        emit CommitmentRevoked(commitment, msg.sender, c.revokedAt);
    }

    function getCommitInfo(bytes32 commitment) external view returns (CommitInfo memory) {
        return _commits[commitment];
    }

    function isCommitted(bytes32 commitment) external view returns (bool) {
        return _commits[commitment].issuedAt != 0;
    }

    function isActive(bytes32 commitment) external view returns (bool) {
        CommitInfo storage c = _commits[commitment];
        return c.issuedAt != 0 && c.revokedAt == 0;
    }

    function totalCommitments() external view returns (uint256) {
        return _allCommits.length;
    }

    /**
     * 分页读取 commitments，便于前端/追溯模块批量拉取。
     * offset 超出长度时返回空数组。
     */
    function listCommitments(uint256 offset, uint256 limit) external view returns (bytes32[] memory page) {
        uint256 total = _allCommits.length;
        if (offset >= total || limit == 0) {
            return new bytes32[](0);
        }
        uint256 end = offset + limit;
        if (end > total) end = total;
        page = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = _allCommits[i];
        }
    }
}
