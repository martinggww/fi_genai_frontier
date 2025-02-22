import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ProjectName = () => {
  const {
    siteConfig: {
      customFields: { projectName = 'Market Frontier' },
    },
  } = useDocusaurusContext();

  return projectName;
};

export default ProjectName;
