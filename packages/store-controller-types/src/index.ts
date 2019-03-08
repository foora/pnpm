import {
  DirectoryResolution,
  LocalPackages,
  Resolution,
  WantedDependency,
} from '@pnpm/resolver-base'
import {
  PackageJson,
  PackageManifest,
} from '@pnpm/types'

export * from '@pnpm/resolver-base'

export interface StoreController {
  getPackageLocation (
    packageId: string,
    packageName: string,
    opts: {
      lockfileDirectory: string,
      targetEngine?: string,
    },
  ): Promise<{ directory: string, isBuilt: boolean }>,
  requestPackage: RequestPackageFunction,
  fetchPackage: FetchPackageToStoreFunction,
  importPackage: ImportPackageFunction,
  close (): Promise<void>,
  updateConnections (prefix: string, opts: {addDependencies: string[], removeDependencies: string[], prune: boolean}): Promise<void>,
  prune (): Promise<void>,
  saveState (): Promise<void>,
  upload (builtPkgLocation: string, opts: {packageId: string, engine: string}): Promise<void>,
  findPackageUsages (searchQueries: string[]): Promise<PackageUsagesBySearchQueries>,
}

export type PackageUsagesBySearchQueries = {
  [searchQuery: string]: PackageUsages[],
}

export type PackageUsages = {
  packageId: string,
  usages: string[], // paths to node projects
}

export type FetchPackageToStoreFunction = (
  opts: FetchPackageToStoreOptions,
) => {
  fetchingFiles: Promise<PackageFilesResponse>,
  fetchingRawManifest?: Promise<PackageJson>,
  finishing: Promise<void>,
  inStoreLocation: string,
}

export interface FetchPackageToStoreOptions {
  fetchRawManifest?: boolean,
  force: boolean,
  pkgName?: string,
  pkgId: string,
  prefix: string,
  resolution: Resolution,
}

export type ImportPackageFunction = (
  from: string,
  to: string,
  opts: {
    filesResponse: PackageFilesResponse,
    force: boolean,
  },
) => Promise<void>

export interface PackageFilesResponse {
  fromStore: boolean,
  filenames: string[],
}

export type RequestPackageFunction = (
  wantedDependency: WantedDependency,
  options: RequestPackageOptions,
) => Promise<PackageResponse>

export interface RequestPackageOptions {
  currentPackageId?: string,
  currentResolution?: Resolution,
  defaultTag?: string,
  downloadPriority: number,
  lockfileDirectory: string,
  localPackages?: LocalPackages,
  prefix: string,
  preferredVersions: {
    [packageName: string]: {
      selector: string,
      type: 'version' | 'range' | 'tag',
    },
  },
  registry: string,
  sideEffectsCache?: boolean,
  skipFetch?: boolean,
  update?: boolean,
}

export type PackageResponse = {
  body: {
    isLocal: true,
    resolution: DirectoryResolution,
    manifest: PackageManifest
    id: string,
    normalizedPref?: string,
    updated: boolean,
    resolvedVia?: string,
  },
} | (
  {
    fetchingFiles?: Promise<PackageFilesResponse>,
    finishing?: Promise<void>, // a package request is finished once its integrity is generated and saved
    body: {
      isLocal: false,
      inStoreLocation: string,
      cacheByEngine: Map<string, string>,
      id: string,
      resolution: Resolution,
      // This is useful for recommending updates.
      // If latest does not equal the version of the
      // resolved package, it is out-of-date.
      latest?: string,
      normalizedPref?: string,
      updated: boolean,
      resolvedVia?: string,
    },
  } & (
    {
      fetchingRawManifest: Promise<PackageJson>,
    } | {
      body: {
        manifest: PackageManifest,
        updated: boolean,
      },
    }
  )
)
