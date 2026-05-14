/**
 * ORACLE V5 - Adaptive Tool Router
 * 
 * Enhanced router with failure intelligence and predictive tool selection
 * Uses analytics data to prioritize tools based on reliability scores
 * Implements safety rules and fallback mechanisms
 */

const fs = require('fs').promises;
const path = require('path');
const FailureAnalyzer = require('../analytics/failure-analyzer');

class AdaptiveRouter {
  constructor(options = {}) {
    this.fallbackTimeout = options.fallbackTimeout || 30000; // 30 seconds
    this.minReliabilityThreshold = options.minReliabilityThreshold || 0.3;
    this.maxRetries = options.maxRetries || 3;
    
    this.analyzer = new FailureAnalyzer();
    this.routingLog = [];
    this.toolPriorities = new Map();
    
    // Default tool configurations
    this.tools = {
      github: {
        name: 'github',
        type: 'code',
        capabilities: ['repository', 'issues', 'pull_requests', 'files'],
        baseReliability: 0.85
      },
      supabase: {
        name: 'supabase',
        type: 'database',
        capabilities: ['storage', 'realtime', 'auth', 'edge_functions'],
        baseReliability: 0.80
      },
      browser: {
        name: 'browser',
        type: 'web',
        capabilities: ['scraping', 'automation', 'screenshots'],
        baseReliability: 0.70
      },
      fallback: {
        name: 'fallback',
        type: 'local',
        capabilities: ['execution', 'filesystem', 'basic_operations'],
        baseReliability: 0.90
      }
    };
  }

  /**
   * Route task to best available tool with predictive scoring
   */
  async route(task, options = {}) {
    const taskId = this.generateTaskId();
    const routingDecision = {
      taskId,
      task: task.type || task.description,
      timestamp: Date.now(),
      selectedTool: null,
      rejectedTools: [],
      confidence: 0,
      reasoning: [],
      fallbackUsed: false
    };

    try {
      // Update analytics before routing
      await this.updateAnalytics();
      
      // Get candidate tools for this task
      const candidates = this.getCandidateTools(task);
      
      if (candidates.length === 0) {
        return this.handleNoToolsAvailable(task, routingDecision);
      }
      
      // Score and rank tools
      const scoredTools = await this.scoreTools(candidates, task);
      
      // Select best tool
      const selectedTool = this.selectBestTool(scoredTools, routingDecision);
      
      // Log routing decision
      await this.logRoutingDecision(routingDecision);
      
      return {
        tool: selectedTool,
        confidence: routingDecision.confidence,
        reasoning: routingDecision.reasoning,
        taskId
      };
      
    } catch (error) {
      console.error('Routing failed:', error);
      return this.handleRoutingError(error, routingDecision);
    }
  }

  /**
   * Update analytics data
   */
  async updateAnalytics() {
    try {
      await this.analyzer.analyze();
    } catch (error) {
      console.warn('Analytics update failed, using cached data:', error.message);
    }
  }

  /**
   * Get candidate tools based on task requirements
   */
  getCandidateTools(task) {
    const taskType = task.type || 'general';
    const requirements = task.requirements || [];
    
    const candidates = [];
    
    // Match tools by type and capabilities
    Object.values(this.tools).forEach(tool => {
      if (this.isToolSuitable(tool, taskType, requirements)) {
        candidates.push(tool);
      }
    });
    
    // Always include fallback as last resort
    if (!candidates.find(t => t.name === 'fallback')) {
      candidates.push(this.tools.fallback);
    }
    
    return candidates;
  }

  /**
   * Check if tool is suitable for task
   */
  isToolSuitable(tool, taskType, requirements) {
    // Type-based matching
    const typeMatches = {
      'github': ['code', 'repository', 'git', 'version_control'],
      'supabase': ['database', 'storage', 'backend', 'api'],
      'browser': ['web', 'scraping', 'automation', 'ui'],
      'fallback': ['general', 'local', 'basic']
    };
    
    const matchedTypes = typeMatches[tool.name] || [];
    const typeMatch = matchedTypes.includes(taskType) || taskType === 'general';
    
    // Capability-based matching
    const capabilityMatch = requirements.length === 0 || 
      requirements.some(req => tool.capabilities.includes(req));
    
    return typeMatch && capabilityMatch;
  }

