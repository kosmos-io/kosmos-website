import React from 'react';
import styles from './HomepageDescription.module.css';


function Feature() {
  return (
    <div className={styles.featuresText}>
      <div className={styles.leftInfo}>
        <img src="img/feature-info.svg" alt="" />
      </div>
      <div className={styles.rightInfo}>
        <div className={styles.featureTitle}>What is Kosmos？</div>
        <div className={styles.featuresDes}>
          <p>Kosmos is an open-source, integrated distributed cloud-native solution. The name "kosmos" is formed by combining the "k" representing Kubernetes with "cosmos" from Greek, symbolizing the infinite scalability of Kubernetes.</p>
          <p>Kosmos mainly consists of three major modules: ClusterLink, ClusterTree, and Scheduler. In addition, Kosmos is also equipped with a tool named kosmosctl, which can quickly deploy Kosmos components, add clusters, and test network connection.</p>
        </div>
      </div>
    </div>
  )
}

export default function HomepageFeatures() {
  return (
    <section>
      <div>
        <div className={styles.containerView}>
          <Feature />
        </div>
      </div>
    </section>
  );
}
