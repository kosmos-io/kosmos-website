---
id: exe-and-log
title: 'Design of EXEC and Log in Kosmos'
---

# Design of EXEC and Log in Kosmos

## Kosmos EXEC and Log Solution 

### Introduction
In Kosmos, the pods scheduled to kosmos-node also support the `kubectl exec` and `kubectl log` functions. 
Since the overall architecture of `kubectl exec` and `kubectl log` is the same, we will use `kubectl exec` as a sample to introduce the overall architecture. 
The following diagram illustrates the overall design architecture.

![EXE Log_Arch.png](img/EXE_Log_Arch.png)

### Background Knowledge
First, let's explore how to implement `kubectl exec` in Kubernetes. 
The _**leaf-cluster**_ part of the architecture diagram is a representation of the `kubectl exec` function of a native cluster. 
The kubectl exec request initiated by the user is processed by apiserver. 
After receiving the exec request, apiserver needs to forward the request to the node where the pod is allocated, so it needs to query the information of the node where the pod is allocated. 
In the Kubernetes source code, apiserver will call the `ExecLocation` method to obtain the exec url of the pod. 
The code is as follows:
````shell script
// ExecLocation returns the exec URL for a pod container. If opts.Container is blank
// and only one container is present in the pod, that container is used.
func ExecLocation(
    ctx context.Context,
    getter ResourceGetter,
    connInfo client.ConnectionInfoGetter,
    name string,
    opts *api.PodExecOptions,
) (*url.URL, http.RoundTripper, error) {
    return streamLocation(ctx, getter, connInfo, name, opts, opts.Container, "exec")
}
````

`ExecLocation` calls the `streamLocation` method, and streamLocation obtains pod information through the pod name.
````shell script
func streamLocation(
    ctx context.Context,
    getter ResourceGetter,
    connInfo client.ConnectionInfoGetter,
    name string,
    opts runtime.Object,
    container,
    path string,
) (*url.URL, http.RoundTripper, error) {
    pod, err := getPod(ctx, getter, name)
    if err != nil {
        return nil, nil, err
    }
 
    // Try to figure out a container
    // If a container was provided, it must be valid
    container, err = validateContainer(container, pod)
    if err != nil {
        return nil, nil, err
    }
 
    nodeName := types.NodeName(pod.Spec.NodeName)
    if len(nodeName) == 0 {
        // If pod has not been assigned a host, return an empty location
        return nil, nil, errors.NewBadRequest(fmt.Sprintf("pod %s does not have a host assigned", name))
    }
    nodeInfo, err := connInfo.GetConnectionInfo(ctx, nodeName)
    if err != nil {
        return nil, nil, err
    }
    params := url.Values{}
    if err := streamParams(params, opts); err != nil {
        return nil, nil, err
    }
    loc := &url.URL{
        Scheme:   nodeInfo.Scheme,
        Host:     net.JoinHostPort(nodeInfo.Hostname, nodeInfo.Port),
        Path:     fmt.Sprintf("/%s/%s/%s/%s", path, pod.Namespace, pod.Name, container),
        RawQuery: params.Encode(),
    }
    return loc, nodeInfo.Transport, nil
}
````

Then the node name where the pod is allocated is obtained through `pod.Spec.NodeName`, and then a key method `GetConnectionInfo` is called. The code is as follows:
````shell script
// GetConnectionInfo retrieves connection info from the status of a Node API object.
func (k *NodeConnectionInfoGetter) GetConnectionInfo(ctx context.Context, nodeName types.NodeName) (*ConnectionInfo, error) {
    node, err := k.nodes.Get(ctx, string(nodeName), metav1.GetOptions{})
    if err != nil {
        return nil, err
    }
 
    // Find a kubelet-reported address, using preferred address type
    host, err := nodeutil.GetPreferredNodeAddress(node, k.preferredAddressTypes)
    if err != nil {
        return nil, err
    }
 
    // Use the kubelet-reported port, if present
    port := int(node.Status.DaemonEndpoints.KubeletEndpoint.Port)
    if port <= 0 {
        port = k.defaultPort
    }
 
    return &ConnectionInfo{
        Scheme:                         k.scheme,
        Hostname:                       host,
        Port:                           strconv.Itoa(port),
        Transport:                      k.transport,
        InsecureSkipTLSVerifyTransport: k.insecureSkipTLSVerifyTransport,
    }, nil
}
````

`GetConnectionInfo` obtains the node information through the node name, then uses `GetPreferredNodeAddress` to select a suitable host, and then through the `streamLocation` processing, an exec request URL is pieced together. 
The apiserver will know which node to forward the exec request to. 
The kubelet service running on the node will capture the exec request and then establish a link with the pod.

The above briefly introduces the process of establishing kubectl exec.

### Implementation in Kosmos
Next, let's take a look at the _**root-cluster**_ in the overall architecture diagram. 
In order for the exec request to be passed to the leaf cluster, the exec request needs to be forwarded. 

First, we need to tell apiserver that the ip address of kosmos-node is the podIP of our _**clustertree-cluster-manager**_, which will cause apiserver to forward the exec request to _**clustertree-cluster-manager**_. 
When we synchronize the node information of kosmos-node, we read it from the environment variable `LEAF_NODE_IP`. 
This environment variable is configured when starting the _**clustertree-cluster-manager**_ service. 
The key configuration fragment is as follows:
````shell script
spec:
   serviceAccountName: clustertree
   containers:
     - name: clustertree-cluster-manager
       image: ghcr.io/kosmos-io/clustertree-cluster-manager:__VERSION__
       imagePullPolicy: IfNotPresent
       env:
         - name: APISERVER_CERT_LOCATION
           value: /etc/cluster-tree/cert/cert.pem
         - name: APISERVER_KEY_LOCATION
           value: /etc/cluster-tree/cert/key.pem
         - name: LEAF_NODE_IP
           valueFrom:
             fieldRef:
               fieldPath: status.podIP
         - name: PREFERRED-ADDRESS-TYPE
           value: InternalDNS
