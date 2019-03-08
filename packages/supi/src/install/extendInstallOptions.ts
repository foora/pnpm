import { WANTED_LOCKFILE } from '@pnpm/constants'
import { Lockfile } from '@pnpm/lockfile-file'
import { IncludedDependencies } from '@pnpm/modules-yaml'
import { LocalPackages } from '@pnpm/resolver-base'
import { StoreController } from '@pnpm/store-controller-types'
import {
  ReadPackageHook,
  Registries,
} from '@pnpm/types'
import { DEFAULT_REGISTRIES, normalizeRegistries } from '@pnpm/utils'
import path = require('path')
import pnpmPkgJson from '../pnpmPkgJson'
import { ReporterFunction } from '../types'

export interface BaseInstallOptions {
  forceSharedLockfile?: boolean,
  frozenLockfile?: boolean,
  lockfile?: boolean,
  lockfileOnly?: boolean,
  preferFrozenLockfile?: boolean,
  shamefullyFlatten?: boolean,
  storeController: StoreController,
  store: string,
  reporter?: ReporterFunction,
  force?: boolean,
  update?: boolean,
  depth?: number,
  repeatInstallDepth?: number,
  lockfileDirectory?: string,
  rawNpmConfig?: object,
  verifyStoreIntegrity?: boolean,
  engineStrict?: boolean,
  nodeVersion?: string,
  packageManager?: {
    name: string,
    version: string,
  },
  pruneLockfileImporters?: boolean,
  hooks?: {
    readPackage?: ReadPackageHook,
    afterAllResolved?: (lockfile: Lockfile) => Lockfile,
  },
  sideEffectsCacheRead?: boolean,
  sideEffectsCacheWrite?: boolean,
  strictPeerDependencies?: boolean,
  include?: IncludedDependencies,
  independentLeaves?: boolean,
  ignoreCurrentPrefs?: boolean,
  ignoreScripts?: boolean,
  childConcurrency?: number,
  userAgent?: string,
  unsafePerm?: boolean,
  registries?: Registries,
  lock?: boolean,
  lockStaleDuration?: number,
  tag?: string,
  locks?: string,
  ownLifecycleHooksStdio?: 'inherit' | 'pipe',
  localPackages?: LocalPackages,
  pruneStore?: boolean,
}

export type InstallOptions = BaseInstallOptions & {
  bin?: string,
  prefix?: string,
}

export type StrictInstallOptions = BaseInstallOptions & {
  forceSharedLockfile: boolean,
  frozenLockfile: boolean,
  preferFrozenLockfile: boolean,
  shamefullyFlatten: boolean,
  lockfile: boolean,
  lockfileDirectory: string,
  lockfileOnly: boolean,
  force: boolean,
  update: boolean,
  depth: number,
  repeatInstallDepth: number,
  engineStrict: boolean,
  nodeVersion: string,
  rawNpmConfig: object,
  packageManager: {
    name: string,
    version: string,
  },
  pruneLockfileImporters: boolean,
  hooks: {
    readPackage?: ReadPackageHook,
  },
  sideEffectsCacheRead: boolean,
  sideEffectsCacheWrite: boolean,
  strictPeerDependencies: boolean,
  include: IncludedDependencies,
  independentLeaves: boolean,
  ignoreCurrentPrefs: boolean,
  ignoreScripts: boolean,
  childConcurrency: number,
  userAgent: string,
  lock: boolean,
  registries: Registries,
  lockStaleDuration: number,
  tag: string,
  locks: string,
  unsafePerm: boolean,
  ownLifecycleHooksStdio: 'inherit' | 'pipe',
  localPackages: LocalPackages,
  pruneStore: boolean,
}

const defaults = async (opts: InstallOptions) => {
  const packageManager = opts.packageManager || {
    name: pnpmPkgJson.name,
    version: pnpmPkgJson.version,
  }
  return {
    childConcurrency: 5,
    depth: 0,
    engineStrict: false,
    force: false,
    forceSharedLockfile: false,
    frozenLockfile: false,
    hooks: {},
    ignoreCurrentPrefs: false,
    ignoreScripts: false,
    include: {
      dependencies: true,
      devDependencies: true,
      optionalDependencies: true,
    },
    independentLeaves: false,
    localPackages: {},
    lock: true,
    lockfile: true,
    lockfileDirectory: opts.lockfileDirectory || opts.prefix || process.cwd(),
    lockfileOnly: false,
    locks: path.join(opts.store, '_locks'),
    lockStaleDuration: 5 * 60 * 1000, // 5 minutes
    nodeVersion: process.version,
    ownLifecycleHooksStdio: 'inherit',
    packageManager,
    preferFrozenLockfile: true,
    pruneLockfileImporters: false,
    pruneStore: false,
    rawNpmConfig: {},
    registries: DEFAULT_REGISTRIES,
    repeatInstallDepth: -1,
    shamefullyFlatten: false,
    sideEffectsCacheRead: false,
    sideEffectsCacheWrite: false,
    store: opts.store,
    storeController: opts.storeController,
    strictPeerDependencies: false,
    tag: 'latest',
    unsafePerm: process.platform === 'win32' ||
      process.platform === 'cygwin' ||
      !(process.getuid && process.setuid &&
        process.getgid && process.setgid) ||
      process.getuid() !== 0,
    update: false,
    userAgent: `${packageManager.name}/${packageManager.version} npm/? node/${process.version} ${process.platform} ${process.arch}`,
    verifyStoreIntegrity: true,
  } as StrictInstallOptions
}

export default async (
  opts: InstallOptions,
): Promise<StrictInstallOptions> => {
  if (opts) {
    for (const key in opts) {
      if (opts[key] === undefined) {
        delete opts[key]
      }
    }
  }
  const defaultOpts = await defaults(opts)
  const extendedOpts = {
    ...defaultOpts,
    ...opts,
    store: defaultOpts.store,
  }
  if (!extendedOpts.lockfile && extendedOpts.lockfileOnly) {
    throw new Error(`Cannot generate a ${WANTED_LOCKFILE} because lockfile is set to false`)
  }
  if (extendedOpts.userAgent.startsWith('npm/')) {
    extendedOpts.userAgent = `${extendedOpts.packageManager.name}/${extendedOpts.packageManager.version} ${extendedOpts.userAgent}`
  }
  extendedOpts.registries = normalizeRegistries(extendedOpts.registries)
  extendedOpts.rawNpmConfig['registry'] = extendedOpts.registries.default // tslint:disable-line:no-string-literal
  return extendedOpts
}
