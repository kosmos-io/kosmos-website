---
id: calico-etcd-zh
title: 'calico数据存储方式为etcd'
---

# 支持calico数据存储方式为etcd

本页面描述当calico数据存储模式为etcd的时候，如何操作以保证Kosmos正常连通多集群网络。

# 准备开始

你的calico的datastoreType需为etcd。

要获悉datastoreType，可通过`kubectl -nkube-system get deploy calico-kube-controllers -oyaml` ，查看`.spec.template.spec.containers.env` 。如果配置了`ETCD_ENDPOINTS`、`ETCD_CA_CERT_FILE`等环境变量，并且无`DATASTORE_TYPE` 或者`DATASTORE_TYPE` 不为kubernetes。则calico的datastoreType为etcd，反之为kubernetes。

主集群需存在calico所在集群对应的`clusters.kosmo.io`资源实例。

即如果该集群为主集群，则已经`kosmosctl install`完成；如果该集群为子集群，则已经`kosmosctl join`完成。

# 方法概览

虽然以下演示中cluster为子集群，但是主集群同样适用。

1. cluster配置datastoreType为etcdv3
2. 集群内配置configmap连接etcd
3. 检查校验

# cluster配置datastoreType为etcdv3

首先查询cluster，kosmos-control-cluster为主集群对应的cluster实例，leafcluster为etcd的calico所在的集群对应的实例。

```bash
kubectl get clusters.kosmos.io
NAME                     NETWORK_TYPE   IP_FAMILY
leafcluster                 gateway        ipv4
kosmos-control-cluster   p2p            all
```

为leafcluster增加annotations`datastoreType=etcdv3`

```bash
kubectl annotate clusters.kosmos.io leafcluster datastoreType=etcdv3
cluster.kosmos.io/leafcluster annotated
```

# 集群内配置configmap连接etcd

在leafcluster集群的kosmos-system命名空间下增加etcd配置的configmap，示例如下。

```yaml
apiVersion: v1
data:
  DatastoreType: "etcdv3"
  EtcdCACert: "<base64加密的cacert>"
  EtcdCert: "<base64加密的cert>"
  EtcdEndpoints: "https://<etcd的ip>:2379"
  EtcdKey: "<base64加密的key>"
kind: ConfigMap
metadata:
  name: leafcluster # 需要与clusters.kosmos.io的名字保持一致
  namespace: kosmos-system
```

创建configmap

```bash
kubectl apply -f calico_etcd.yaml
```

# 检查校验

在主集群查看是否有对应子集群的clusternode实例，并且网卡和ip可以正常显示。

本实例中leafcluster集群下只有两个node。

```bash
kubectl get clusternode
NAME                                       ROLES         INTERFACE    IP
...
leafcluster-node1                                         eth0   192.168.0.1
leafcluster-node2                                         eth0   192.168.0.2
```