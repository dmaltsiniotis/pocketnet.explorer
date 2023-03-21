# CHANGELOG

## 2021-12-11

### Notes

* Most of the network has moved on the 0.20.x "SQLite" version at this point.

### Added

* Node list: Click column headers to sort table.
* Note list: For "hidden" nodes, that is, nodes that are peered but for which public RPC is not set up, we can now infer the version from the peer info instead of leaving it at "Unknown"
* Implemented the following API calls for block explorer implementation:
  * searchbyhash (peer hash)
  * getlastblocks (count, starting height or -1 for latest, true/false for more verbose block info)
  * getblocktransactions (array of transaction hashes)
  * getaddresstransactions (wallet address hash)

### Updated

* Node list: The node table was updated to be more specific about node status and split out listen open vs RPC open ports.

### Fixed

* Node Graph: If the RPC port transitioned from open to closed, the peer list for that node is now removed. This prevents the directed graph from breaking due to missing nodes for edges.

## 2021-11-23

### Notes

* The 0.20.x branch as significantly changed the JSON structure of the peer list, also getting rid of a lot of properties.

### Added

* Latest hash is also displayed along side the latest block height for the nodes table list on the UI.

### Fixed

* Peer IP/hostnames are now first checked and resolved using DNS. This prevents duplicates nodes from being registered when peers are entered via DNS names instead of IPs. For example, before this fix the database had two entries for 1.pocketnet.app and 135.181.196.243, which are the same node.
* The 0.20.x branch has introduced a somewhat breaking change to the version property of the peer list JSON object

```text
0.19.x branch:
{
    "version": 70015
    "subver": "/Satoshi:0.19.19/"
}

0.20.x branch:
{
    "version": "/Satoshi:0.20.10/"
}

The system now accounts for this different usage of property fields across versions.
```
