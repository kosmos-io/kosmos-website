---
id: node-not-ready
title: 'Kosmos Node NotReady'
---

# Kosmos Node NotReady

## Kosmos Node NotReady Solution

### Introduction
Assuming that we have registered the cluster `cluster7` on the master cluster:
````shell script
$ kubectl get node
NAME               STATUS   ROLES                         AGE     VERSION
ecs-54004033-001   Ready    worker                        50d     v1.21.5
ecs-54004033-002   Ready    control-plane,master,worker   50d     v1.21.5
kosmos-cluster7    Ready    agent                         5d22h   v1.21.5
````

The clustertree-cluster-manager of Kosmos will continuously monitor the resource usage and cluster status of the `cluster7` cluster, and update it to the leaf node `kosmos-cluster7` on the master cluster.
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
If there is a network fluctuation between the master cluster and the `cluster7` cluster, Kosmos will detect this anomaly and set the status of the leaf node `kosmos-cluster7` on the master cluster to "not ready". This will trigger the pod eviction behavior in Kubernetes, meaning that the pods on the "not ready" node will be evicted to other ready nodes.

However, due to network fluctuations, the status of `kosmos-cluster7` may become "ready" again during the eviction process. But the events of the originally evicted pods will still be sent to the "cluster7" cluster, causing normal running pods on the "cluster7" cluster to be deleted or restarted, thus affecting the business.

### Solution
#### What is an admission webhook?
An "admission webhook" is a piece of code that intercepts requests to the Kubernetes API Server before object persistence. It allows requests to pass through after authentication and authorization. Admission controllers can perform validation, mutation, or both. Mutating controllers modify the resource objects they handle, while Validating controllers do not. If any controller in any phase rejects a request, the entire request will be immediately rejected, and the error will be returned to the end user.

![K8s_Admission_Webhook.png](img/K8s_Admission_Webhook.png)

#### Kosmos Solution
We will create a ValidatingAdmissionWebhook controller specifically for the "DELETE Pod" event and when the nodeName is the Kosmos leaf node. When this node becomes "Not Ready," this controller will intercept the request, thereby stopping the pod eviction behavior of the API Server.

![Kosmos_Admission_Webhook.png](img/Kosmos_Admission_Webhook.png)

:::info Note
kosmos-webhook will be deployed as a separate controller in the master cluster.
:::







