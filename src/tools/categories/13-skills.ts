/**
 * Category: Keterampilan & Plugin (10 tools)
 */

import { Tool } from '../../types/index.js';
import * as fs from 'fs-extra';
import * as path from 'path';

export const skillsTools: Tool[] = [
  { name: 'skills_list', description: 'List skills tersedia', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool skills_list belum diimplementasikan' },
  { name: 'skill_view', description: 'Baca konten skill', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool skill_view belum diimplementasikan' },
  { name: 'skill_manage', description: 'Buat/edit/hapus skill', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool skill_manage belum diimplementasikan' },
  { name: 'plugin_list', description: 'List plugin', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool plugin_list belum diimplementasikan' },
  { name: 'plugin_install', description: 'Install plugin', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool plugin_install belum diimplementasikan' },
  { name: 'plugin_enable', description: 'Enable plugin', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool plugin_enable belum diimplementasikan' },
  { name: 'plugin_disable', description: 'Disable plugin', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool plugin_disable belum diimplementasikan' },
  
  // Canvas Tools - Implemented
  {
    name: 'canvas_present',
    description: 'Create and present HTML content in browser canvas. Use for visual dashboards, charts, interactive content.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the canvas presentation' },
        content: { type: 'string', description: 'HTML content to present. Can include CSS and JavaScript.' },
        filename: { type: 'string', description: 'Output filename (optional, default: canvas_output.html)' }
      },
      required: ['title', 'content']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.title || typeof args.title !== 'string' || args.title.trim() === '') {
        return 'Error: Parameter "title" is required and must be a non-empty string. Example: {"title": "My Dashboard", "content": "<h1>Hello</h1>"}';
      }
      if (!args.content || typeof args.content !== 'string' || args.content.trim() === '') {
        return 'Error: Parameter "content" is required and must be a non-empty string. Example: {"title": "My Dashboard", "content": "<h1>Hello</h1>"}';
      }
      
      const { title, content, filename = 'canvas_output.html' } = args;
      
      // Create full HTML page
      const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .canvas-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .canvas-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .canvas-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .canvas-header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .canvas-content {
            padding: 40px;
        }
        .canvas-footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="canvas-container">
        <div class="canvas-header">
            <h1>${title}</h1>
            <p>Created by STRAK AGENT Canvas</p>
        </div>
        <div class="canvas-content">
            ${content}
        </div>
        <div class="canvas-footer">
            Generated on ${new Date().toLocaleString()} | STRAK AGENT v1.0.0
        </div>
    </div>
</body>
</html>`;
      
      // Write to file
      const outputPath = path.join(process.cwd(), filename);
      await fs.writeFile(outputPath, htmlTemplate, 'utf-8');
      
      return `Canvas created successfully!\n\nFile: ${outputPath}\n\nTo view:\n- Windows: start ${filename}\n- macOS: open ${filename}\n- Linux: xdg-open ${filename}\n\nThe canvas has been saved and is ready to present in your browser.`;
    }
  },
  
  {
    name: 'canvas_snapshot',
    description: 'Take a snapshot of canvas content and save as HTML or markdown. Useful for archiving visual presentations.',
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source canvas HTML file path' },
        format: { type: 'string', enum: ['html', 'markdown'], description: 'Output format (html or markdown)' },
        output: { type: 'string', description: 'Output filename (optional)' }
      },
      required: ['source']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.source || typeof args.source !== 'string' || args.source.trim() === '') {
        return 'Error: Parameter "source" is required and must be a non-empty string. Example: {"source": "canvas_output.html", "format": "html"}';
      }
      
      const { source, format = 'html', output } = args;
      
      // Read source file
      const sourcePath = path.join(process.cwd(), source);
      if (!await fs.pathExists(sourcePath)) {
        return `Error: Source file not found: ${sourcePath}`;
      }
      
      const content = await fs.readFile(sourcePath, 'utf-8');
      
      // Generate output filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultOutput = `snapshot_${timestamp}.${format}`;
      const outputPath = path.join(process.cwd(), output || defaultOutput);
      
      if (format === 'markdown') {
        // Convert HTML to markdown representation
        const mdContent = `# Canvas Snapshot
Generated: ${new Date().toLocaleString()}
Source: ${source}

---

## Original Content

\`\`\`html
${content}
\`\`\`

---

*This snapshot was created by STRAK AGENT canvas_snapshot tool*
`;
        await fs.writeFile(outputPath, mdContent, 'utf-8');
      } else {
        // Copy as HTML with snapshot metadata
        const snapshotHtml = content.replace(
          '</body>',
          `\n<!-- Canvas Snapshot: ${new Date().toISOString()} -->\n<!-- Source: ${source} -->\n</body>`
        );
        await fs.writeFile(outputPath, snapshotHtml, 'utf-8');
      }
      
      return `Snapshot created successfully!\n\nFormat: ${format}\nOutput: ${outputPath}\n\nSnapshot captured at ${new Date().toLocaleString()}`;
    }
  },
  
  {
    name: 'canvas_eval',
    description: 'Evaluate and analyze canvas content. Returns statistics and metadata about the canvas.',
    parameters: {
      type: 'object',
      properties: {
        filepath: { type: 'string', description: 'Path to canvas HTML file to evaluate' },
        metrics: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Metrics to evaluate: size, elements, scripts, styles, images (optional, defaults to all)' 
        }
      },
      required: ['filepath']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.filepath || typeof args.filepath !== 'string' || args.filepath.trim() === '') {
        return 'Error: Parameter "filepath" is required and must be a non-empty string. Example: {"filepath": "canvas_output.html"}';
      }
      
      const { filepath, metrics = ['size', 'elements', 'scripts', 'styles', 'images'] } = args;
      
      const filePath = path.join(process.cwd(), filepath);
      if (!await fs.pathExists(filePath)) {
        return `Error: Canvas file not found: ${filePath}`;
      }
      
      // Read and analyze file
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      
      const evaluation: any = {
        file: filepath,
        evaluated_at: new Date().toISOString()
      };
      
      // File size
      if (metrics.includes('size')) {
        evaluation.size = {
          bytes: stats.size,
          kilobytes: (stats.size / 1024).toFixed(2),
          readable: stats.size < 1024 ? `${stats.size} bytes` : `${(stats.size / 1024).toFixed(2)} KB`
        };
      }
      
      // Count HTML elements
      if (metrics.includes('elements')) {
        const divCount = (content.match(/<div/g) || []).length;
        const spanCount = (content.match(/<span/g) || []).length;
        const pCount = (content.match(/<p/g) || []).length;
        const h1Count = (content.match(/<h1/g) || []).length;
        const h2Count = (content.match(/<h2/g) || []).length;
        
        evaluation.elements = {
          total_tags: (content.match(/<\w+/g) || []).length,
          div: divCount,
          span: spanCount,
          paragraph: pCount,
          h1: h1Count,
          h2: h2Count
        };
      }
      
      // Scripts
      if (metrics.includes('scripts')) {
        const scriptTags = (content.match(/<script/g) || []).length;
        const inlineScripts = (content.match(/<script>/g) || []).length;
        
        evaluation.scripts = {
          total: scriptTags,
          inline: inlineScripts,
          external: scriptTags - inlineScripts
        };
      }
      
      // Styles
      if (metrics.includes('styles')) {
        const styleTags = (content.match(/<style/g) || []).length;
        const linkTags = (content.match(/<link.*stylesheet/g) || []).length;
        
        evaluation.styles = {
          style_tags: styleTags,
          external_stylesheets: linkTags,
          inline_styles: (content.match(/style="/g) || []).length
        };
      }
      
      // Images
      if (metrics.includes('images')) {
        const imgTags = (content.match(/<img/g) || []).length;
        
        evaluation.images = {
          total: imgTags
        };
      }
      
      // Additional metadata
      evaluation.metadata = {
        title: (content.match(/<title>(.*?)<\/title>/) || [])[1] || 'Untitled',
        has_viewport: content.includes('viewport'),
        charset: (content.match(/charset="?([\w-]+)"?/) || [])[1] || 'unknown',
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString()
      };
      
      return `Canvas Evaluation Report\n${'='.repeat(50)}\n\n${JSON.stringify(evaluation, null, 2)}\n\n✓ Evaluation completed successfully`;
    }
  }
];
