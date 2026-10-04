/**
 * Category: Terminal & Eksekusi (18 tools)
 * Sumber: Hermes, Claude Code, OpenClaw, Kustom
 */

import { Tool } from '../../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Detect if running on Windows
 */
function isWindows(): boolean {
  return os.platform() === 'win32';
}

/**
 * Translate common Unix commands to Windows equivalents
 */
function translateCommand(command: string): string {
  if (!isWindows()) {
    return command; // Unix/Linux/Mac - no translation needed
  }
  
  // Windows - translate common Unix commands
  let translated = command;
  
  // Replace Unix command separators with Windows equivalents
  // && works in both, but || needs to be translated carefully
  
  // Common command translations
  const translations: Record<string, string> = {
    'pwd': 'cd',                    // Print working directory
    'ls': 'dir',                     // List directory
    'ls -la': 'dir',                 // List all with details
    'ls -l': 'dir',                  // List with details
    'ls -a': 'dir /a',               // List all including hidden
    'cat': 'type',                   // Display file content
    'rm': 'del',                     // Remove file
    'rm -rf': 'rmdir /s /q',        // Remove directory recursively
    'cp': 'copy',                    // Copy file
    'mv': 'move',                    // Move/rename file
    'mkdir': 'mkdir',                // Create directory (same)
    'rmdir': 'rmdir',                // Remove directory (same)
    'touch': 'type nul >',           // Create empty file
    'clear': 'cls',                  // Clear screen
    'which': 'where',                // Find command location
    'grep': 'findstr',               // Search in files
    'echo': 'echo',                  // Print (same)
    'cd': 'cd',                      // Change directory (same)
  };
  
  // Try to translate the command
  for (const [unix, windows] of Object.entries(translations)) {
    // Match command at start or after && or after ;
    const regex = new RegExp(`(^|&&|;)\\s*${unix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$|&&|;)`, 'g');
    translated = translated.replace(regex, (match, prefix, suffix) => {
      return `${prefix} ${windows}${suffix}`;
    });
  }
  
  return translated;
}

/**
 * Get appropriate shell for the OS
 */
function getShell(): string {
  if (isWindows()) {
    // Try to use PowerShell if available, fallback to CMD
    return 'powershell.exe';
  }
  return '/bin/bash';
}

export const terminalTools: Tool[] = [
  // Hermes - Terminal command
  {
    name: 'terminal',
    description: 'Jalankan perintah shell dengan auto-detect OS (Windows/Unix)',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Perintah shell (Unix commands akan ditranslate otomatis di Windows)' },
        cwd: { type: 'string', description: 'Working directory (optional)' }
      },
      required: ['command']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.command || typeof args.command !== 'string' || args.command.trim() === '') {
        return 'Error: Parameter "command" is required and must be a non-empty string. Example: {"command": "ls -la"}';
      }
      
      try {
        const originalCommand = args.command;
        const translatedCommand = translateCommand(originalCommand);
        
        // Log translation if command was changed
        if (translatedCommand !== originalCommand && isWindows()) {
          console.log(`[Terminal] OS: Windows`);
          console.log(`[Terminal] Original: ${originalCommand}`);
          console.log(`[Terminal] Translated: ${translatedCommand}`);
        }
        
        const { stdout, stderr } = await execAsync(translatedCommand, { 
          cwd: args.cwd || process.cwd(),
          timeout: 30000,
          shell: isWindows() ? 'cmd.exe' : '/bin/bash' // Use appropriate shell
        });
        
        const output = stdout || stderr || 'Command executed successfully';
        
        // Add OS info in output if helpful
        if (isWindows() && translatedCommand !== originalCommand) {
          return `[Windows] ${output}`;
        }
        
        return output;
      } catch (error: any) {
        // Provide helpful error message for Windows users
        if (isWindows() && error.message.includes('is not recognized')) {
          return `Error: Command not found in Windows. 

Original command: ${args.command}
Translated to: ${translateCommand(args.command)}

💡 Tip for Windows:
- Use "dir" instead of "ls"
- Use "cd" instead of "pwd"
- Use "type" instead of "cat"
- Or use PowerShell commands

Error details: ${error.message}`;
        }
        
        return `Error: ${error.message}`;
      }
    }
  },

  // Claude Code - Bash command (with Windows support)
  {
    name: 'bash',
    description: 'Perintah shell dengan auto-translation untuk Windows',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command (auto-translated for Windows)' }
      },
      required: ['command']
    },
    handler: async (args: any) => {
      // Validate required parameters
      if (!args || !args.command || typeof args.command !== 'string' || args.command.trim() === '') {
        return 'Error: Parameter "command" is required and must be a non-empty string. Example: {"command": "npm --version"}';
      }
      
      try {
        const translatedCommand = translateCommand(args.command);
        
        const { stdout, stderr } = await execAsync(translatedCommand, { 
          timeout: 30000,
          shell: isWindows() ? 'cmd.exe' : '/bin/bash'
        });
        
        return stdout || stderr || 'Done';
      } catch (error: any) {
        // Helpful error for Windows
        if (isWindows() && error.message.includes('is not recognized')) {
          return `Error: Command not found in Windows.

Tried: ${translateCommand(args.command)}

💡 Use Windows-compatible commands:
- "dir" (list files)
- "cd" (current directory)  
- "type filename" (read file)
- "npm", "node", "python" (these work as-is)

Error: ${error.message}`;
        }
        
        return `Error: ${error.message}`;
      }
    }
  },

  // Stub tools (16 remaining)
  { name: 'process', description: 'Manage background process (poll, wait, list, kill)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool process belum diimplementasikan' },
  { name: 'execute_code', description: 'Python script yang bisa panggil tool via RPC', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool execute_code belum diimplementasikan' },
  { name: 'powershell', description: 'Perintah PowerShell (Windows)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool powershell belum diimplementasikan' },
  { name: 'monitor', description: 'Pantau proses', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool monitor belum diimplementasikan' },
  { name: 'exec', description: 'Jalankan perintah (OpenClaw)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool exec belum diimplementasikan' },
  { name: 'docker_exec', description: 'Jalankan di container Docker', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool docker_exec belum diimplementasikan' },
  { name: 'ssh_exec', description: 'Jalankan di remote via SSH', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool ssh_exec belum diimplementasikan' },
  { name: 'run_tests', description: 'Jalankan test suite, auto-detect framework', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool run_tests belum diimplementasikan' },
  { name: 'run_linter', description: 'Jalankan linter', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool run_linter belum diimplementasikan' },
  { name: 'run_formatter', description: 'Jalankan formatter', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool run_formatter belum diimplementasikan' },
  { name: 'install_package', description: 'Install package (pip/npm/apt)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool install_package belum diimplementasikan' },
  { name: 'kill_process', description: 'Kill proses by PID/nama', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool kill_process belum diimplementasikan' },
  { name: 'list_processes', description: 'List proses berjalan', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool list_processes belum diimplementasikan' },
  { name: 'env_get', description: 'Baca environment variable', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool env_get belum diimplementasikan' },
  { name: 'env_set', description: 'Set environment variable (session)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool env_set belum diimplementasikan' },
  { name: 'shell_check', description: 'Cek syntax shell script', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool shell_check belum diimplementasikan' }
];
