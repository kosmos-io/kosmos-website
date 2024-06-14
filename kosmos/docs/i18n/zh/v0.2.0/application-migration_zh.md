---
id: application-migration_zh
title: '应用迁移'
---

# 应用迁移
Kosmos 提供应用迁移功能，帮助用户将现有应用程序从子集群迁移到 Kosmos 控制平面集群。

## 应用迁移解决方案

### 简介
在 Kosmos 多集群设计架构中，用户可以使用 kubectl、client-go 等工具与控制平面集群的 kube-apiserver 交互，创建部署或有状态的应用程序等。
实际的 Pod 实例在子集群中运行。

然而，对于在子集群中未通过 Kosmos 控制平面创建的现有应用程序，这些应用程序无法在控制平面集群中查看和管理。

Kosmos 提供应用迁移功能，支持将命名空间中的应用程序迁移到控制平面集群。
整个过程无需重新启动应用程序 Pod 实例，确保对业务运营的最小影响。

### 设计细节
应用迁移主要包括三个过程：应用备份 -> 删除所有者对象 -> 在控制平面中重建应用程序。

#### 应用备份
Kosmos 首先备份目标命名空间中的所有命名空间级别资源，以及依赖的集群级别资源，如集群角色、集群角色绑定、持久卷等。
备份文件存储在 Kosmos 的 PVC 中。

#### 删除所有者对象
Kosmos 子集群仅运行 Pod，它们的所有者 StatefulSet 或 ReplicaSet 需要在 Kosmos 控制平面中删除并重建。
类似地，ReplicaSet 的所有者 Deployment，以及 StatefulSet 和 Deployment 的所有者，需要在 Kosmos 控制平面中删除并重建。

通过使用自上而下的级联删除所有者对象（例如，首先删除 Deployment，然后删除 ReplicaSet），Pod 不受影响并保持运行状态。

#### 在控制平面中重建应用程序
基于备份资源，控制平面集群创建所有迁移后的资源，包括命名空间、Pod、部署、配置映射、服务账户等。
为了与子集群中的 Pod 保持一致并保持其运行状态，应用程序使用自下而上的方法进行重建（例如，首先创建 Pod，然后创建 ReplicaSet）。

#### CRD API
提供 PromotePolicy CRD API 用于配置迁移策略。
PromotePolicy 是一个集群范围的 CRD API。以下是如何使用它的示例：
```shell script
apiVersion: kosmos.io/v1alpha1
kind: PromotePolicy
metadata:
  name: promote-policy-sample
spec:
  includedNamespaces:
    - namespace1
    - namespace2
  excludedNamespaceScopedResources:
    - events
    - events.events.k8s.io
    - endpoints
    - endpointslices.discovery.k8s.io
  clusterName: member-cluster1
```
其中：
- includedNamespaces: 要迁移的命名空间。
- excludedNamespaceScopedResources: 不应迁移的命名空间级资源。
  建议保留示例配置，并根据实际需求添加其他配置。
- clusterName: Kosmos 子集群的名称。

#### 回滚
Kosmos 支持迁移的回滚功能。
成功迁移后，可以将子集群中现有的应用程序恢复到其初始状态。
只需编辑 PromotePolicy YAML 文件，并添加配置 'rollback'=true。
```shell script
apiVersion: kosmos.io/v1alpha1
kind: PromotePolicy
metadata:
  name: promote-policy-sample
spec:
  rollback: "true"
  includedNamespaces:
    - namespace1
    - namespace2
  excludedNamespaceScopedResources:
    - events
    - events.events.k8s.io
    - endpoints
    - endpointslices.discovery.k8s.io
  clusterName: member-cluster1
```

### 测试计划

#### 准备工作
首先，需要部署 [Kosmos](https://github.com/kosmos-io/kosmos)（必须安装 clustertree 模块）并添加一个子集群。

#### 在子集群中创建现有应用程序
以在子集群中部署 nginx 应用程序为例。
```shell script
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: nginx-test
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 1
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14-alpine
        ports:
        - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: nginx-test
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

#### 创建迁移策略
```shell script
# kubectl apply -f promote-nginx.yaml
apiVersion: kosmos.io/v1alpha1
kind: PromotePolicy
metadata:
  name: promote-policy-example
spec:
  includedNamespaces:
    - nginx-test
  excludedNamespaceScopedResources:
    - events
    - events.events.k8s.io
    - endpoints
    - endpointslices.discovery.k8s.io
  clusterName: cluster-36-28
```

#### 检查迁移结果
检查迁移进度：
```shell script
# kubectl describe promotepolicy promote-policy-example
Name:         promote-policy-example
Namespace:    default
Labels:       <none>
Annotations:  <none>
API Version:  kosmos.io/v1alpha1
Kind:         PromotePolicy
Metadata:
  Creation Timestamp:  2024-03-11T10:57:47Z
  Generation:          3
  Resource Version:  405947183
  UID:               0e32dd93-c370-4874-b9a7-37a6894cd373
Spec:
  Cluster Name:  cluster-36-28
  Excluded Namespace Scoped Resources:
    events
    events.events.k8s.io
    endpoints
    endpointslices.discovery.k8s.io
    controllerrevisions.apps
  Included Namespaces:
    nginx-test
Status:
  Backedup File:  /data/backup/promote-policy-sample20240311-104907
  Phase:          Completed
Events:           <none>
```
当 Status.Phase 为 'Completed' 时，表示迁移成功。
此时，可以在控制平面集群中查看和管理 nginx-test 命名空间中的所有应用程序。

#### 回滚
编辑 promote-nginx.yml 文件，并添加配置 'rollback'=true：
```shell script
# kubectl apply -f promote-nginx.yaml
apiVersion: kosmos.io/v1alpha1
kind: PromotePolicy
metadata:
  name: promote-policy-example
spec:
  rollback: "true"
  includedNamespaces:
    - nginx-test
  excludedNamespaceScopedResources:
    - events
    - events.events.k8s.io
    - endpoints
    - endpointslices.discovery.k8s.io
  clusterName: cluster-36-28
```

回滚结果检查：
```shell script
# kubectl describe promotepolicy promote-policy-example
Name:         promote-policy-example
Namespace:    default
Labels:       <none>
Annotations:  <none>
API Version:  kosmos.io/v1alpha1
Kind:         PromotePolicy
Metadata:
  Creation Timestamp:  2024-03-11T10:57:47Z
  Generation:          5
  Resource Version:  405953692
  UID:               0e32dd93-c370-4874-b9a7-37a6894cd373
Spec:
  Cluster Name:  cluster-36-28
  Excluded Namespace Scoped Resources:
    events
    events.events.k8s.io
    endpoints
    endpointslices.discovery.k8s.io
    controllerrevisions.apps
  Included Namespaces:
    nginx-test
Status:
  Backedup File:  /data/backup/promote-policy-sample20240311-104907
  Phase:          RolledBack
Events:           <none>
```
当 `Status.Phase` 为 'RolledBack' 时，表示回滚成功。
此时，nginx-test 命名空间中的应用程序在控制平面集群中无法查询到。
