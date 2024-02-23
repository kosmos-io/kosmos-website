import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import HomepageDescription from '../components/HomepageDescription';
import HomepageFeatures from '../components/HomepageFeatures';
import GitHubButton from 'react-github-btn';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)} style={{ padding: '0px' }}>
      <div className={styles.container}>
        <div className={styles.headerLeft}>
          <h1 className={clsx('hero__title', styles.heroTitle)}>{siteConfig.title}</h1>
          <p className={clsx('hero__subtitle', styles.heroText)}>{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={`button button--secondary button--lg ${styles.button1}`}
              to="v0.2.0/quick-start" style={{ borderRadius: '25px' }}>
              Get Started
            </Link>
          </div>
          <div className={styles.star}>
            <GitHubButton
              href="https://github.com/kosmos-io/kosmos"
              data-icon="octicon-star"
              data-size="large"
              data-show-count="true"
            >
              Star
            </GitHubButton>
          </div>
          <div className={styles.headerDes}>
            <p className={styles.headerDesInfo}>If you like Kosmos, give it a star on GitHub!</p>
            <p>Kosmos v0.2.0-lts is now available.(2023-04-20) Read Release Note</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <img className={styles.topImg} src="img/top-img.svg" alt="" />
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout>
      <HomepageHeader />
      <main className={styles.mainContainer}>
        <HomepageDescription />
        <HomepageFeatures />
      </main>
    </Layout>
  )
}
