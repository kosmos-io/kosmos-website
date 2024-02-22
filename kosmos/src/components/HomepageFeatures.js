import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: '编排ClusterTree',
    position: 'left',
    Svg: require('../../static/img/arrange.png').default,
    description: (
      <>
        文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签
      </>
    )
  },
  {
    title: '调度',
    position: 'right',
    Svg: require('../../static/img/dispatch.png').default,
    description: (
      <>
        文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签
      </>
    )
  },
  {
    title: '网络ClusterTree',
    position: 'left',
    Svg: require('../../static/img/network.png').default,
    description: (
      <>
        文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签
      </>
    )
  }
]

function Feature({ title, description, position, Svg }) {
  return (
    <div className={clsx(styles.featureItem, position === 'right' && styles.featureItemRight)}>
      <div className={styles.featureDes}>
        <div className={styles.featureDesTitle}>{title}</div>
        <div className={styles.featureDesInfo}>{description}</div>
      </div>
      <div className={styles.featureBackground}>
        <img src={Svg} alt={title} className={styles.featureImg} />
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className={styles.featuresContainer}>
        <div className={styles.featureTitle}>
          <div className={styles.featureText}>核心特性</div>
          <div className={styles.line}></div>
        </div>
        <div>
          <div>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
