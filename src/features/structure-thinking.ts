/**
 * Deep Structure Thinking - AI Planning System
 * Visualizes AI's thought process in a graph structure
 */

import * as http from 'http';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ThinkingNode {
  id: string;
  type: 'task' | 'subtask' | 'action' | 'decision';
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'failed';
  children: ThinkingNode[];
  metadata?: Record<string, any>;
}

export interface ThinkingPlan {
  id: string;
  query: string;
  timestamp: Date;
  rootNode: ThinkingNode;
  history: ThinkingNode[];
}

export class StructureThinking {
  private enabled: boolean = false;
  private currentPlan: ThinkingPlan | null = null;
  private server: http.Server | null = null;
  private port: number = 3737;
  private planHistory: ThinkingPlan[] = [];

  /**
   * Enable structure thinking mode
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable structure thinking mode
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if structure thinking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Create a new thinking plan
   */
  createPlan(query: string): ThinkingPlan {
    const plan: ThinkingPlan = {
      id: uuidv4(),
      query,
      timestamp: new Date(),
      rootNode: {
        id: 'root',
        type: 'task',
        title: 'Main Goal',
        description: query,
        status: 'planned',
        children: []
      },
      history: []
    };

    this.currentPlan = plan;
    this.planHistory.push(plan);
    
    return plan;
  }

  /**
   * Add node to current plan
   */
  addNode(parentId: string, node: Omit<ThinkingNode, 'id' | 'children'>): string {
    if (!this.currentPlan) {
      throw new Error('No active plan. Create a plan first.');
    }

    const newNode: ThinkingNode = {
      ...node,
      id: uuidv4(),
      children: []
    };

    // Find parent and add child
    const addToParent = (current: ThinkingNode): boolean => {
      if (current.id === parentId) {
        current.children.push(newNode);
        return true;
      }
      
      for (const child of current.children) {
        if (addToParent(child)) return true;
      }
      
      return false;
    };

    if (addToParent(this.currentPlan.rootNode)) {
      this.currentPlan.history.push(newNode);
      return newNode.id;
    }

    throw new Error(`Parent node ${parentId} not found`);
  }

  /**
   * Update node status
   */
  updateNodeStatus(nodeId: string, status: ThinkingNode['status']): void {
    if (!this.currentPlan) return;

    const updateStatus = (current: ThinkingNode): boolean => {
      if (current.id === nodeId) {
        current.status = status;
        return true;
      }
      
      for (const child of current.children) {
        if (updateStatus(child)) return true;
      }
      
      return false;
    };

    updateStatus(this.currentPlan.rootNode);
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): ThinkingPlan | null {
    return this.currentPlan;
  }

  /**
   * Export plan to JSON
   */
  exportPlan(planId?: string): string {
    const plan = planId 
      ? this.planHistory.find(p => p.id === planId)
      : this.currentPlan;

    if (!plan) {
      throw new Error('No plan to export');
    }

    return JSON.stringify(plan, null, 2);
  }

  /**
   * Import plan from JSON
   */
  importPlan(planJson: string): ThinkingPlan {
    const plan: ThinkingPlan = JSON.parse(planJson);
    plan.timestamp = new Date(plan.timestamp); // Convert back to Date
    
    this.currentPlan = plan;
    this.planHistory.push(plan);
    
    return plan;
  }