  /**
   * Score tools based on reliability and task fit
   */
  async scoreTools(candidates, task) {
    const scoredTools = [];
    
    for (const tool of candidates) {
      const score = await this.calculateToolScore(tool, task);
      scoredTools.push({ tool, score });
    }
    
    // Sort by score descending
    return scoredTools.sort((a, b) => b.score.total - a.score.total);
  }

  /**
   * Calculate comprehensive tool score
   */
  async calculateToolScore(tool, task) {
    const reliability = this.analyzer.getToolReliability(tool.name);
    const urgency = task.urgent ? 1.2 : 1.0;
    const complexity = this.getComplexityFactor(task);
    
    // Base reliability score (0-1)
    const reliabilityScore = reliability.reliability || tool.baseReliability;
    
    // Confidence factor based on historical data
    const confidenceFactor = Math.max(0.5, reliability.confidence || 0.5);
    
    // Recent performance trend
    const trendFactor = this.getTrendFactor(reliability.trend);
    
    // Task fit score
    const fitScore = this.calculateTaskFit(tool, task);
    
    // Combined score
    const total = (
      reliabilityScore * 0.4 +
      fitScore * 0.3 +
      confidenceFactor * 0.2 +
      trendFactor * 0.1
    ) * urgency * complexity;
    
    return {
      total: Math.max(0, Math.min(1, total)),
      reliability: reliabilityScore,
      confidence: confidenceFactor,
      trend: trendFactor,
      fit: fitScore,
      components: {
        urgency,
        complexity,
        historicalData: reliability.total || 0
      }
    };
  }

  /**
   * Get complexity factor for task
   */
  getComplexityFactor(task) {
    const complexity = task.complexity || 'medium';
    const factors = {
      'low': 1.1,
      'medium': 1.0,
      'high': 0.9,
      'critical': 0.8
    };
    return factors[complexity] || 1.0;
  }

  /**
   * Get trend factor from analytics
   */
  getTrendFactor(trend) {
    const factors = {
      'stable': 1.0,
      'declining': 0.8,
      'unstable': 0.6,
      'critical': 0.4,
      'insufficient_data': 0.7
    };
    return factors[trend] || 0.7;
  }

  /**
   * Calculate how well tool fits task requirements
   */
  calculateTaskFit(tool, task) {
    const requirements = task.requirements || [];
    if (requirements.length === 0) return 0.8; // Default fit
    
    const matchedCapabilities = requirements.filter(req => 
      tool.capabilities.includes(req)
    ).length;
    
    const fitScore = matchedCapabilities / requirements.length;
    return Math.max(0.3, fitScore); // Minimum 30% fit
  }

  /**
   * Select best tool with safety checks
   */
  selectBestTool(scoredTools, routingDecision) {
    if (scoredTools.length === 0) {
      throw new Error('No tools available for selection');
    }
    
    // Filter tools below minimum threshold
    const viableTools = scoredTools.filter(st => 
      st.score.total >= this.minReliabilityThreshold
    );
    
    if (viableTools.length === 0) {
      console.warn('All tools below reliability threshold, using fallback');
      const fallbackTool = scoredTools.find(st => st.tool.name === 'fallback');
      if (fallbackTool) {
        routingDecision.selectedTool = fallbackTool.tool.name;
        routingDecision.confidence = fallbackTool.score.total;
        routingDecision.fallbackUsed = true;
        routingDecision.reasoning.push('All tools below reliability threshold');
        return fallbackTool.tool;
      }
      throw new Error('No viable tools available');
    }
    
    // Select best viable tool
    const bestTool = viableTools[0];
    routingDecision.selectedTool = bestTool.tool.name;
    routingDecision.confidence = bestTool.score.total;
    
    // Add rejected tools to decision log
    routingDecision.rejectedTools = scoredTools
      .filter(st => st !== bestTool)
      .map(st => ({
        tool: st.tool.name,
        score: st.score.total,
        reason: st.score.total < this.minReliabilityThreshold ? 
          'below_threshold' : 'lower_score'
      }));
    
    // Add reasoning
    routingDecision.reasoning.push(
      `Selected ${bestTool.tool.name} with ${(bestTool.score.total * 100).toFixed(1)}% confidence`,
      `Reliability: ${(bestTool.score.reliability * 100).toFixed(1)}%`,
      `Task fit: ${(bestTool.score.fit * 100).toFixed(1)}%`
    );
    
    return bestTool.tool;
  }

