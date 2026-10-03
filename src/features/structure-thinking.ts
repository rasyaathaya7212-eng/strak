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
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
            color: #fff;
            overflow: hidden;
        }
        
        #header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 25px 30px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            border-bottom: 3px solid #667eea;
        }
        
        #header h1 {
            font-size: 2.2rem;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        #header p {
            opacity: 0.95;
            font-size: 1.1rem;
        }
        
        #container {
            display: flex;
            height: calc(100vh - 120px);
        }
        
        #graph {
            flex: 1;
            position: relative;
            padding: 20px;
        }
        
        #sidebar {
            width: 380px;
            background: rgba(26, 31, 58, 0.95);
            padding: 25px;
            overflow-y: auto;
            border-left: 3px solid #667eea;
            box-shadow: -5px 0 20px rgba(0,0,0,0.3);
        }
        
        #sidebar h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.4rem;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .node-detail {
            background: linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%);
            padding: 18px;
            border-radius: 10px;
            margin-bottom: 18px;
            border-left: 4px solid #667eea;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .node-detail:hover {
            transform: translateX(5px);
            box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
        }
        
        .node-detail h3 {
            color: #fff;
            font-size: 1.1rem;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .node-detail p {
            color: #ccc;
            font-size: 0.95rem;
            line-height: 1.6;
            margin-top: 8px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 700;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-planned { 
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #000;
            box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
        }
        
        .status-in-progress { 
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: #fff;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
            animation: pulse 2s infinite;
        }
        
        .status-completed { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
        }
        
        .status-failed { 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #fff;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .export-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-size: 1.05rem;
            font-weight: 600;
            margin-top: 15px;
            transition: all 0.3s;
            box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
        }
        
        .export-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        
        .export-btn:active {
            transform: translateY(0);
        }
        
        /* Network Graph Styles */
        .link {
            fill: none;
            stroke: #667eea;
            stroke-width: 3px;
            stroke-opacity: 0.6;
            transition: stroke-width 0.3s;
        }
        
        .link:hover {
            stroke-width: 5px;
            stroke-opacity: 1;
        }
        
        .node-box {
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .node-box rect {
            fill: #1a1f3a;
            stroke: #667eea;
            stroke-width: 3px;
            rx: 10;
            ry: 10;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
        }
        
        .node-box:hover rect {
            stroke-width: 4px;
            filter: drop-shadow(0 6px 15px rgba(102, 126, 234, 0.6));
        }
        
        .node-box.completed rect { 
            fill: #0a3d2a;
            stroke: #10b981;
        }
        
        .node-box.in-progress rect { 
            fill: #1e3a8a;
            stroke: #3b82f6;
            animation: glow 2s infinite;
        }
        
        .node-box.failed rect { 
            fill: #4c1d1d;
            stroke: #ef4444;
        }
        
        .node-box.root rect {
            fill: #2d1b4e;
            stroke: #a78bfa;
            stroke-width: 4px;
        }
        
        @keyframes glow {
            0%, 100% { 
                filter: drop-shadow(0 4px 10px rgba(59, 130, 246, 0.5));
            }
            50% { 
                filter: drop-shadow(0 6px 20px rgba(59, 130, 246, 0.9));
            }
        }
        
        .node-box text {
            fill: #fff;
            font-size: 14px;
            font-weight: 600;
            pointer-events: none;
            text-anchor: middle;
        }
        
        .node-box .node-title {
            font-size: 15px;
            font-weight: 700;
        }
        
        .node-box .node-desc {
            font-size: 11px;
            fill: #aaa;
            font-weight: 400;
        }
        
        .node-status-icon {
            font-size: 18px;
        }
        
        #zoom-controls {
            position: absolute;
            top: 30px;
            right: 30px;
            background: rgba(26, 31, 58, 0.95);
            border-radius: 10px;
            padding: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            border: 2px solid #667eea;
        }
        
        #zoom-controls button {
            display: block;
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 15px;
            margin: 5px 0;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }
        
        #zoom-controls button:hover {
            background: #5568d3;
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div id="header">
        <h1>🧠 Deep Structure Thinking</h1>
        <p>AI Planning Visualization - STRAK AGENT</p>
    </div>
    <div id="container">
        <div id="graph">
            <div id="zoom-controls">
                <button onclick="zoomIn()">🔍 Zoom In</button>
                <button onclick="zoomOut()">🔍 Zoom Out</button>
                <button onclick="resetZoom()">↺ Reset</button>
            </div>
        </div>
        <div id="sidebar">
            <h2>📋 Current Plan</h2>
            <div id="plan-info"></div>
            <button class="export-btn" onclick="exportPlan()">📥 Export Plan JSON</button>
        </div>
    </div>
    
    <script>
        let currentData = null;
        let svg, g, zoom;
        let currentZoom = 1;
        
        function zoomIn() {
            currentZoom *= 1.3;
            applyZoom();
        }
        
        function zoomOut() {
            currentZoom /= 1.3;
            applyZoom();
        }
        
        function resetZoom() {
            currentZoom = 1;
            applyZoom();
        }
        
        function applyZoom() {
            const width = document.getElementById('graph').clientWidth;
            const height = document.getElementById('graph').clientHeight;
            g.transition()
                .duration(300)
                .attr('transform', \`translate(\${width/2}, \${height/2}) scale(\${currentZoom})\`);
        }
        
        async function fetchData() {
            const response = await fetch('/api/plan');
            currentData = await response.json();
            renderGraph();
            renderSidebar();
        }
        
        function renderGraph() {
            if (!currentData || !currentData.rootNode) return;
            
            const width = document.getElementById('graph').clientWidth - 100;
            const height = document.getElementById('graph').clientHeight - 100;
            
            // Clear existing
            d3.select('#graph svg').remove();
            
            svg = d3.select('#graph')
                .append('svg')
                .attr('width', width + 100)
                .attr('height', height + 100);
            
            g = svg.append('g');
            
            // Create hierarchy
            const root = d3.hierarchy(currentData.rootNode, d => d.children);
            
            // Create force simulation for network layout
            const nodes = root.descendants();
            const links = root.links();
            
            // Force simulation
            const simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(links)
                    .id(d => d.data.id)
                    .distance(150)
                    .strength(0.5))
                .force('charge', d3.forceManyBody().strength(-800))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collision', d3.forceCollide().radius(80));
            
            // Draw links
            const link = g.selectAll('.link')
                .data(links)
                .enter()
                .append('line')
                .attr('class', 'link');
            
            // Draw nodes
            const node = g.selectAll('.node-box')
                .data(nodes)
                .enter()
                .append('g')
                .attr('class', d => \`node-box \${d.data.status} \${d.depth === 0 ? 'root' : ''}\`)
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));
            
            // Node rectangles (boxes)
            node.append('rect')
                .attr('width', 160)
                .attr('height', 80)
                .attr('x', -80)
                .attr('y', -40);
            
            // Status icon
            node.append('text')
                .attr('class', 'node-status-icon')
                .attr('y', -15)
                .text(d => {
                    if (d.data.status === 'completed') return '✓';
                    if (d.data.status === 'in-progress') return '⟳';
                    if (d.data.status === 'failed') return '✗';
                    return '○';
                });
            
            // Node title
            node.append('text')
                .attr('class', 'node-title')
                .attr('y', 5)
                .text(d => {
                    const title = d.data.title;
                    return title.length > 18 ? title.substring(0, 18) + '...' : title;
                })
                .append('title')
                .text(d => d.data.title);
            
            // Node description (truncated)
            node.append('text')
                .attr('class', 'node-desc')
                .attr('y', 20)
                .text(d => {
                    const desc = d.data.description;
                    return desc.length > 20 ? desc.substring(0, 20) + '...' : desc;
                })
                .append('title')
                .text(d => d.data.description);
            
            // Update positions on simulation tick
            simulation.on('tick', () => {
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                
                node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
            });
            
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
            
            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }
            
            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
            
            // Initial zoom
            setTimeout(() => {
                g.attr('transform', \`translate(\${width/2}, \${height/2}) scale(1)\`);
            }, 100);
        }
        
        function renderSidebar() {
            if (!currentData) return;
            
            const info = document.getElementById('plan-info');
            const timestamp = new Date(currentData.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            info.innerHTML = \`
                <div class="node-detail">
                    <h3>🎯 Query</h3>
                    <p>\${currentData.query}</p>
                    <span class="status-badge status-planned">\${timestamp}</span>
                </div>
            \`;
            
            if (currentData.history && currentData.history.length > 0) {
                currentData.history.forEach((node, idx) => {
                    const icon = node.status === 'completed' ? '✓' : 
                                node.status === 'in-progress' ? '⟳' : 
                                node.status === 'failed' ? '✗' : '○';
                    
                    info.innerHTML += \`
                        <div class="node-detail">
                            <h3>\${icon} \${node.title}</h3>
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
            a.download = \`strak_plan_\${currentData.id}.json\`;
            a.click();
            URL.revokeObjectURL(url);
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
