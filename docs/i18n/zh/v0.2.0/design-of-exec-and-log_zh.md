---
id: exe-and-log_zh
title: 'Kosmos 中的 EXEC 和 Log 设计'
---

# Kosmos 中的 EXEC 和 Log 设计

## Kosmos 的 EXEC 和 Log 解决方案

### 简介
在 Kosmos 中，调度到 kosmos-node 的 pod 也支持 `kubectl exec` 和 `kubectl log` 功能。
由于 `kubectl exec` 和 `kubectl log` 的整体架构是相同的，我们将使用 `kubectl exec` 作为示例来介绍整体架构。
下图展示了整体设计架构。

![EXE Log_Arch.png](img/EXEC_Log_Arch.png)

### 背景知识
首先，让我们探讨在 Kubernetes 中如何实现 `kubectl exec`。
架构图中的 _**leaf-cluster**_ 部分是原生集群的 `kubectl exec` 功能的代表。
用户发起的 kubectl exec 请求由 apiserver 处理。
apiserver 在接收到 exec 请求后，需要将请求转发到 pod 所在的节点，因此需要查询分配了 pod 的节点信息。
在 Kubernetes 源代码中，apiserver 会调用 `ExecLocation` 方法以获取 pod 的 exec url。
代码如下：
````shell script
// ExecLocation 返回 pod 容器的 exec URL
// 如果 opts.Container 为空且 pod 中只有一个容器, 则使用该容器
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

`ExecLocation` 调用了 `streamLocation` 方法，streamLocation 通过 pod 名称获取 pod 信息。
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
 
    // 尝试确定一个容器
    // 如果提供了一个容器, 则它必须是有效的
    container, err = validateContainer(container, pod)
    if err != nil {
        return nil, nil, err
    }
 
    nodeName := types.NodeName(pod.Spec.NodeName)
    if len(nodeName) == 0 {
        // 如果 pod 尚未分配主机, 则返回空位置
        return nil, nil, errors.NewBadRequest(fmt.Sprintf("pod %s 尚未分配主机", name))
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

然后通过 `pod.Spec.NodeName` 获取分配 pod 的节点名称，再调用一个关键方法 `GetConnectionInfo`。
代码如下：
````shell script
// GetConnectionInfo 从 Node API 对象的状态中检索连接信息
func (k *NodeConnectionInfoGetter) GetConnectionInfo(ctx context.Context, nodeName types.NodeName) (*ConnectionInfo, error) {
    node, err := k.nodes.Get(ctx, string(nodeName), metav1.GetOptions{})
    if err != nil {
        return nil, err
    }
 
    // 查找 kubelet 报告的地址, 使用首选地址类型
    host, err := nodeutil.GetPreferredNodeAddress(node, k.preferredAddressTypes)
    if err != nil {
        return nil, err
    }
 
    // 使用 kubelet 报告的端口, 如果存在
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

`GetConnectionInfo` 通过节点名称获取节点信息，然后使用 `GetPreferredNodeAddress` 选择一个合适的主机，通过 `streamLocation` 处理后，拼接一个 exec 请求 URL。
apiserver 将知道应将 exec 请求转发到哪个节点。
运行在节点上的 kubelet 服务将捕获 exec 请求，然后与 pod 建立链接。

以上简要介绍了建立 kubectl exec 的过程。

### 在 Kosmos 中的实现
接下来，让我们看看整体架构图中的 _**root-cluster**_。
为了将 exec 请求传递到 leaf 集群，需要对 exec 请求进行转发。

首先，我们需要告诉 apiserver，kosmos-node 的 IP 地址是 _**clustertree-cluster-manager**_ 的 podIP，这将导致 apiserver 将 exec 请求转发到 _**clustertree-cluster-manager**_。
当我们同步 kosmos-node 的节点信息时，我们从环境变量 `LEAF_NODE_IP` 中读取该信息。
启动 _**clustertree-cluster-manager**_ 服务时配置了此环境变量。
关键配置片段如下：
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

然后我们需要启动一个类似于 kubelet 的服务来监听 exec。
在 _**clustertree-cluster-manager**_ 服务中，我们启动了一个 nodeserver 服务。
代码片段如下：
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

此服务监视 exec 和 log 请求，并将监视到的请求代理转发到相应的 leaf 集群。
源代码如下：
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

完成转发部分后，我们需要让根集群中的 API server 识别 kosmos-node 的通信地址为 _**clustertree-cluster-manager**_ 服务的地址。
因此，在维护 kosmos-node 的状态时，我们将 _**clustertree-cluster-manager**_ 的 podIP 同步到 kosmos-node。
完整的过程如下：
- 用户发起 exec 请求。
- 根集群中的 API server 接收到 exec 请求，并根据 pod 信息查询节点信息。
- 查询到的节点主机是 _**clustertree-cluster-manager**_ 的 podIP。
- 根集群中的 API server 与 _**clustertree-cluster-manager**_ 建立 exec 连接。
- _**clustertree-cluster-manager**_ 接收到 exec 连接请求，查询 pod 信息，并将 exec 请求代理到 leaf 集群。
  通过这个过程，Kosmos 实现了 exec 功能，log 功能的工作方式也是相同的。

### 定制化
在与 es 产品对接时，有一个定制化需求。
上述设计将导致所有 kosmos-node 的 IP 都是 _**clustertree-cluster-manager**_ 的 podIP。
在 es 的产品设计中，nodeIP 用作主键，这会导致产品无法存储到仓库中。为此，kosmos 进行了特殊设计。
在通过 kubectl get node -owide 获取的节点信息中，ip 地址属于 InternalIP 类型。
```shell
sudo kubectl get nodes -owide
NAME                STATUS   ROLES                          AGE     VERSION     INTERNAL-IP

     EXTERNAL-IP   OS-IMAGE                                        KERNEL-VERSION                                CONTAINER-RUNTIME
kosmos-control-1    Ready    control-plane,master,node      65d     v1.21.5     192.xx.xx.1     <none>        BigCloud Enterprise Linux For Euler 21.10 LTS   4.19.90-2107.6.0.0192.8.oe1.bclinux.x86_64    containerd://1.5.7
kosmos-control-2    Ready    node                           65d     v1.21.5     192.xx.xx.2     <none>        BigCloud Enterprise Linux For Euler 21.10 LTS   4.19.90-2107.6.0.0192.8.oe1.bclinux.x86_64    containerd://1.5.7
kosmos-cluster1     Ready    agent                          20d     v1.21.5     192.xx.xx.3     <none>
```

在查询节点主机时，上文提到的 GetPreferredNodeAddress 函数将根据优先级从 Address 列表中选择一个，因此在 es 中，我们将 _**clustertree-cluster-manager**_ 的 podIP 设置为比 InternalIP 类别地址更高的优先级，如下所示，可以指定 ip 的类型和值。
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

如何查看地址优先级？通过查看 api-server 的启动参数 - kubelet-preferred-address-types，此处设置了 GetPreferredNodeAddress 函数以获取主机的优先级。
默认情况下，InternalDNS 具有最高优先级。
```shell script
- --kubelet-preferred-address-types=InternalDNS,InternalIP,Hostname,ExternaLDNS,ExternalIP
```

### 结论
在 Kosmos 中，`kubectl exec` 和 `kubectl log` 都通过 API server 被“欺骗”并重定向到我们自己的 _**clustertree-cluster-manager**_ 服务。
这使得我们可以在后续步骤中实现定制化功能。