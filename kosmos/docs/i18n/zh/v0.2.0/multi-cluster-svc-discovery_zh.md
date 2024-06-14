---
id: mcs-discovery_zh
title: '多集群服务发现'
---

# 多集群服务发现
Kosmos提供了两种多集群服务发现的能力：
- 分布式多集群Service方案
- 全局中心core-dns方案。 其中在生产环境中，我们更推荐去中心化的分布式多集群Service方案

## 分布式多集群Service方案

### 介绍
Kosmos基于多集群服务API实现了多集群服务发现功能。用户可以将控制面集群生成的Service导出到成员集群，从而在成员集群对外提供服务。

:::info NOTE
使用该特性，需要保证控制面集群和成员集群的版本不低于v1.21，并且集群内core-dns的版本不低于v1.84.
:::

Kosmos分布式多集群Service的方案架构如下：

![MCS Architecture.svg](img/MCS_Architecture.svg)

Kosmos的控制器会监听控制面的ServiceExport和数据面的ServiceImport资源，并基于这两个MCS的资源的配置将控制面的Service和EndpointSlice同步到数据面集群。
在任意一个数据面集群，都可以通过Service对外暴露服务，每个集群的EndpointSlice都会包含控制面集群的工作负载的所有的Pod IP，从而实现了服务的的异地跨集群多活。

### 前提准备

#### 安装Kosmos
可以参考 https://github.com/kosmos-io/kosmos 并开启多集群网络模块。 使用`kosmosctl`工具：
````shell script
# 参数 default-nic 为可选参数，用于指定默认网卡
kosmosctl install --cni calico --default-nic eth0
````

#### 注册叶子集群
````shell script
kosmosctl join cluster --name cluster1 --kubeconfig ~/kubeconfig/cluster1-kubeconfig --cni calico --default-nic eth0 --enable-link
````

### 使用分布式多集群Service

#### 手动导出和导出Service
用户可以通过手动创建ServiceExport和ServiceImport的方式将Service下发到数据面集群。

1. 在数据面集群创建工作负载nginx，nginx的yaml如下：
````shell script
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      tolerations:
        - key: "kosmos.io/node"
          operator: "Equal"
          value: "true"
          effect: "NoSchedule"
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: nginx
              topologyKey: kubernetes.io/hostname
      containers:
        - name: nginx
          image: nginx:latest
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 31444
  type: NodePort
````
:::info NOTE
可以通过在yaml中指定节点亲和性将工作负载的pod调度到Kosmos的leaf节点上。
:::

2. 在控制面上创建ServiceExport将上面的nginx的Service导出：
````shell script
apiVersion: multicluster.x-k8s.io/v1alpha1
kind: ServiceExport
metadata:
  name: nginx
````

3. 在数据面集群1中创建ServiceImport将导出的Service创建到数据面集群1中：
````shell script
apiVersion: multicluster.x-k8s.io/v1alpha1
kind: ServiceImport
metadata:
  name: nginx
spec:
  type: ClusterSetIP
  ports:
    - protocol: TCP
      port: 80
````
此时就可以在数据面集群1通过相同的Service对外暴露服务。

### 自动导出导入Service到所有数据面集群
在某些场景下，用户需要自动的将控制面的Service同步到所有的数据面集群，而不想手动的创建ServiceExport和ServiceImport。
Kosmos提供了两种自动化导出和导入Service的方式。

#### 通过控制面Service的注解识别方式
对于需要自动导出下发到所有数据面集群的Service，用户可以手动的给Service添加注解。`kosmos.io/auto-create-mcs: "true"`，service的样例yaml如下：
````shell script
apiVersion: v1
kind: Service
metadata:
  name: nginx
  annotations:
    kosmos.io/auto-create-mcs: "true"
spec:
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 31444
  type: NodePort
````

#### 通过全局启动参数
对于一些不想涉及到自身代码改动的情况下，Kosmos也支持通过配置启动参数的方式自动下发Service。
在ClusterTree的启动服务中增加参数`--auto-mcs-prefix`，如配置`--auto-mcs-prefix=test`，kosmos，则所有test和kosmos前缀的Namespace下面的Service，将会被自动导出下发到所有的数据面集群。

### Service跨集群网络连通校验
`eps-probe-plugin` 是一个跨集群Service网络校验插件。
如上所说，Kosmos的控制器会将控制集群的Service和EndpointSlice同步到数据面集群。
当跨集群的网络连通出现故障时，就会导致EndpointSlice中的endpoint是不可用的，从而引发故障。

`eps-probe-plugin` 通过定时的检查endpoint中的pod-ip是否可达，将不可达的endpoint的地址更新到serviceImport的`kosmos.io/disconnected-address`中，Kosmos的控制器会将导出的Service对应的EndpointSlice中不可达的endpoint删除。

`eps-probe-plugin` 可通过如下的方式安装：
````shell script
kubectl apply -f https://raw.githubusercontent.com/kosmos-io/eps-probe-plugin/main/deploy/eps-probe-plugin.yaml
````

## 全局中心core-dns方案

### 介绍
全局中心core-dns方案如下图所示，所有的通过Kosmos下发的pod都通过控制面集群的core-dns解析域名请求，这种方式只适合在测试环境使用，在生产环境中，可能导致控制面集群的core-dns的请求压力过大。

要开启全局中心的core-dns方案，只需要将clusterTree服务的启动参数修改为 `--multi-cluster-service=false`.

![CoreDNS_Centralized_Architecture.svg](img/CoreDNS_Centralized_Architecture.svg)