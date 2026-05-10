import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import ArticleList from '@/components/ArticleList';
import WorkflowDiagram from '@/components/WorkflowDiagram';
import ProgramArchitecture from '@/components/ProgramArchitecture';
import { seedDemoArticles } from '@/lib/seedArticles';

const Index: React.FC = () => {
  useEffect(() => {
    seedDemoArticles();
  }, []);

  return (
    <Layout>
      <HeroSection />
      <ArticleList />
      <WorkflowDiagram />
      <ProgramArchitecture />
    </Layout>
  );
};

export default Index;