````

Then we need to start a service similar to kubelet that listens to exec. 
In the _**clustertree-cluster-manager**_ service, we start a nodeserver service. 
The code snippet is as follows:
````shell script
nodeServer := nodeserver.NodeServer{
    RootClient:        mgr.GetClient(),
    GlobalLeafManager: globalleafManager,
}
go func() {
    if err := nodeServer.Start(ctx, opts); err != nil {
        klog.Errorf("failed to start node server: %v", err)
    }
}()
````

This service monitors exec and log requests, and will act as a proxy to forward the monitored requests to the corresponding leaf cluster. 
The source code is as follows:
````shell script
func (s *NodeServer) AttachRoutes(m *http.ServeMux) {
    r := mux.NewRouter()
    r.StrictSlash(true)
 
    r.HandleFunc(
        "/containerLogs/{namespace}/{pod}/{container}",
        api.ContainerLogsHandler(s.getClient),
    ).Methods("GET")
 
    r.HandleFunc(
        "/exec/{namespace}/{pod}/{container}",
        api.ContainerExecHandler(
            api.ContainerExecOptions{
                StreamIdleTimeout:     30 * time.Second,
                StreamCreationTimeout: 30 * time.Second,
            },
            s.getClient,
        ),
    ).Methods("POST", "GET")
 
    r.NotFoundHandler = http.HandlerFunc(api.NotFound)
 
    m.Handle("/", r)
}
````

With the forwarding part completed, we need to make the API server in the root cluster recognize the communication address of the kosmos-node as the address of the _**clustertree-cluster-manager**_ service. 
Therefore, when maintaining the status of kosmos-node, we synchronize the podIP of _**clustertree-cluster-manager**_ to kosmos-node. 
The complete process is as follows:
- The user initiates an exec request.
- The API server in the root cluster receives the exec request and queries the node information based on the pod information.
- The queried node host is the podIP of clustertree-cluster-manager.
- The API server in the root cluster establishes an exec connection with clustertree-cluster-manager.
- clustertree-cluster-manager receives the exec connection request, queries the pod information, and proxies the exec request to the leaf cluster.
With this process, Kosmos implements the exec functionality, and the log functionality works in the same way.

### Customization
When connecting with es products, there is a customized requirement. 
The above design will cause the IPs of all kosmos-node to be the podIPs of _**clustertree-cluster-manage**_. 
In the product design of es, nodeIP is used as the primary key, which causes the product to fail to be stored in the warehouse. 
For this purpose, kosmos has made a special design. 
The ip address in the node information obtained through kubectl get node -owide is of the InternalIP type.
```shell
sudo kubectl get nodes -owide
NAME                STATUS   ROLES                          AGE     VERSION     INTERNAL-IP     EXTERNAL-IP   OS-IMAGE                                        KERNEL-VERSION                                CONTAINER-RUNTIME
kosmos-control-1    Ready    control-plane,master,node      65d     v1.21.5     192.xx.xx.1     <none>        BigCloud Enterprise Linux For Euler 21.10 LTS   4.19.90-2107.6.0.0192.8.oe1.bclinux.x86_64    containerd://1.5.7
kosmos-control-2    Ready    node                           65d     v1.21.5     192.xx.xx.2     <none>        BigCloud Enterprise Linux For Euler 21.10 LTS   4.19.90-2107.6.0.0192.8.oe1.bclinux.x86_64    containerd://1.5.7
kosmos-cluster1     Ready    agent                          20d     v1.21.5     192.xx.xx.3     <none>
```

The function GetPreferredNodeAddress used by the apiserver mentioned above when querying the host of the node will select one from the Address list according to the priority, so in es, we set the podIP of _**clustertree-cluster-manage**_ as other priority higher than the InternalIP category address, as shown below, you can specify the type of ip and the value of ip.
````shell script
func GetAddress(ctx context.Context, rootClient kubernetes.Interface, originAddress []corev1.NodeAddress) ([]corev1.NodeAddress, error) {
    preferredAddressType := corev1.NodeAddressType(os.Getenv("PREFERRED-ADDRESS-TYPE"))
 
    if len(preferredAddressType) == 0 {
        preferredAddressType = corev1.NodeInternalDNS
    }
 
    prefixAddress := []corev1.NodeAddress{
        {Type: preferredAddressType, Address: os.Getenv("LEAF_NODE_IP")},
    }
 
    address, err := SortAddress(ctx, rootClient, originAddress)
 
    if err != nil {
        return nil, err
    }
 
    return append(prefixAddress, address...), nil
}
````

How to check address priority? By looking at the startup parameter of api-server - kubelet-preferred-address-types, the GetPreferredNodeAddress function is set here to obtain the priority of the host. 
By default, InternalDNS has the highest priority.
```shell
- --kubelet-preferred-address-types=InternalDNS,InternalIP,Hostname,ExternaLDNS,ExternalIP
```

### Conclusion
In Kosmos, both `kubectl exec` and `kubectl log` are "tricked" by the API server and redirected to our own _**clustertree-cluster-manager**_ service. 
This allows us to implement customized features in subsequent steps.