  /**
   * Start visualization server
   */
  async startServer(): Promise<string> {
    if (this.server) {
      return `http://localhost:${this.port}`;
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        if (req.url === '/') {
          // Serve HTML visualization
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(this.generateVisualizationHTML());
        } else if (req.url === '/api/plan') {
          // Serve current plan as JSON
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this.currentPlan || {}));
        } else if (req.url === '/api/history') {
          // Serve plan history
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this.planHistory));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      this.server.listen(this.port, () => {
        const url = `http://localhost:${this.port}`;
        resolve(url);
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          this.port++;
          this.server?.close();
          this.server = null;
          this.startServer().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Stop visualization server
   */
  stopServer(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  /**
   * Generate visualization HTML
   */
  private generateVisualizationHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>STRAK AGENT - Deep Structure Thinking</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0a0e27;
            color: #fff;
            overflow: hidden;
        }
        #header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        #header h1 {
            font-size: 2rem;
            margin-bottom: 5px;
        }
        #header p {
            opacity: 0.9;
        }
        #container {
            display: flex;
            height: calc(100vh - 80px);
        }
        #graph {
            flex: 1;
            position: relative;
        }
        #sidebar {
            width: 350px;
            background: #1a1f3a;
            padding: 20px;
            overflow-y: auto;
            border-left: 2px solid #667eea;
        }
        #sidebar h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        .node-detail {
            background: #0a0e27;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 3px solid #667eea;
        }
        .node-detail h3 {
            color: #fff;
            font-size: 1rem;
            margin-bottom: 8px;
        }
        .node-detail p {
            color: #aaa;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-top: 8px;
        }
        .status-planned { background: #fbbf24; color: #000; }
        .status-in-progress { background: #3b82f6; color: #fff; }
        .status-completed { background: #10b981; color: #fff; }
        .status-failed { background: #ef4444; color: #fff; }
        .export-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            font-size: 1rem;
            margin-top: 10px;
            transition: background 0.3s;
        }
        .export-btn:hover {
            background: #5568d3;
        }
        .link { fill: none; stroke: #667eea; stroke-width: 2px; }
        .node circle {
            fill: #667eea;
            stroke: #fff;
            stroke-width: 2px;
            cursor: pointer;
        }
        .node.completed circle { fill: #10b981; }
        .node.in-progress circle { fill: #3b82f6; }
        .node.failed circle { fill: #ef4444; }
        .node text {
            fill: #fff;
            font-size: 12px;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div id="header">
        <h1>🧠 Deep Structure Thinking</h1>
        <p>AI Planning Visualization - STRAK AGENT</p>
    </div>
    <div id="container">
        <div id="graph"></div>
        <div id="sidebar">
            <h2>Current Plan</h2>
            <div id="plan-info"></div>
            <button class="export-btn" onclick="exportPlan()">📋 Export Plan</button>
        </div>
    </div>
    
    <script>
        let currentData = null;
        
        async function fetchData() {
            const response = await fetch('/api/plan');
            currentData = await response.json();
            renderGraph();
            renderSidebar();
        }
        
        function renderGraph() {
            if (!currentData || !currentData.rootNode) return;
            
            const width = document.getElementById('graph').clientWidth;
            const height = document.getElementById('graph').clientHeight;
            
            // Clear existing
            d3.select('#graph').selectAll('*').remove();
            
            const svg = d3.select('#graph')
                .append('svg')
                .attr('width', width)
                .attr('height', height);
            
            const g = svg.append('g');
            
            // Create tree layout
            const tree = d3.tree().size([height - 100, width - 200]);
            const root = d3.hierarchy(currentData.rootNode, d => d.children);
            tree(root);
            
            // Draw links
            g.selectAll('.link')
                .data(root.links())
                .enter()
                .append('path')
                .attr('class', 'link')
                .attr('d', d3.linkHorizontal()
                    .x(d => d.y + 100)
                    .y(d => d.x + 50));
            
            // Draw nodes
            const node = g.selectAll('.node')
                .data(root.descendants())
                .enter()
                .append('g')
                .attr('class', d => \`node \${d.data.status}\`)
                .attr('transform', d => \`translate(\${d.y + 100},\${d.x + 50})\`);
            
            node.append('circle')
                .attr('r', 8);
            
            node.append('text')
                .attr('dx', 12)
                .attr('dy', 4)
                .text(d => d.data.title);
        }
        
        function renderSidebar() {
            if (!currentData) return;
            
            const info = document.getElementById('plan-info');
            info.innerHTML = \`
                <div class="node-detail">
                    <h3>Query</h3>
                    <p>\${currentData.query}</p>
                    <span class="status-badge status-planned">\${new Date(currentData.timestamp).toLocaleString()}</span>
                </div>
            \`;
            
            if (currentData.history && currentData.history.length > 0) {
                currentData.history.forEach(node => {
                    info.innerHTML += \`
                        <div class="node-detail">
                            <h3>\${node.title}</h3>
                            <p>\${node.description}</p>
                            <span class="status-badge status-\${node.status}">\${node.status}</span>
                        </div>
                    \`;
                });
            }
        }
        
        function exportPlan() {
            const data = JSON.stringify(currentData, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`plan_\${currentData.id}.json\`;
            a.click();
        }
        
        // Auto-refresh every 2 seconds
        fetchData();
        setInterval(fetchData, 2000);
    </script>
</body>
</html>`;
  }
}

export const structureThinking = new StructureThinking();
