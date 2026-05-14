/**
 * ORACLE V5 - Failure Analyzer Module
 * 
 * Analyzes execution history from agent-room/state.json
 * Computes reliability scores and detects failure patterns
 * Generates analytics for adaptive tool routing
 */

const fs = require('fs').promises;
const path = require('path');

class FailureAnalyzer {
  constructor(stateFilePath = './agent-room/state.json') {
    this.stateFilePath = stateFilePath;
    this.analytics = {
      tools: new Map(),
      clusters: [],
      lastAnalysis: null
    };
  }

  /**
   * Load and analyze execution history
   */
  async analyze() {
    try {
      const stateData = await this.loadStateData();
      const executions = this.extractExecutions(stateData);
      
      this.analyzeToolReliability(executions);
      this.detectFailureClusters(executions);
      
      this.analytics.lastAnalysis = new Date().toISOString();
      
      await this.saveAnalytics();
      return this.getAnalyticsReport();
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Load state.json with error handling
   */
  async loadStateData() {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn('State file not found, starting fresh');
        return { executions: [] };
      }
      throw error;
    }
  }

  /**
   * Extract execution records from state data
   */
  extractExecutions(stateData) {
    if (!stateData.executions && !Array.isArray(stateData)) {
      return [];
    }
    
    // Handle both array format and object with executions property
    const executions = stateData.executions || stateData;
    
    return Array.isArray(executions) ? executions : [];
  }

  /**
   * Analyze tool reliability with success rates
   */
  analyzeToolReliability(executions) {
    const toolStats = new Map();
    
    executions.forEach(execution => {
      const tool = execution.toolUsed || execution.tool || 'unknown';
      const status = execution.status || 'unknown';
      const timestamp = execution.timestamp || Date.now();
      
      if (!toolStats.has(tool)) {
        toolStats.set(tool, {
          tool,
          successes: 0,
          failures: 0,
          total: 0,
          recentExecutions: [],
          lastFailure: null,
          lastSuccess: null
        });
      }
      
      const stats = toolStats.get(tool);
      stats.total++;
      stats.recentExecutions.push({ status, timestamp, taskId: execution.taskId });
      
      if (status === 'success') {
        stats.successes++;
        stats.lastSuccess = timestamp;
      } else if (status === 'failed' || status === 'error') {
        stats.failures++;
        stats.lastFailure = timestamp;
      }
    });
    
    // Calculate derived metrics
    toolStats.forEach((stats, tool) => {
      stats.successRate = stats.total > 0 ? stats.successes / stats.total : 0;
      stats.recentTrend = this.calculateRecentTrend(stats.recentExecutions);
      
      // Keep only last 20 executions for trend analysis
      stats.recentExecutions = stats.recentExecutions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
      
      this.analytics.tools.set(tool, stats);
    });
  }

  /**
   * Calculate recent trend from execution history
   */
  calculateRecentTrend(executions) {
    if (executions.length < 3) return 'insufficient_data';
    
    const recent = executions.slice(-10); // Last 10 executions
    const successes = recent.filter(e => e.status === 'success').length;
    const failures = recent.filter(e => e.status === 'failed' || e.status === 'error').length;
    
    const successRate = successes / (successes + failures);
    
    if (successRate >= 0.8) return 'stable';
    if (successRate >= 0.6) return 'declining';
    if (successRate >= 0.4) return 'unstable';
    return 'critical';
  }

