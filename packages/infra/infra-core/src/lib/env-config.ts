declare const process: {
  env: {
    MF_BASIC_AUTH: string;
    MF_DOMAIN_API: string;
    MF_DOMAIN_WEB_APP: string;
    MF_DOMAIN_CDN: string;
    MF_DOMAIN_DOCS: string;
    MF_DOMAIN_WWW: string;
    MF_DOMAIN_ADMIN_PANEL: string;
    MF_DOMAIN_FLOWER: string;
    MF_CLOUDFRONT_CERTIFICATE_ARN: string;
    MF_CERTIFICATE_DOMAIN: string;
    MF_LOAD_BALANCER_CERTIFICATE_ARN: string;
    MF_HOSTED_ZONE_ID: string;
    MF_HOSTED_ZONE_NAME: string;
    PROJECT_NAME: string;
    ENV_STAGE: string;
    VERSION: string;
    MF_TOOLS_ENABLED: string;
    MF_TOOLS_BASIC_AUTH: string;
    MF_TOOLS_HOSTED_ZONE_NAME: string;
    MF_TOOLS_HOSTED_ZONE_ID: string;
    MF_TOOLS_DOMAIN_VERSION_MATRIX: string;
    MF_CI_MODE: string;
  };
};

export interface EnvConfigHostedZone {
  id: string;
  name: string;
}

interface EnvConfigFileDomains {
  adminPanel: string;
  api: string;
  webApp: string;
  docs: string;
  www: string;
  cdn: string;
  flower: string;
}

interface ToolsDomains {
  versionMatrix: string | undefined;
}

export interface ToolsConfig {
  enabled: boolean;
  basicAuth: string | undefined;
  hostedZone: EnvConfigHostedZone;
  domains: ToolsDomains;
}

interface CertificatesConfig {
  cloudfrontCertificateArn: string;
  loadBalancerCertificateArn: string;
  domain: string;
}

interface EnvironmentVariables {
  [name: string]: string;
}

interface WebAppConfig {
  envVariables: EnvironmentVariables;
}

export enum CI_MODE {
  PARALLEL = 'parallel',
  SIMPLE = 'simple',
}

interface CIConfig {
  mode: CI_MODE;
}

export interface EnvironmentSettings {
  appBasicAuth: string | null | undefined;
  domains: EnvConfigFileDomains;
  envStage: string;
  hostedZone: EnvConfigHostedZone;
  projectName: string;
  projectEnvName: string;
  tools: ToolsConfig;
  version: string;
  webAppEnvVariables: EnvironmentVariables;
  certificates: CertificatesConfig;
  CIConfig: CIConfig;
}

interface ConfigFileContent {
  toolsConfig: ToolsConfig;
  webAppConfig: WebAppConfig;
  CIConfig: CIConfig;
}

export interface EnvConfigFileContent {
  hostedZone: EnvConfigHostedZone;
  basicAuth: string | null | undefined;
  domains: EnvConfigFileDomains;
  webAppConfig: WebAppConfig;
  certificates: CertificatesConfig;
}

async function readConfig(): Promise<ConfigFileContent> {
  return {
    webAppConfig: {
      envVariables: {},
    },
    toolsConfig: {
      enabled: process.env.MF_TOOLS_ENABLED === 'true',
      basicAuth: process.env.MF_TOOLS_BASIC_AUTH,
      hostedZone: {
        id: process.env.MF_TOOLS_HOSTED_ZONE_ID || '',
        name: process.env.MF_TOOLS_HOSTED_ZONE_NAME || '',
      },
      domains: {
        versionMatrix: process.env.MF_TOOLS_DOMAIN_VERSION_MATRIX,
      },
    },
    CIConfig: {
      mode:
        process.env.MF_CI_MODE === CI_MODE.SIMPLE
          ? CI_MODE.SIMPLE
          : CI_MODE.PARALLEL,
    },
  };
}

async function readEnvConfig(envStage: string): Promise<EnvConfigFileContent> {
  if (!process.env.MF_DOMAIN_API) {
    throw new Error('MF_DOMAIN_API env variable has to be defined');
  }

  const hostedZoneName = process.env.MF_HOSTED_ZONE_NAME ?? '';
  const certDomain = process.env.MF_CERTIFICATE_DOMAIN;
  const defaultDomain = certDomain ?? `${envStage}.${hostedZoneName}`;

  return {
    webAppConfig: {
      envVariables: {},
    },
    basicAuth: process.env.MF_BASIC_AUTH,
    domains: {
      api: process.env.MF_DOMAIN_API ?? `api.${defaultDomain}`,
      webApp: process.env.MF_DOMAIN_WEB_APP ?? `app.${defaultDomain}`,
      cdn: process.env.MF_DOMAIN_CDN ?? `cdn.${defaultDomain}`,
      docs: process.env.MF_DOMAIN_DOCS ?? `docs.${defaultDomain}`,
      www: process.env.MF_DOMAIN_WWW ?? `www.${defaultDomain}`,
      adminPanel: process.env.MF_DOMAIN_ADMIN_PANEL ?? `admin.${defaultDomain}`,
      flower: process.env.MF_DOMAIN_FLOWER ?? `flower.${defaultDomain}`,
    },
    certificates: {
      cloudfrontCertificateArn: process.env.MF_CLOUDFRONT_CERTIFICATE_ARN ?? '',
      domain: certDomain ?? '',
      loadBalancerCertificateArn:
        process.env.MF_LOAD_BALANCER_CERTIFICATE_ARN ?? '',
    },
    hostedZone: {
      id: process.env.MF_HOSTED_ZONE_ID ?? '',
      name: hostedZoneName,
    },
  };
}

export async function loadEnvSettings(): Promise<EnvironmentSettings> {
  const projectName = process.env.PROJECT_NAME;
  const envStage = process.env.ENV_STAGE;
  const version = process.env.VERSION;

  if (!envStage) {
    throw new Error('Environmental variable ENV_STAGE is undefined!');
  }

  if (!version) {
    throw new Error('Environmental variable VERSION is undefined!');
  }

  const config = await readConfig();
  const envConfig = await readEnvConfig(envStage);

  return {
    envStage,
    projectName,
    version,
    projectEnvName: `${projectName}-${envStage}`,
    tools: config.toolsConfig,
    appBasicAuth: envConfig.basicAuth,
    hostedZone: envConfig.hostedZone,
    domains: envConfig.domains,
    webAppEnvVariables: {
      ...(config?.webAppConfig?.envVariables || {}),
      ...(envConfig?.webAppConfig?.envVariables || {}),
    },
    certificates: envConfig.certificates,
    CIConfig: config.CIConfig,
  };
}
