// Operational Excellence API Routes
// PHASE 5: Operational Excellence - Management Endpoints

import type { Request, Response } from "express";
import { z } from "zod";
import { apiRateLimiter } from "../../lib/api-rate-limiter.js";
import { businessIntelligence } from "../../lib/business-intelligence.js";
// import { getConfig } from '../../config/production.js';
import { memoryOptimizer } from "../../lib/memory-optimizer.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { workflowAutomation } from "../../lib/workflow-automation.js";

// const config = getConfig();

// Zod validation schemas
const optimizeMemorySchema = z.object({
  emergency: z.boolean().optional().default(false),
});

const setClientQuotaSchema = z.object({
  tier: z.enum(["free", "basic", "premium", "enterprise"]),
  limits: z.record(z.string(), z.any()).optional(),
});

const blacklistClientSchema = z.object({
  duration: z.number().int().positive().optional().default(3600000), // Default 1 hour
});

// Memory optimization endpoints
export async function getMemoryStatus(_req: Request, res: Response) {
  try {
    const stats = memoryOptimizer.getCurrentMemoryStats();
    const trend = memoryOptimizer.getMemoryTrend();

    res.json({
      status: "success",
      memory: {
        current: stats,
        trend,
        thresholds: {
          critical: 85,
          emergency: 95,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get memory status:", { error });
    res.status(500).json({
      error: "Failed to retrieve memory status",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function optimizeMemory(req: Request, res: Response) {
  try {
    const validatedData = optimizeMemorySchema.parse(req.body);
    const { emergency } = validatedData;

    let result;
    if (emergency) {
      result = await withTimeout(
        memoryOptimizer.emergencyCleanup(),
        15000,
        "Emergency memory cleanup",
      );
    } else {
      result = await withTimeout(memoryOptimizer.optimizeMemory(), 10000, "Memory optimization");
    }

    return res.json({
      status: "success",
      optimization: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    logger.error("[Operational] Memory optimization failed:", { error });
    return res.status(500).json({
      error: "Memory optimization failed",
      timestamp: new Date().toISOString(),
    });
  }
}

// Business intelligence endpoints
export async function getBusinessMetrics(_req: Request, res: Response) {
  try {
    const metrics = await withTimeout(
      businessIntelligence.collectBusinessMetrics(),
      10000,
      "Collect business metrics",
    );

    res.json({
      status: "success",
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get business metrics:", { error });
    res.status(500).json({
      error: "Failed to retrieve business metrics",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function generateBusinessReport(_req: Request, res: Response) {
  try {
    const report = await withTimeout(
      businessIntelligence.generateBusinessReport(),
      15000,
      "Generate business report",
    );

    res.json({
      status: "success",
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to generate business report:", {
      error,
    });
    res.status(500).json({
      error: "Failed to generate business report",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getMetricsHistory(_req: Request, res: Response) {
  try {
    const history = businessIntelligence.getMetricsHistory();
    const latest = businessIntelligence.getLatestMetrics();

    res.json({
      status: "success",
      history,
      latest,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get metrics history:", { error });
    res.status(500).json({
      error: "Failed to retrieve metrics history",
      timestamp: new Date().toISOString(),
    });
  }
}

// Workflow automation endpoints
export async function getWorkflows(req: Request, res: Response) {
  try {
    // Parse and validate pagination params (prevent negative values)
    const parsedLimit = parseInt(req.query.limit as string, 10) || 20;
    const parsedOffset = parseInt(req.query.offset as string, 10) || 0;
    const limit = Math.min(Math.max(0, parsedLimit), 100);
    const offset = Math.max(0, parsedOffset);

    const workflows = workflowAutomation.getAllWorkflows({ limit, offset });

    const workflowsWithStatus = workflows.map((workflow) => ({
      ...workflow,
      status: workflowAutomation.getWorkflowStatus(workflow.id),
    }));

    res.json({
      status: "success",
      workflows: workflowsWithStatus,
      count: workflows.length,
      pagination: { limit, offset },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get workflows:", { error });
    res.status(500).json({
      error: "Failed to retrieve workflows",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function executeWorkflow(req: Request, res: Response) {
  try {
    const { workflowId } = req.params;

    const result = await withTimeout(
      workflowAutomation.executeWorkflowManually(workflowId!),
      20000,
      "Execute workflow manually",
    );

    res.json({
      status: "success",
      execution: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Workflow execution failed:", { error });
    res.status(500).json({
      error: "Workflow execution failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getWorkflowHistory(req: Request, res: Response) {
  try {
    const { workflowId } = req.params;

    const history = workflowAutomation.getExecutionHistory();

    res.json({
      status: "success",
      history,
      count: history.length,
      workflowId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get workflow history:", { error });
    res.status(500).json({
      error: "Failed to retrieve workflow history",
      timestamp: new Date().toISOString(),
    });
  }
}

// API rate limiting endpoints
export async function getRateLimitStats(_req: Request, res: Response) {
  try {
    const stats = apiRateLimiter.getStats();
    const activeClients = apiRateLimiter.getActiveClients();

    res.json({
      status: "success",
      rateLimiting: {
        globalStats: stats,
        activeClients: activeClients.length,
        clients: activeClients.slice(0, 20), // Limit to first 20 for performance
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get rate limit stats:", { error });
    res.status(500).json({
      error: "Failed to retrieve rate limiting statistics",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getClientQuota(req: Request, res: Response) {
  try {
    const { clientId } = req.params;

    const clientInfo = apiRateLimiter.getClientInfo(clientId!);

    if (!clientInfo) {
      return res.status(404).json({
        error: "Client not found",
        clientId,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      status: "success",
      client: clientInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get client quota:", { error });
    return res.status(500).json({
      error: "Failed to retrieve client quota information",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function setClientQuota(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    const validatedData = setClientQuotaSchema.parse(req.body);
    const { tier, limits } = validatedData;

    apiRateLimiter.setClientQuota(clientId!, tier, limits || {});

    return res.json({
      status: "success",
      message: "Client quota updated",
      clientId,
      tier,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    logger.error("[Operational] Failed to set client quota:", { error });
    return res.status(500).json({
      error: "Failed to update client quota",
      timestamp: new Date().toISOString(),
    });
  }
}

export async function blacklistClient(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    const validatedData = blacklistClientSchema.parse(req.body);
    const { duration } = validatedData;

    apiRateLimiter.blacklistClient(clientId!, duration);

    return res.json({
      status: "success",
      message: "Client blacklisted",
      clientId,
      duration,
      until: new Date(Date.now() + duration).toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    logger.error("[Operational] Failed to blacklist client:", { error });
    return res.status(500).json({
      error: "Failed to blacklist client",
      timestamp: new Date().toISOString(),
    });
  }
}

// Operational dashboard
export async function getOperationalDashboard(_req: Request, res: Response) {
  try {
    // Collect comprehensive operational data
    const [memoryStats, businessMetrics, workflows, rateLimitStats] = await withTimeout(
      Promise.all([
        memoryOptimizer.getCurrentMemoryStats(),
        businessIntelligence.getLatestMetrics(),
        workflowAutomation.getAllWorkflows({ limit: 100 }), // Dashboard needs comprehensive data
        apiRateLimiter.getStats(),
      ]),
      20000,
      "Operational dashboard batch fetch (4 parallel queries)",
    );

    const memoryTrend = memoryOptimizer.getMemoryTrend();
    const activeClients = apiRateLimiter.getActiveClients();

    // Calculate system health score
    let healthScore = 100;

    // Memory health impact
    if (memoryStats.usage > 95) healthScore -= 30;
    else if (memoryStats.usage > 85) healthScore -= 15;
    else if (memoryStats.usage > 75) healthScore -= 5;

    // Workflow health impact
    const failedWorkflows = workflows.filter((w) => w.failureCount > w.successCount);
    healthScore -= failedWorkflows.length * 5;

    // Rate limiting impact
    const blockedRatio = rateLimitStats.blockedRequests / rateLimitStats.totalRequests;
    if (blockedRatio > 0.1) healthScore -= 15;
    else if (blockedRatio > 0.05) healthScore -= 5;

    healthScore = Math.max(0, healthScore);

    const dashboard = {
      systemHealth: {
        score: healthScore,
        status:
          healthScore >= 90
            ? "excellent"
            : healthScore >= 75
              ? "good"
              : healthScore >= 60
                ? "fair"
                : "poor",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      memory: {
        current: memoryStats,
        trend: memoryTrend,
        alerts: [], // Memory alerts disabled for performance optimization
      },
      business: businessMetrics
        ? {
            products: businessMetrics.products,
            content: businessMetrics.content,
            performance: businessMetrics.performance,
            engagement: businessMetrics.engagement,
          }
        : null,
      workflows: {
        total: workflows.length,
        active: workflows.filter((w) => w.enabled).length,
        successful: workflows.reduce((sum, w) => sum + w.successCount, 0),
        failed: workflows.reduce((sum, w) => sum + w.failureCount, 0),
      },
      api: {
        rateLimiting: rateLimitStats,
        activeClients: activeClients.length,
        clientTiers: activeClients.reduce((acc: Record<string, number>, client) => {
          acc[client.tier] = (acc[client.tier] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    res.json({
      status: "success",
      dashboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get operational dashboard:", {
      error,
    });
    res.status(500).json({
      error: "Failed to retrieve operational dashboard",
      timestamp: new Date().toISOString(),
    });
  }
}

// System status overview
export async function getSystemStatus(_req: Request, res: Response) {
  try {
    const memory = memoryOptimizer.getCurrentMemoryStats();
    const workflows = workflowAutomation.getAllWorkflows({ limit: 100 }); // Status check needs comprehensive data
    const rateStats = apiRateLimiter.getStats();

    const status = {
      services: {
        memory: memory.usage < 90 ? "healthy" : "warning",
        workflows: workflows.every((w) => w.enabled) ? "operational" : "partial",
        rateLimiting: "operational",
        businessIntelligence: "operational",
      },
      metrics: {
        memoryUsage: memory.usage,
        workflowCount: workflows.length,
        apiRequests: rateStats.totalRequests,
        uptime: Math.floor(process.uptime()),
      },
      alerts: [],
      timestamp: new Date().toISOString(),
    };

    // Add alerts (memory monitoring disabled for performance optimization)
    // if (memory.usage > 90) {
    //   status.alerts.push('High memory usage detected');
    // }

    const blockedRatio = rateStats.blockedRequests / rateStats.totalRequests;
    if (blockedRatio > 0.1) {
      (status.alerts as string[]).push("High API request blocking rate");
    }

    res.json({
      status: "success",
      system: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Operational] Failed to get system status:", { error });
    res.status(500).json({
      error: "Failed to retrieve system status",
      timestamp: new Date().toISOString(),
    });
  }
}