  /**
   * Detect failure clusters and patterns
   */
  detectFailureClusters(executions) {
    const clusters = new Map();
    const recentWindow = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    // Group failures by tool and error pattern
    executions
      .filter(e => e.timestamp > recentWindow && (e.status === 'failed' || e.status === 'error'))
      .forEach(execution => {
        const tool = execution.toolUsed || execution.tool || 'unknown';
        const errorType = this.categorizeError(execution);
        const clusterKey = `${tool}_${errorType}`;
        
        if (!clusters.has(clusterKey)) {
          clusters.set(clusterKey, {
            cluster: clusterKey,
            tool,
            errorType,
            count: 0,
            executions: [],
            severity: 'low'
          });
        }
        
        const cluster = clusters.get(clusterKey);
        cluster.count++;
        cluster.executions.push(execution);
      });
    
    // Determine severity and recommendations
    clusters.forEach(cluster => {
      if (cluster.count >= 5) {
        cluster.severity = 'high';
        cluster.recommendedAction = this.getRecommendation(cluster);
      } else if (cluster.count >= 3) {
        cluster.severity = 'medium';
        cluster.recommendedAction = 'monitor closely';
      } else {
        cluster.severity = 'low';
        cluster.recommendedAction = 'continue normal operation';
      }
    });
    
    this.analytics.clusters = Array.from(clusters.values());
  }

  /**
   * Categorize error types for clustering
   */
  categorizeError(execution) {
    const error = execution.error || execution.errorMessage || '';
    const message = error.toLowerCase();
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('connection') || message.includes('network')) return 'network';
    if (message.includes('auth') || message.includes('permission')) return 'auth';
    if (message.includes('rate') || message.includes('limit')) return 'rate_limit';
    if (message.includes('api')) return 'api_error';
    
    return 'unknown';
  }

  /**
   * Get recommendation based on cluster analysis
   */
  getRecommendation(cluster) {
    const { tool, errorType, count } = cluster;
    
    if (errorType === 'timeout') {
      return `downgrade ${tool} priority - repeated timeouts detected`;
    }
    if (errorType === 'network') {
      return `check ${tool} connectivity and retry policy`;
    }
    if (errorType === 'auth') {
      return `refresh ${tool} authentication credentials`;
    }
    if (errorType === 'rate_limit') {
      return `implement backoff strategy for ${tool}`;
    }
    
    return `investigate ${tool} ${errorType} failures (${count} occurrences)`;
  }

  /**
   * Get tool reliability score with confidence
   */
  getToolReliability(toolName) {
    const stats = this.analytics.tools.get(toolName);
    if (!stats) {
      return { reliability: 0.5, confidence: 0, reason: 'no_data' };
    }
    
    const { successRate, total, recentTrend } = stats;
    const confidence = Math.min(total / 10, 1); // Full confidence at 10+ executions
    
    // Adjust reliability based on trend
    let adjustedReliability = successRate;
    if (recentTrend === 'critical') adjustedReliability *= 0.5;
    else if (recentTrend === 'unstable') adjustedReliability *= 0.7;
    else if (recentTrend === 'declining') adjustedReliability *= 0.85;
    
    return {
      reliability: Math.max(0, Math.min(1, adjustedReliability)),
      confidence,
      successRate,
      total,
      trend: recentTrend
    };
  }

  /**
   * Save analytics to file
   */
  async saveAnalytics() {
    const analyticsPath = './agent-room/analytics';
    
    try {
      await fs.mkdir(analyticsPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    const report = this.getAnalyticsReport();
    await fs.writeFile(
      path.join(analyticsPath, 'failure-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  /**
   * Generate comprehensive analytics report
   */
  getAnalyticsReport() {
    return {
      timestamp: this.analytics.lastAnalysis,
      summary: {
        totalTools: this.analytics.tools.size,
        totalClusters: this.analytics.clusters.length,
        highSeverityClusters: this.analytics.clusters.filter(c => c.severity === 'high').length
      },
      tools: Array.from(this.analytics.tools.entries()).map(([tool, stats]) => ({
        tool,
        successRate: parseFloat(stats.successRate.toFixed(3)),
        failures: stats.failures,
        successes: stats.successes,
        total: stats.total,
        recentTrend: stats.recentTrend,
        lastSuccess: stats.lastSuccess,
        lastFailure: stats.lastFailure
      })),
      clusters: this.analytics.clusters,
      recommendations: this.analytics.clusters
        .filter(c => c.severity !== 'low')
        .map(c => c.recommendedAction)
    };
  }
}

module.exports = FailureAnalyzer;