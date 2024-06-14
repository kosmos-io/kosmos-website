---
id: ipsec-network
title: 'IPsec Cross-cluster Network'
---

# IPsec Cross-cluster container network solution

## Using IPsec Tunnels for Cross-Cluster Container Network Communication over Public IP

### Introduction
Kosmos is a multi-cluster solution, and networking is an essential part of it. 
Sometimes, there is a need for communication between Kubernetes clusters in different networks. 
In some cases, two or more clusters can only communicate with each other over the public internet. 
To address this, Kosmos has implemented a cross-cluster container network communication solution based on IPsec tunnels.

### Motivation
For the sake of disaster recovery, application deployments may require communication across different clouds or across regions within a single cloud (across VPCs). 
In such scenarios, container communication becomes challenging as the internal IP addresses of the machines are usually not directly accessible without a dedicated network connection. 
Common CNI tunnel technologies like `VxLAN` or `IPIP` may not work effectively in public internet environments. 
To solve this problem, Kosmos has implemented a container network communication solution based on IPsec tunnels for cross-cloud communication over the public internet. 
This solution addresses the need for communication across public networks while also considering data transmission security.

### Goals
The goal is to enable communication between pods in two clusters using elastic public IP addresses. The flow of traffic is illustrated in the diagram below:

![IPsec_Tunnel](img/IPsec_Tunnel.jpeg)

:::info NOTE
This solution does not address container network communication in host network mode within a cluster.
Only focuses on IPv4 container network communication and does not cover IPv6 container networks.
:::

## Design Details

### API Changes

#### Cluster API Changes
This solution adds three fields to the `.spec.ClusterLinkOptions`: `NodeElasticIPMap`, `ClusterPodCIDRs`, and `UseExternalApiserver`.
````shell script
type ClusterLinkOptions struct {
    ...
    // NodeElasticIPMap presents mapping between nodename in kubernetes and elasticIP
    // +optional
    NodeElasticIPMap map[string]string `json:"nodeElasticIPMap,omitempty"`
    // +optional
    ClusterPodCIDRs []string `json:"clusterpodCIDRs,omitempty"`
    // +optional
    UseExternalApiserver bool `json:"useexternalapiserver,omitempty"`
}
````
- `NodeElasticIPMap` field represents the mapping relationship between the NodeName in Kubernetes and the elastic public IP mounted on the node.
- `ClusterPodCIDRs` field is added to input the Pod CIDR, as it is not always easy to obtain the Pod CIDR for some CNI plugins.

Typically, Kosmos retrieves the service CIDR through the kube-apiserver parameters. However, in some cases, the kube-apiserver is not a pod within the cluster. Therefore, the `UseExternalApiserver` field is added to handle this scenario.

#### Clusternode API Changes
This solution adds a new field, `ElasticIP`, to the `.spec`, and a new field, `NodeStatus`, to the `.status`.
````shell script
type ClusterNodeSpec struct {
    ...
    // +optional
    ElasticIP string `json:"elasticip,omitempty"`
}

type ClusterNodeStatus struct {
    // +optional
    NodeStatus string `json:"nodeStatus,omitempty"`
}
````
- `ElasticIP` field describes the elastic public IP mounted on the node.
- `NodeStatus` field describes the status of the node, either "Ready" or "NotReady".

#### Nodeconfig API Changes
This solution adds two new fields, `XfrmPoliciesXfrmStates` and `IPsetsAvoidMasqs`, to the `.spec`.
````shell script
type NodeConfigSpec struct {
    XfrmPolicies     []XfrmPolicy `json:"xfrmpolicies,omitempty"`
    XfrmStates       []XfrmState  `json:"xfrmstates,omitempty"`
    IPsetsAvoidMasqs []IPset      `json:"ipsetsavoidmasq,omitempty"`
}

type XfrmPolicy struct {
    LeftIP   string `json:"leftip"`
    LeftNet  string `json:"leftnet"`
    RightIP  string `json:"rightip"`
    RightNet string `json:"rightnet"`
    ReqID    int    `json:"reqid"`
    Dir      int    `json:"dir"`
}

type XfrmState struct {
    LeftIP  string `json:"leftip"`
    RightIP string `json:"rightip"`
    ReqID   int    `json:"reqid"`
    SPI     uint32 `json:"spi"`
    PSK     string `json:"PSK"`
}

type IPset struct {
    CIDR string `json:"cidr"`
    Name string `json:"name"`
}
````

The new `XfrmPolicies` and `XfrmStates` fields define the IPsec-related rules created by Kosmos.

`IPsetsAvoidMasqs` field describes the network segments that need to avoid masquerading, allowing outbound traffic from containers to retain their container IP address.

### Component Modifications

#### Clusterlink-controller-manager
Handling scenarios where kube-apiserver pods are not within the cluster:
- The cluster-controller optimizes the retrieval of service CIDR through the `GetSvcByCreateInvalidSvc` function.

Node status synchronization:
- The node-controller synchronizes the `ElasticIP` field of the `clusternode` object based on the values in the `NodeElasticIPMap` field of the `cluster` object.
- The node-controller now updates the `.Status.NodeStatus` field of the `clusternode` object based on the node's status, "Ready" or "NotReady".

#### Clusterlink-elector
The elector module is used for `Gateway` selection in Gateway mode. It can now select a `Gateway` from the nodes in "Ready" state.

#### Clusterlink-network-manager
1. Adding support for some CNI plugins
For some CNI plugins, iptables rules are added to avoid masquerading, allowing outbound traffic from containers to retain their container IP address.

2. Building IPsec rules
Typically, Kosmos creates routes to achieve container communication. In IPsec tunnel mode, Kosmos creates `ip xfrm state` and `ip xfrm policy` rules if the `ElasticIP` field of the `clusternode` is not empty.

#### clusterlink-agent
Functions have been added to execute specific operations, equivalent to executing `ip xfrm state add/del` and `ip xfrm policy add/del` commands on the operating system.

To avoid masquerading, functions have been added to execute `ipset` commands and create iptables rules.

#### kosmosctl
`NodeElasticIP`, `UseExternalApiserver`, and `ClusterPodCIDRs` input parameters have been added to populate the new fields `NodeElasticIPMap`, `UseExternalApiserver`, and `ClusterPodCIDRs` in the `Cluster` CRD.
