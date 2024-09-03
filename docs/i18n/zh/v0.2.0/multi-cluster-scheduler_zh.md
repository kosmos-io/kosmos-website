---
id: mc-scheduler_zh
title: '多集群调度器'
---

# 多集群调度器

当 Kosmos 加入一个成员集群后，它会映射一个带有 `kosmos.io/node=true:Noschedule` 污点的虚拟节点，因此 Kubernetes 默认调度器无法将 Pod 调度到该虚拟节点（即成员集群）上。
部署 kosmos-scheduler 后，用户可以通过 kosmos-scheduler 中的 `LeafNodeTaintToleration` 调度插件容忍 `kosmos.io/node=true:Noschedule` 污点，从而实现成员集群和主机集群节点之间的混合调度效果。

对于带有 PV/PVC 的 Pod，还需在 kosmos-scheduler 中配置 `LeafNodeVolumeBinding` 调度插件，以在存储卷绑定过程中直接使用带有 `kosmos.io/node=true:Noschedule` 污点的虚拟节点。

需要注意的是，对于不同版本的 Kubernetes，发布的默认调度器所依赖的调度模块（调度框架）也会随版本变化而变化。目前，Kosmos 已适配了两个版本（`release-1.21.5` 和 `release-1.26.3`）。以下验证部分将使用 `release-1.21.5` 进行部署和测试。

## 多集群调度器解决方案

