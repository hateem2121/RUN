/**
 * Neon Infrastructure as Code (neon.ts)
 * Declares services and branch-level policies for the RUN APPAREL monorepo.
 */

export interface NeonBranchTarget {
  name: string;
  exists?: boolean;
  isDefault?: boolean;
  parentId?: string;
}

export interface NeonBranchConfig {
  parent?: string;
  ttl?: string;
  protected?: boolean;
  postgres?: {
    computeSettings?: {
      autoscalingLimitMinCu?: number;
      autoscalingLimitMaxCu?: number;
      suspendTimeout?: string;
    };
  };
}

export interface NeonProjectConfig {
  auth?: boolean;
  dataApi?: boolean;
  branch?: (branch: NeonBranchTarget) => NeonBranchConfig;
}

export function defineConfig(config: NeonProjectConfig): NeonProjectConfig {
  return config;
}

export default defineConfig({
  auth: true,
  dataApi: true,
  branch: (branch: NeonBranchTarget): NeonBranchConfig => {
    // 1. Primary canonical branch ('main' / default) is always protected
    if (branch.isDefault || branch.name === "main") {
      return { protected: true };
    }

    // 2. Ephemeral preview/dev branches auto-expire in 24h with scale-to-zero compute
    if (!branch.exists && (branch.name.startsWith("preview/") || branch.name.startsWith("dev-"))) {
      return {
        parent: "main",
        ttl: "24h",
        postgres: {
          computeSettings: {
            autoscalingLimitMinCu: 0.25,
            autoscalingLimitMaxCu: 1,
            suspendTimeout: "5m",
          },
        },
      };
    }

    return {};
  },
});
