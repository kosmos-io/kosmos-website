---
id: calico-etcd
title: 'Calico data store type is set to etcd.'
---

# Support Calico data store type as etcd.

This page describes how to ensure Kosmos maintains proper connectivity in a multi-cluster network when the Calico data storage type is set to etcd.

# **Before you begin**

Your Calico `datastoreType` must be set to etcd.

To check the `datastoreType`, you can use the command `kubectl -nkube-system get deploy calico-kube-controllers -oyaml`, and check the `.spec.template.spec.containers.env` section. If environment variables like `ETCD_ENDPOINTS`, `ETCD_CA_CERT_FILE`, etc., are configured and `DATASTORE_TYPE` is either missing or set to something other than `kubernetes`, then the Calico `datastoreType` is etcd; otherwise, it is `kubernetes`.

The host cluster should have the corresponding `clusters.kosmo.io` resource instance for the cluster where Calico is located.

That is, if the cluster is the host cluster, it should have already been installed using `kosmosctl install`; if the cluster is a leaf cluster, it should have already been joined using `kosmosctl join`.

# Overall approach

Although in the following demonstration the cluster is a leaf cluster, the same steps apply to the host cluster.

1. Configure the cluster's `datastoreType` as etcdv3.
2. Configure a configmap within the cluster to connect to etcd.
3. check.

# Configure the cluster's datastoreType as etcdv3.

First, query the `clusters.kosmos.io`. `kosmos-control-cluster` is the cluster instance corresponding to the host cluster, and `leafcluster` is the cluster instance corresponding to the one where Calico with etcd is located.

```bash
kubectl get clusters.kosmos.io
NAME                     NETWORK_TYPE   IP_FAMILY
leafcluster                 gateway        ipv4
kosmos-control-cluster   p2p            all
```

Add the annotation `datastoreType=etcdv3` to `leafcluster`.

```bash
kubectl annotate clusters.kosmos.io leafcluster datastoreType=etcdv3
cluster.kosmos.io/leafcluster annotated
```

# Configure a ConfigMap within the cluster to connect to etcd.

Add the ConfigMap for etcd configuration under the `kosmos-system` namespace in the `leafcluster` cluster. An example is shown below.

```yaml
apiVersion: v1
data:
  DatastoreType: "etcdv3"
  EtcdCACert: "<base64 encoded cacert>"
  EtcdCert: "<base64 encoded cert>"
  EtcdEndpoints: "https://<etcd IP>:2379"
  EtcdKey: "<base64 encoded key>"
kind: ConfigMap
metadata:
  name: leafcluster # Must match the name in clusters.kosmos.io
  namespace: kosmos-system
```

create configmap

```yaml
kubectl apply -f calico_etcd.yaml
```

# check

Check in the host cluster to see if there is a corresponding `clusternode` instance for the leaf cluster, and ensure that the network interface and IP are displayed correctly.

In this example, there are only two nodes under the `leafcluster` cluster.

```yaml
kubectl get clusternode
  NAME                                       ROLES         INTERFACE    IP
...
  leafcluster-node1                                         eth0   192.168.0.1
  leafcluster-node2                                         eth0   192.168.0.2
```