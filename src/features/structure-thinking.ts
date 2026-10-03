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
            padding: 20px 30px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            border-bottom: 2px solid #667eea;
        }
        
        #header h1 {
            font-size: 2rem;
            margin-bottom: 5px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        #header p {
            opacity: 0.95;
            font-size: 1rem;
        }
        
        #container {
            display: flex;
            height: calc(100vh - 100px);
        }
        
        #graph {
            flex: 1;
            position: relative;
            padding: 20px;
            overflow: hidden;
        }
        
        #sidebar {
            width: 350px;
            background: rgba(26, 31, 58, 0.95);
            padding: 25px;
            overflow-y: auto;
            border-left: 2px solid #667eea;
            box-shadow: -5px 0 20px rgba(0,0,0,0.3);
        }
        
        #sidebar h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.3rem;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .node-detail {
            background: linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
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
            font-size: 1rem;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .node-detail p {
            color: #ccc;
            font-size: 0.9rem;
            line-height: 1.5;
            margin-top: 5px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 700;
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-planned { 
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #000;
            box-shadow: 0 2px 5px rgba(251, 191, 36, 0.3);
        }
        
        .status-in-progress { 
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: #fff;
            box-shadow: 0 2px 5px rgba(59, 130, 246, 0.3);
            animation: pulse 2s infinite;
        }
        
        .status-completed { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
            box-shadow: 0 2px 5px rgba(16, 185, 129, 0.3);
        }
        
        .status-failed { 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #fff;
            box-shadow: 0 2px 5px rgba(239, 68, 68, 0.3);
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .export-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-size: 1rem;
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
        
        /* Mind Map Styles */
        .link {
            fill: none;
            stroke: #667eea;
            stroke-width: 2px;
            stroke-opacity: 0.6;
        }
        
        .node-group {
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .node-box {
            fill: rgba(26, 31, 58, 0.95);
            stroke: #667eea;
            stroke-width: 2px;
            rx: 12;
            ry: 12;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
        }
        
        .node-group:hover .node-box {
            stroke-width: 3px;
            filter: drop-shadow(0 6px 15px rgba(102, 126, 234, 0.6));
        }
        
        .node-group.completed .node-box { 
            fill: rgba(16, 185, 129, 0.2);
            stroke: #10b981;
            stroke-width: 2px;
        }
        
        .node-group.in-progress .node-box { 
            fill: rgba(59, 130, 246, 0.2);
            stroke: #3b82f6;
            stroke-width: 2px;
            animation: boxGlow 2s infinite;
        }
        
        .node-group.failed .node-box { 
            fill: rgba(239, 68, 68, 0.2);
            stroke: #ef4444;
            stroke-width: 2px;
        }
        
        .node-group.root .node-box {
            fill: rgba(167, 139, 250, 0.2);
            stroke: #a78bfa;
            stroke-width: 3px;
        }
        
        @keyframes boxGlow {
            0%, 100% { 
                filter: drop-shadow(0 4px 10px rgba(59, 130, 246, 0.5));
            }
            50% { 
                filter: drop-shadow(0 6px 20px rgba(59, 130, 246, 0.9));
            }
        }
        
        .node-title {
            fill: #fff;
            font-size: 15px;
            font-weight: 700;
            text-anchor: start;
        }
        
        .node-desc {
            fill: #aaa;
            font-size: 12px;
            font-weight: 400;
            text-anchor: start;
        }
        
        .node-status-badge {
            fill: #667eea;
            stroke: none;
            rx: 8;
            ry: 8;
        }
        
        .node-status-text {
            fill: #fff;
            font-size: 10px;
            font-weight: 700;
            text-anchor: middle;
            text-transform: uppercase;
        }
        
        #zoom-controls {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(26, 31, 58, 0.95);
            border-radius: 8px;
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
            font-size: 0.9rem;
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
        let svg, g, zoomBehavior;
        
        function zoomIn() {
            svg.transition().call(zoomBehavior.scaleBy, 1.3);
        }
        
        function zoomOut() {
            svg.transition().call(zoomBehavior.scaleBy, 0.7);
        }
        
        function resetZoom() {
            svg.transition().call(zoomBehavior.transform, d3.zoomIdentity);
        }
        
        async function fetchData() {
            const response = await fetch('/api/plan');
            currentData = await response.json();
            renderGraph();
            renderSidebar();
        }
        
        function wrapText(text, maxWidth) {
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';
            
            words.forEach(word => {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                if (testLine.length * 7 < maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            });
            if (currentLine) lines.push(currentLine);
            return lines;
        }
        
        function renderGraph() {
            if (!currentData || !currentData.rootNode) return;
            
            const width = document.getElementById('graph').clientWidth - 40;
            const height = document.getElementById('graph').clientHeight - 40;
            
            // Clear existing
            d3.select('#graph svg').remove();
            
            svg = d3.select('#graph')
                .append('svg')
                .attr('width', width)
                .attr('height', height);
            
            // Zoom behavior
            zoomBehavior = d3.zoom()
                .scaleExtent([0.3, 3])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                });
            
            svg.call(zoomBehavior);
            
            g = svg.append('g');
            
            // Create hierarchy
            const root = d3.hierarchy(currentData.rootNode);
            
            // Tree layout (horizontal)
            const treeLayout = d3.tree()
                .size([height - 100, width - 300])
                .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));
            
            treeLayout(root);
            
            // Draw curved links
            const link = g.selectAll('.link')
                .data(root.links())
                .enter()
                .append('path')
                .attr('class', 'link')
                .attr('d', d => {
                    const sourceX = d.source.y + 150;
                    const sourceY = d.source.x + 50;
                    const targetX = d.target.y + 150;
                    const targetY = d.target.x + 50;
                    
                    return \`M\${sourceX},\${sourceY}
                            C\${(sourceX + targetX) / 2},\${sourceY}
                             \${(sourceX + targetX) / 2},\${targetY}
                             \${targetX},\${targetY}\`;
                });
            
            // Draw nodes
            const node = g.selectAll('.node-group')
                .data(root.descendants())
                .enter()
                .append('g')
                .attr('class', d => \`node-group \${d.data.status} \${d.depth === 0 ? 'root' : ''}\`)
                .attr('transform', d => \`translate(\${d.y + 150}, \${d.x + 50})\`);
            
            // Calculate box dimensions based on content
            const boxWidth = 250;
            const boxPadding = 15;
            
            // Add rectangles (boxes)
            node.append('rect')
                .attr('class', 'node-box')
                .attr('x', 0)
                .attr('y', -40)
                .attr('width', boxWidth)
                .attr('height', d => {
                    const titleLines = wrapText(d.data.title, boxWidth - 30);
                    const descLines = wrapText(d.data.description, boxWidth - 30);
                    return 80 + (titleLines.length - 1) * 18 + (descLines.length - 1) * 16;
                });
            
            // Add title (wrapped)
            node.each(function(d) {
                const nodeGroup = d3.select(this);
                const titleLines = wrapText(d.data.title, boxWidth - 30);
                
                titleLines.forEach((line, i) => {
                    nodeGroup.append('text')
                        .attr('class', 'node-title')
                        .attr('x', boxPadding)
                        .attr('y', -20 + i * 18)
                        .text(line);
                });
                
                // Add description (wrapped)
                const descLines = wrapText(d.data.description, boxWidth - 30);
                const descStartY = -20 + titleLines.length * 18 + 10;
                
                descLines.forEach((line, i) => {
                    nodeGroup.append('text')
                        .attr('class', 'node-desc')
                        .attr('x', boxPadding)
                        .attr('y', descStartY + i * 16)
                        .text(line);
                });
                
                // Add status badge
                const badgeY = descStartY + descLines.length * 16 + 15;
                
                nodeGroup.append('rect')
                    .attr('class', 'node-status-badge')
                    .attr('x', boxPadding)
                    .attr('y', badgeY - 12)
                    .attr('width', 80)
                    .attr('height', 18)
                    .attr('fill', d => {
                        if (d.data.status === 'completed') return '#10b981';
                        if (d.data.status === 'in-progress') return '#3b82f6';
                        if (d.data.status === 'failed') return '#ef4444';
                        return '#fbbf24';
                    });
                
                nodeGroup.append('text')
                    .attr('class', 'node-status-text')
                    .attr('x', boxPadding + 40)
                    .attr('y', badgeY)
                    .text(d.data.status);
            });
            
            // Center the view
            const bounds = g.node().getBBox();
            const scale = 0.9 / Math.max(bounds.width / width, bounds.height / height);
            const translateX = width / 2 - scale * (bounds.x + bounds.width / 2);
            const translateY = height / 2 - scale * (bounds.y + bounds.height / 2);
            
            svg.call(zoomBehavior.transform, d3.zoomIdentity
                .translate(translateX, translateY)
                .scale(scale));
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
                    <h3>🎯 Main Query</h3>
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
