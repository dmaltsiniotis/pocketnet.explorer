## 2021-11-23

### Notes
* The 0.20.x branch as significantly chagned the JSON structure of the peer list, also getting rid of a lot of properties.

### Added
* Latest hash is also displayed along side the latest block height for the nodes table list on the UI.

### Fixed
* Peer ip/hostnames are now first checked and resolved using DNS. This prevents duplicates nodes from being registered when peers are entered via DNS names instead of IPs. For example, before this fix the database had two entries for 1.pocketnet.app and 135.181.196.243, which are the same node.

* The 0.20.x branch has introduced a somewhat breaking change to the version property of the peer list JSON object
```
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