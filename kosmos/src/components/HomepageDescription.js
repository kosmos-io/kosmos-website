import React from 'react';
import clsx from 'clsx';
import styles from './HomepageDescription.module.css';

const FeatureList = [
  {
    title: 'Kosmos是什么？',
    description: (
      <>
        文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签文本标签
      </>
    ),
  }
];

function Feature({ title, description }) {
  return (
    <div className={styles.featuresText}>
      <div className={styles.leftInfo}>
        <img src="img/feature-info.svg" alt="" />
      </div>
      <div className={styles.rigthInfo}>
        <div className={styles.featureTitle}>{title}</div>
        <p className={styles.featuresDes}>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures() {
  return (
    <section>
      <div>
        <div className={styles.containerView}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
