---
id: application-migration
title: 'Application Migration'
---

# Application Migration
Kosmos provides application migration functionality to help users migrate existing applications from subclusters to the Kosmos control plane cluster.

## Application Migration Solution

### Introduction
In the Kosmos multi-cluster design architecture, users can interact with the kube-apiserver of the control plane cluster using tools such as kubectl and client-go to create deployments or statefulset applications, etc. 
The actual Pod instances are running in the subclusters.

However, for existing applications in the subclusters that were not created through the Kosmos control plane, these applications cannot be viewed and managed in the control plane cluster.

Kosmos provides application migration functionality to support the migration of applications in a namespace to the control plane cluster. 
The entire process does not require restarting the application Pod instances, ensuring minimal impact on business operations.

### Design Details
Application migration mainly consists of three processes: application backup -> deletion of owner objects -> rebuilding applications in the control plane.

#### Application Backup
Kosmos first backs up all namespaced-level resources in the target namespace, as well as the dependent cluster-level resources, such as cluster roles, cluster role bindings, persistent volumes, etc. 
The backup files are stored in PVCs in Kosmos.

#### Deletion of Owner Objects
The subclusters in Kosmos only run Pods, and their owner StatefulSets or ReplicaSets need to be deleted and rebuilt in the Kosmos control plane. 
Similarly, the owner Deployment of a ReplicaSet, as well as the owner StatefulSet and Deployment, need to be deleted and rebuilt in the Kosmos control plane.

By using a top-down cascading deletion of owner objects (e.g., deleting the Deployment first and then the ReplicaSet), the Pods are not affected and remain in a running state.

#### Rebuilding Applications in the Control Plane
Based on the backup resources, the control plane cluster creates all the migrated resources, including namespaces, pods, deployments, config maps, service accounts, etc. 
In order to maintain consistency with the subcluster Pods and keep them in a running state, the applications are rebuilt using a bottom-up approach (e.g., creating the Pod first and then the ReplicaSet).

#### CRD API
The PromotePolicy CRD API is provided for configuring the migration policy. 
PromotePolicy is a cluster-wide CRD API. Here is an example of how to use it:
````shell script
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
````
where: 
- includedNamespaces: The namespaces to be migrated.
- excludedNamespaceScopedResources: The namespace-level resources that should not be migrated. 
It is recommended to keep the example configuration and add additional configurations as needed based on actual requirements.
- clusterName: The name of the Kosmos subcluster. 

#### Rollback
Kosmos supports rollback functionality for migrations. 
After a successful migration, the existing applications in the subcluster can be restored to their initial state. 
Simply edit the PromotePolicy YAML file and add the configuration 'rollback'=true.
````shell script
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
````

### Test Plans

#### Preparation
First, you need to deploy [Kosmos](https://github.com/kosmos-io/kosmos) (the clustertree module must be installed) and add a subcluster.

#### Create an Existing Application in the Subcluster
Deploy an nginx application in the subcluster as an example.
````shell script
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
      deletionGracePeriodSeconds: 30
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
````

#### Create a Migration Policy
````shell script
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
````

#### Check the Migration Result
Check the progress of the migration: 
````shell script
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
````
When Status.Phase is 'Completed', it means the migration is successful. At this point, you can view and manage all applications in the nginx-test namespace in the control plane cluster.

#### Rollback
Edit the promote-nginx.yml file and add the configuration ‘rollback’=true: 
````shell script
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
````

Check the rollback result: 
````shell script
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
````
When Status.Phase is 'RolledBack', it means the rollback is successful. 
At this point, the applications in the nginx-test namespace cannot be queried in the control plane cluster.
