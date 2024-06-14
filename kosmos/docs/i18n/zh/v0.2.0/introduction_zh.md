---
id: introduction_zh
title: '简介'
---

# 简介

## 什么是 Kosmos？

Kosmos 是一个开源的、一体化的分布式云原生解决方案。
名称“kosmos”结合了代表 Kubernetes 的 'k' 和在希腊语中意为宇宙的 'cosmos'，象征着 Kubernetes 的无限扩展。

目前，Kosmos 主要包括三个主要模块：`ClusterLink`、`ClusterTree` 和 `Scheduler`。

## ClusterLink

ClusterLink 的目标是建立多个 Kubernetes 集群之间的连接。
此模块可以独立部署和使用。
ClusterLink 使 `Pods` 能够访问跨集群的 `Pods` 和 `Services`，就像它们在同一个集群中一样。
目前，此模块主要提供以下功能：
1. **跨集群 PodIP 和 ServiceIP 通信**：基于 VxLAN 和 IPsec 等隧道技术的多 Kubernetes 集群之间的 L3 网络连接。
这使用户能够在全球集群范围内进行 `Pod-to-Pod` 和 `Pod-to-Service` 通信。
2. **多模式支持**：在加入集群时，可以选择 `P2P` 或 `Gateway` 模式。
P2P 模式在覆盖层提供第二层网络互连，提供更短的网络路径和更优的性能。
选择 `Gateway` 模式时，它表现出更好的兼容性，非常适合混合和多云场景。
3. **支持全局 IP 分配**：ClusterLink 允许全局集群中存在两个或多个集群使用相同的 `Pod/Service` 网络段，方便用户管理子网。
ClusterLink 支持配置 `PodCIDR/ServiceCIDR` 和 `GlobalCIDR` 之间的映射关系。
`GlobalIP` 是全球唯一的，通过 `GlobalIP` 使冲突网络段的服务进行跨集群通信。
4. **支持 IPv6/IPv4 双栈**

### 网络架构

目前，Kosmos ClusterLink 模块包括以下关键组件：
![ClusterLink_Architecture.png](img/ClusterLink_Architecture.png)

- `Controller-Manager`：收集当前集群的网络信息并监控网络设置的变化。
- `Network-manager`：计算每个节点所需的网络配置。
- `Agent`：一个 DaemonSet 用于配置主机网络，包括隧道创建、路由、NAT 等任务。
- `Multi-Cluster-Coredns`：实现多集群服务发现。
- `Elector`：选举网关节点。

## ClusterTree

Kosmos clustertree 模块实现了 Kubernetes 的树状扩展，并实现了跨集群的应用编排。
这是 Kosmos 实现 Kubernetes 无限扩展的技术基础。
![ClusterTree_Architecture.png](img/ClusterTree_Architecture.png)

目前，它主要支持以下功能：
1. **完全兼容 k8s API**：用户可以像平常一样使用 `kubectl`、`client-go` 等工具与主集群的 `kube-apiserver` 进行交互。然而，`Pods` 实际上分布在整个多云、多集群环境中。
2. **支持有状态和 k8s 原生应用程序**：除了无状态应用程序外，Kosmos 还促进了有状态应用程序和 k8s 原生应用程序（与 `kube-apiserver` 交互）的编排。
Kosmos 将自动检测 `Pods` 所依赖的存储和权限资源，如 pv/pvc、sa 等，并在控制平面集群和数据平面集群之间进行双向同步。
3. **多样的 Pod 拓扑约束**：用户可以轻松控制全球集群内 Pods 的分布，如按地区、可用区、集群或节点。
这有助于实现高可用性并提高资源利用率。

## Scheduler

Kosmos 调度模块是在 Kubernetes 调度框架之上开发的扩展，旨在满足混合节点和子集群环境中的容器管理需求。
它提供以下核心功能，以提高容器管理的灵活性和效率：

1. **灵活的节点和集群混合调度**：Kosmos 调度模块允许用户根据自定义配置在真实节点和子集群之间智能调度工作负载。
这使用户能够最佳利用不同节点上的资源，确保工作负载的最佳性能和可用性。
基于此功能，Kosmos 使工作负载能够实现灵活的跨云和跨集群部署。
2. **细粒度的容器分布策略**：通过引入自定义资源定义 (CRD)，用户可以对工作负载的分布进行精确控制。
CRD 的配置允许用户明确指定不同集群中工作负载的 pod 数量，并根据需要调整分布比例。
3. **细粒度的碎片化资源处理**：Kosmos 调度模块智能检测子集群内的碎片化资源，有效避免 pod 部署遇到子集群内资源不足的情况。
这有助于在不同节点间实现更均衡的资源分配，增强系统稳定性和性能。

无论是构建混合云环境还是需要灵活地跨集群部署工作负载，Kosmos 调度模块都是一个可靠的解决方案，帮助用户更高效地管理容器化应用。

## 下一步是什么
- 开始 [安装 Kosmos](https://kosmos-io.github.io/website/v0.2.0/quick-start)。
- 学习 Kosmos 的 [教程](https://kosmos-io.github.io/website/v0.2.0/tutorials/mcs-discovery)。
- 学习 Kosmos 的 [提案](https://kosmos-io.github.io/website/v0.2.0/proposals/k8s-in-k8s)。