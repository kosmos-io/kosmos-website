---
id: node-not-ready_zh
title: 'Kosmos 节点 NotReady'
---

# Kosmos 节点 NotReady

## Kosmos 节点 NotReady 解决方案

### 简介
假设我们已经在主集群上注册了集群 `cluster7`：
````shell script
$ kubectl get node
NAME               STATUS   ROLES                         AGE     VERSION
ecs-54004033-001   Ready    worker                        50d     v1.21.5
ecs-54004033-002   Ready    control-plane,master,worker   50d     v1.21.5
kosmos-cluster7    Ready    agent                         5d22h   v1.21.5
````

Kosmos 的 clustertree-cluster-manager 将持续监视 `cluster7` 集群的资源使用情况和集群状态，并将其更新到主集群上的叶节点 `kosmos-cluster7`。
````shell script
$ kubectl get deploy -nkosmos-system
NAME                             READY   UP-TO-DATE   AVAILABLE   AGE
clusterlink-controller-manager   1/1     1            1           5d22h
clusterlink-elector              2/2     2            2           5d22h
clusterlink-network-manager      1/1     1            1           5d22h
clustertree-cluster-manager      1/1     1            1           5d22h
kosmos-operator                  1/1     1            1           5d22h
kosmos-webhook                   1/1     1            1           11
````
如果主集群与 `cluster7` 集群之间存在网络波动，Kosmos 将检测到此异常，并将主集群上叶节点 `kosmos-cluster7` 的状态设置为 "NotReady"。
这将触发 Kubernetes 的 Pod 驱逐行为，意味着在 "NotReady" 节点上的 Pod 将被驱逐到其他 Ready 节点。

然而，由于网络波动，`kosmos-cluster7` 的状态在驱逐过程中可能会再次变为 "Ready"。
但最初驱逐的 Pod 的事件仍将发送到 "cluster7" 集群，导致在 "cluster7" 集群上的正常运行的 Pod 被删除或重新启动，从而影响业务。

