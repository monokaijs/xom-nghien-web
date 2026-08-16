export type ValheimConfigTarget = 'server' | 'client' | 'both';

export interface ValheimManifestPackage {
  coordinate: string;
  namespace: string;
  packageName: string;
  versionNumber: string;
  downloadUrl: string;
  fileSize?: number | null;
  dependencies: string[];
}

export interface ValheimPublishedConfig {
  path: string;
  sha256: string;
  contentBase64: string;
  target: ValheimConfigTarget;
}

export interface ValheimManifest {
  schemaVersion: 2;
  manifestId: string;
  revision: string;
  clientRevision: string;
  generatedAt: string;
  packages: ValheimManifestPackage[];
  configs: ValheimPublishedConfig[];
}