### 简介
调度器框架最初通过 Kubernetes 增强提案中的 [624-scheduling-framework](https://link.zhihu.com/?target=https%3A//github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/624-scheduling-framework) 提案引入，主要实现以下目标：
- 使调度器更加可扩展。
- 通过将一些功能移至插件，使调度器核心更简单。
- 在框架中提出扩展点。
- 提出根据收到的结果继续或中止的插件结果接收机制。
- 提出处理错误并将其与插件通信的机制。

为此，调度器框架定义了多个扩展点，如下图所示：
![MC_Scheduler.png](img/MC_Scheduler.png)

kosmos-scheduler 中的 `LeafNodeTaintToleration` 和 `LeafNodeVolumeBinding` 调度插件主要是基于 Kubernetes 默认调度器的 `NodeTaintToleration` 和 `NodeVolumeBinding` 调度插件进行优化的。
`LeafNodeTaintToleration` 插件主要在 `Filter` 扩展点中为虚拟节点上的 `kosmos.io/node=true:Noschedule` 污点添加容忍。
`LeafNodeVolumeBinding` 插件主要在 `Filter`、`Reserve`、`Unreserved` 和 `PreBind` 扩展点上起作用，并直接传递带有 `kosmos.io/node=true:Noschedule` 污点的虚拟节点。

### 先决条件

#### 安装 Kosmos
参考 Kosmos 快速入门文档 https://github.com/kosmos-io/kosmos 并为多集群网络启用 ClusterLink 模块。使用 kosmosctl 工具：
````shell script
kosmosctl install --cni calico --default-nic eth0 // 我们基于传递的网络接口值构建网络隧道
````
:::info 提示
至少部署 clustertree 模块并正确加入叶子集群。
:::

#### 加入叶子集群
````shell script
kosmosctl join cluster --name cluster1 --kubeconfig ~/kubeconfig/cluster1-kubeconfig --cni calico --default-nic eth0 --enable-link
````

### 部署 Kosmos-scheduler
1. 配置调度器和调度策略：
````shell script
---
# kosmos-scheduler 调度策略
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
  namespace: kosmos-system
data:
  scheduler-config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1beta1
    kind: KubeSchedulerConfiguration
    leaderElection:
      leaderElect: true
      resourceName: kosmos-scheduler
      resourceNamespace: kosmos-system
    profiles:
      - schedulerName: kosmos-scheduler
        plugins:
          preFilter:
            disabled:
              - name: "VolumeBinding"
            enabled:
              - name: "LeafNodeVolumeBinding"
          filter:
            disabled:
              - name: "VolumeBinding"
              - name: "TaintToleration"
            enabled:
              - name: "LeafNodeTaintToleration"
              - name: "LeafNodeVolumeBinding"
          score:
            disabled:
              - name: "VolumeBinding"
          reserve:
            disabled:
              - name: "VolumeBinding"
            enabled:
              - name: "LeafNodeVolumeBinding"
          preBind:
            disabled:
              - name: "VolumeBinding"
            enabled:
              - name: "LeafNodeVolumeBinding"
        pluginConfig:
          - name: LeafNodeVolumeBinding
            args:
              bindTimeoutSeconds: 5
---
# 调度器配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kosmos-scheduler
  namespace: kosmos-system
  labels:
    component: scheduler
spec:
  replicas: 1
  selector:
    matchLabels:
      component: scheduler
  template:
    metadata:
      labels:
        component: scheduler
    spec:
      volumes:
        - name: scheduler-config
          configMap:
            name: scheduler-config
            defaultMode: 420
      containers:
        - name: kosmos-scheduler
          image: ghcr.io/kosmos-io/scheduler:0.0.2
          command:
            - scheduler
            - --config=/etc/kubernetes/kube-scheduler/scheduler-config.yaml
          resources:
            requests:
              cpu: 200m
          volumeMounts:
            - name: scheduler-config
              readOnly: true
              mountPath: /etc/kubernetes/kube-scheduler
          livenessProbe:
            httpGet:
              path: /healthz
              port: 10259
              scheme: HTTPS
            initialDelaySeconds: 15
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /healthz
              port: 10259
              scheme: HTTPS
      restartPolicy: Always
      dnsPolicy: ClusterFirst
      serviceAccountName: kosmos-scheduler
      serviceAccount: kosmos-scheduler
````

2. 验证 kosmos-scheduler 服务：
````shell script
# 创建 kosmos-scheduler
kubectl -n kosmos-system get pod
NAME                                         READY   STATUS    RESTARTS   AGE
kosmos-scheduler-8f96d87d7-ssxrx             1/1     Running   0          24s
````

#### 示例
1. 在测试集群上部署 openebs

2. 使用案例 yaml（mysql-cluster.yaml）
````shell script
apiVersion: v1
kind: Secret
metadata:
  namespace: test-mysql
  name: my-secret
type: Opaque
data:
  # 需要指定 root 密码
  ROOT_PASSWORD: ${your_password}
  ## 在集群启动时创建的应用凭据
  # DATABASE:
  # USER:
  # PASSWORD:
---
kind: MysqlCluster
metadata:
  name: test-mysql-cluster
  namespace: test-mysql
spec:
  replicas: 2
  secretName: my-secret
  image: docker.io/percona:5.7
  mysqlVersion: "5.7"
  podSpec:
    affinity:         
      podAntiAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              mysql.presslabs.org/cluster: test-mysql-cluster
          topologyKey: kubernetes.io/hostname
  volumeSpec:
    persistentVolumeClaim:
      storageClassName: openebs-hostpath
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
````

3. 操作说明
````shell script
# 显示主机集群中的所有节点
kubectl get node
NAME                       STATUS     ROLES                       AGE   VERSION
kosmoscluster1-1           Ready      control-plane,master,node   21d   v1.21.5-eki.0
kosmoscluster1-2           Ready      node

                        21d   v1.21.5-eki.0
kosmos-member2-cluster-1   Ready      agent                       24m   v1.21.5-eki.0
kosmos-member2-cluster-2   Ready      agent                       24m   v1.21.5-eki.0
 
# 显示虚拟节点上的污点信息
kubectl describe node kosmos-member2-cluster-1  |grep Tai
Taints:             node.kubernetes.io/unreachable:NoExecute
 
kubectl describe node kosmos-member2-cluster-2  |grep Tai
Taints:             node.kubernetes.io/unreachable:NoExecute
 
# 使用 kosmos-scheduler 进行（混合）调度
kubectl apply -f  mysql-cluster.yaml
    
# 在主机集群中显示实例（混合）调度结果
kubectl get pod -owide -n test-mysql
NAME                            READY   STATUS    RESTARTS   AGE   IP               NODE                       NOMINATED NODE   READINESS GATES
test-mysql-cluster-mysql-0      4/4     Running   0          3m    2409:xxxxx:8ac   kosmoscluster1-2           <none>           <none>
test-mysql-cluster-mysql-1      4/4     Running   0          2m    2409:xxxxx:8ae   kosmos-member2-cluster-1   <none>           <none>

# 在成员集群中显示实例（混合）调度结果
kubectl get pod -owide -n test-mysql
NAME                            READY   STATUS    RESTARTS   AGE   IP               NODE                       NOMINATED NODE   READINESS GATES
test-mysql-cluster-mysql-1      4/4     Running   0          2m    2409:xxxxx:8ae   kosmos-member2-cluster-1   <none>           <none>
````

### 结论
可以看到，kosmos-scheduler 成功将用户实例的 Pod 调度到了主机集群和成员集群中。
