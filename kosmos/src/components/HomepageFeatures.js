import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';



function FeatureArrange() {
  return (
    <div className={clsx(styles.featureItemLeft)}>
      <div className={styles.featureDes}>
        <div className={styles.featureDesTitle}>Arrange(ClusterTree)</div>
        <div className={styles.featureDesInfo}>The Kosmos ClusterTree module extends Kubernetes clusters in a tree-like manner, achieving cross-cluster orchestration of applications.</div>
        <ul className={styles.featureDesDetails}>
          <li>
            <span>Fully compatible with k8s API: </span><span>Users can interact with the kube-apiserver of the host cluster as usual using tools like kubectl, client-go, etc. However, Pods are actually distributed across the entire multi-cloud, multi-cluster environment.</span>
          </li>
          <li>
            <span>Automated resource discovery: </span><span>Kosmos supports the orchestration of all Kubernetes native applications. For stateful applications, Kosmos will automatically detect storage and permission resources that Pods depend on, such as pv/pvc, sa, etc., and perform automated bi-directional synchronization.</span>
          </li>
          <li>
            <span>Diverse Pod topology constraints: </span><span>Users can easily control the distribution of Pods within the global cluster, for example, by region, availability zone, cluster, or node. This helps achieve high availability of applications and improve cluster resource utilization.</span>
          </li>
        </ul>
      </div>
      <div className={styles.featureArrangeImg}>
        <img src="img/arrange.png" alt="" className={styles.featureImg} />
      </div>
    </div>
  )
}

function FeatureDispatch() {
  return (
    <div className={clsx(styles.featureItemLeft, styles.featureItemRight)}>
      <div className={styles.featureDes}>
        <div className={styles.featureDesTitle}>Scheduler</div>
        <div className={styles.featureDesInfo}>The Kosmos scheduler module is developed as an extension of the Kubernetes scheduling framework and serves as a reliable solution for managing containerized applications more efficiently and flexibly in hybrid, multi-cloud, and multi-cluster environments.</div>
        <ul className={styles.featureDesDetails}>
          <li>
            <span>Flexible scheduling of nodes and clusters: </span><span>The Kosmos scheduler module allows users to intelligently schedule workloads between physical nodes and sub-clusters based on custom configurations. This enables users to fully utilize the resources of different nodes to ensure the best performance and availability of workloads. With this functionality, Kosmos enables flexible cross-cloud and cross-cluster deployment of workloads.</span>
          </li>
          <li>
            <span>Refined container distribution strategy: </span><span>By introducing Custom Resource Definitions (CRD), users can precisely control the topology distribution of workloads. The configuration of CRDs allows users to specify the number of pods of workloads in different clusters and adjust the distribution ratio according to needs.</span>
          </li>
          <li>
            <span>Granular fragment resource consolidation: </span><span>The Kosmos scheduler module can intelligently sense fragmentary resources in sub-clusters, effectively preventing situations where sub-cluster resources are insufficient after pods have been scheduled for deployment. This helps to ensure a more even distribution of workload resources across different nodes, improving the system's stability and performance.</span>
          </li>
        </ul>
      </div>
      <div className={styles.featureDispatchImg}>
        <img src="img/dispatch.png" alt="" className={styles.featureImg} />
      </div>
    </div>
  )
}

function FeatureNetwork() {
  return (
    <div className={clsx(styles.featureItemLeft)}>
      <div className={styles.featureDes}>
        <div className={styles.featureDesTitle}>Network(ClusterTree)</div>
        <div className={styles.featureDesInfo}>The goal of the Kosmos network is to establish connections between multiple Kubernetes clusters. This module can be deployed and used independently. It supports cross-cluster PodIP and ServiceIP communication, multi-mode support (P2P or Gateway), global IP allocation, and dual-stack IPv6/IPv4, among other features.</div>
        <ul className={styles.featureDesDetails}>
          <li>
            <span>Cross-cluster PodIP and ServiceIP communication:</span><span> Based on Linux vxlan tunnel technology, it makes L3 network connections across multiple Kubernetes clusters possible. This allows users to conduct Pod-to-Pod and Pod-to-Service communication within a global cluster scope.</span>
          </li>
          <li>
            <span>Multi-mode support:</span><span>When joining clusters, you can choose between P2P or Gateway mode. Choosing P2P mode is suitable for underlying network interconnection, offering shorter network paths and superior performance. When selecting Gateway mode, it provides excellent compatibility, making it very suitable for hybrid multi-cloud scenarios.</span>
          </li>
          <li>
            <span>Support for global IP allocation:</span><span>The Kosmos network allows two or more clusters within a global cluster to use the same Pod/Service subnet, facilitating subnet management for users. It supports configuring the mapping relationship between PodCIDR/ServiceCIDR and GlobalCIDR. GlobalIP is globally unique, and through GlobalIP, cross-cluster communication between services with conflicting network segments can be achieved.</span>
          </li>
        </ul>
      </div>
      <div className={styles.featureNetworkImg}>
        <img src="img/network.png" alt="" className={styles.featureImg} />
      </div>
    </div>
  )
}


export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className={styles.featuresContainer}>
        <div className={styles.featureTitle}>
          <div className={styles.featureText}>Core Features</div>
          <div className={styles.line}></div>
          <img src="img/title-bg.png" alt="" className={styles.titleBg} />
        </div>
        <FeatureArrange />
        <FeatureDispatch />
        <FeatureNetwork />
      </div>
    </section>
  );
}