### 解决方案：集成 Kyverno 解决 Kosmos 节点 NotReady 的问题
[Kyverno](https://kyverno.io/) 通过 Kubernetes 准入 Webhook、后台扫描和源代码库扫描来验证、变更、生成和清理配置。
Kyverno 策略可以作为 Kubernetes 资源进行管理。

它的主要功能如下：

- 验证、变更、生成或清理（删除）任何资源
- 验证容器镜像以用于软件供应链安全性
- 使用标签选择器和通配符匹配资源
- 在命名空间间同步配置
- 使用准入控制阻止非符合资源，或报告策略违规

本文将解释如何使用 Kyverno 的准入 Webhook 来防止 Kosmos 节点 NotReady 时的 Pod 驱逐。

#### 什么是准入 Webhook？
准入 Webhook 是一段代码，在对象持久化到 Kubernetes API 服务器之前拦截请求。
它允许请求通过认证和授权后才能通过。准入控制器可以执行验证、变更或两者都执行。
变更控制器修改它们处理的资源对象，而验证控制器不会。如果任何控制器在任何阶段拒绝请求，整个请求将立即被拒绝，并将错误返回给最终用户。

![K8s_Admission_Webhook.png](img/K8s_Admission_Webhook.png)

#### 解决方案

##### 安装 Kyverno
[安装 Kyverno](https://kyverno.io/docs/installation/methods/)

```shell script
kubectl create -f https://github.com/kyverno/kyverno/releases/download/v1.10.0/install.yaml
```

##### 配置 ClusterPolicy
以下是四种情况下 K8s 驱逐 Pod：

- **用户发起**：由 API 发起的驱逐请求。例如，节点维护期间，为了避免节点突然下线对服务造成的影响，会驱逐节点上的所有 Pod。
- **Kubelet 发起**：定期检查节点资源。当资源不足时，基于优先级，将驱逐一些 Pod。
- **kube-controller-manager 发起**：定期检测所有节点。当节点的 NotReady 状态超过一段时间时，将驱逐节点上的所有 Pod，以便将其重新调度到其他正常节点上运行。启用污点驱逐时，在节点上出现 `NoExecute` 污点后，无法容忍污点的 Pod 将立即被驱逐。对于可以容忍污点的 Pod，在 Pod 上配置的最小污点容忍时间后，将被驱逐。
- **kube-scheduler 发起**：当实现抢占调度时，低优先级 Pod 可能会被驱逐，以为高优先级和抢占 Pod 腾出位置，从而使高优先级 Pod 可以正常调度。

使用以下配置，我们将仅阻止符合以下三个条件的 Pod 删除事件：

(1) 节点状态为 NotReady

(2) 节点是 KosmosNode

(3) 用户名为 system:serviceaccount:kube-system:node-controller（属于 node-controller 的 kube-controller-manager）

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: kosmos-node-not-ready
spec:
  validationFailureAction: Enforce
  background: false
  rules:
  - match:
      any:
      - resources:
          kinds:
          - Pod
          operations:
          - DELETE
    name: kosmos-node-not-read
    context:
    - name: nodeStatus
      apiCall:
        urlPath: /api/v1/nodes/{{request.oldObject.spec.nodeName}}
        jmesPath: status.conditions[?type=='Ready'].status | [0]
    - name: isKosmosNode
      apiCall:
        urlPath: /api/v1/nodes/{{request.oldObject.spec.nodeName}}
        jmesPath: metadata.labels."kosmos.io/node"
    preconditions:
      all:
      - key: "{{ request.userInfo.username }}"
        operator: Equals
        value: "system:serviceaccount:kube-system:node-controller"
      - key: "{{ nodeStatus }}"
        operator: NotEquals
        value: "True" 
      - key: "{{ length(isKosmosNode) }}"
        operator: GreaterThan
        value: 0
    validate:
      message: "{{ request.userInfo.username }} 不允许删除 NotReady Kosmos {{request.oldObject.spec.nodeName}} 节点上的 Pod {{request.oldObject.metadata.name}}。"
      deny: {}
```

当 Kosmos 节点状态为 NotReady 时，将阻止在此类节点上的 Pod。您可以通过查看 kyverno-admission-controller 来查看以下日志。

```shell script
handlers.go:139] webhooks/resource/validate "msg"="admission request denied" "clusterroles"=["system:basic-user","system:controller:node-controller","system:discovery","system:public-info-viewer","system:service-account-issuer-discovery"] "gvk"={"group":"","version":"v1","kind":"Pod"} "gvr"={"group":"","version":"v1","resource":"pods"} "kind"="Pod" "name"="example-deployment-6cc4fd9bd7-kkm8z" "namespace"="default" "operation"="DELETE" "resource.gvk"={"Group":"","Version":"v1","Kind":"Pod"} "roles

"=null "uid"="7f25ee88-4522-45fd-a6ba-38733122b443" "user"={"username":"system:serviceaccount:kube-system:node-controller","uid":"5a13be66-71fd-40e3-9553-00eb0825fbb0","groups":["system:serviceaccounts","system:serviceaccounts:kube-system","system:authenticated"]}
event.go:307] "Event occurred" object="kosmos-node-not-ready" fieldPath="" kind="ClusterPolicy" apiVersion="kyverno.io/v1" type="Warning" reason="PolicyViolation" message="Pod default/example-deployment-6cc4fd9bd7-kkm8z: [kosmos-node-not-ready] fail (blocked);  system:serviceaccount:kube-system:node-controller delete pod example-deployment-6cc4fd9bd7-kkm8z of NotReady Kosmos kosmos-cluster2 Node is not allowed. "
validation.go:103] webhooks/resource/validate "msg"="validation failed" "action"="Enforce" "clusterroles"=["system:basic-user","system:controller:node-controller","system:discovery","system:public-info-viewer","system:service-account-issuer-discovery"] "failed rules"=["kosmos-node-not-ready"] "gvk"={"group":"","version":"v1","kind":"Pod"} "gvr"={"group":"","version":"v1","resource":"pods"} "kind"="Pod" "name"="example-deployment-6cc4fd9bd7-sb7m7" "namespace"="default" "operation"="DELETE" "policy"="kosmos-node-not-ready" "resource"="default/Pod/example-deployment-6cc4fd9bd7-sb7m7" "resource.gvk"={"Group":"","Version":"v1","Kind":"Pod"} "roles"=null "uid"="251f1877-4f2c-40ec-9bca-8ceb7c9c845f" "user"={"username":"system:serviceaccount:kube-system:node-controller","uid":"5a13be66-71fd-40e3-9553-00eb0825fbb0","groups":["system:serviceaccounts","system:serviceaccounts:kube-system","system:authenticated"]}
```
