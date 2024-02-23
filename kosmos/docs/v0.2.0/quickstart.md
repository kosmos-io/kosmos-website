---
id: quick-start
title: 'Quick Start'
---

# Quick Start
Kosmos is equipped with a tool called kosmosctl, which allows for quick deployment of Kosmos components, adding clusters, and testing network connectivity.

## kosmosctl
````shell script
wget https://github.com/kosmos-io/kosmos/releases/tag/v0.2.0-lts/kosmosctl-linux-amd64
mv kosmosctl-linux-amd64 kosmosctl
````

## Install Kosmos
The following command allows you to quickly run an experimental environment with three clusters. Install the control plane in the host cluster.
````shell script
kosmosctl install  --cni calico --default-nic eth0 (We build a network tunnel based the network interface value passed by the arg default-nic)
````

## Join the Leaf Cluster
````shell script
kosmosctl join cluster --name cluster1 --kubeconfig ~/kubeconfig/cluster1-kubeconfig  --cni calico --default-nic eth0  --enable-all
kosmosctl join cluster --name cluster2 --kubeconfig ~/kubeconfig/cluster2-kubeconfig  --cni calico --default-nic eth0  --enable-all
````
And then we can Use the Kosmos clusters like single cluster.