  /**
   * Handle case where no tools are available
   */
  handleNoToolsAvailable(task, routingDecision) {
    routingDecision.selectedTool = 'fallback';
    routingDecision.confidence = this.tools.fallback.baseReliability;
    routingDecision.fallbackUsed = true;
    routingDecision.reasoning.push('No suitable tools found, using fallback');
    
    return {
      tool: this.tools.fallback,
      confidence: routingDecision.confidence,
      reasoning: routingDecision.reasoning,
      taskId: routingDecision.taskId
    };
  }

  /**
   * Handle routing errors
   */
  handleRoutingError(error, routingDecision) {
    console.error('Router error:', error);
    
    routingDecision.selectedTool = 'fallback';
    routingDecision.confidence = 0.5;
    routingDecision.fallbackUsed = true;
    routingDecision.reasoning.push(`Routing error: ${error.message}`);
    
    return {
      tool: this.tools.fallback,
      confidence: 0.5,
      reasoning: routingDecision.reasoning,
      taskId: routingDecision.taskId,
      error: error.message
    };
  }

  /**
   * Log routing decision
   */
  async logRoutingDecision(decision) {
    this.routingLog.push(decision);
    
    // Ensure logs directory exists
    const logDir = './agent-room/logs';
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Append to routing log file
    const logEntry = `${new Date().toISOString()} | ${JSON.stringify(decision)}\n`;
    const logFile = path.join(logDir, 'routing.log');
    
    try {
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write routing log:', error);
    }
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get routing statistics
   */
  getRoutingStats() {
    const recentDecisions = this.routingLog.slice(-100); // Last 100 decisions
    
    const stats = {
      totalDecisions: recentDecisions.length,
      toolUsage: {},
      averageConfidence: 0,
      fallbackUsage: 0
    };
    
    recentDecisions.forEach(decision => {
      // Tool usage
      const tool = decision.selectedTool;
      stats.toolUsage[tool] = (stats.toolUsage[tool] || 0) + 1;
      
      // Confidence
      stats.averageConfidence += decision.confidence;
      
      // Fallback usage
      if (decision.fallbackUsed) {
        stats.fallbackUsage++;
      }
    });
    
    if (stats.totalDecisions > 0) {
      stats.averageConfidence /= stats.totalDecisions;
      stats.fallbackRate = stats.fallbackUsage / stats.totalDecisions;
    }
    
    return stats;
  }

  /**
   * Predict best tool for task type (without execution)
   */
  async predictBestTool(taskType, requirements = []) {
    const task = { type: taskType, requirements };
    const candidates = this.getCandidateTools(task);
    
    if (candidates.length === 0) {
      return {
        recommendedTool: 'fallback',
        confidence: 0.5,
        reason: 'no_suitable_tools'
      };
    }
    
    await this.updateAnalytics();
    const scoredTools = await this.scoreTools(candidates, task);
    
    if (scoredTools.length === 0) {
      return {
        recommendedTool: 'fallback',
        confidence: 0.5,
        reason: 'scoring_failed'
      };
    }
    
    const best = scoredTools[0];
    return {
      recommendedTool: best.tool.name,
      confidence: best.score.total,
      alternatives: scoredTools.slice(1, 3).map(st => ({
        tool: st.tool.name,
        confidence: st.score.total
      })),
      reasoning: [
        `Reliability: ${(best.score.reliability * 100).toFixed(1)}%`,
        `Task fit: ${(best.score.fit * 100).toFixed(1)}%`,
        `Historical data: ${best.score.components.historicalData} executions`
      ]
    };
  }
}

module.exports = AdaptiveRouter;