/**
 * Category: Terminal & Eksekusi (18 tools)
 * Sumber: Hermes, Claude Code, OpenClaw, Kustom
 */

import { Tool } from '../../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const terminalTools: Tool[] = [
  // Hermes - Terminal command
  {
    name: 'terminal',
    description: 'Jalankan perintah shell, foreground/background/PTY',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Perintah shell yang akan dijalankan' },
        cwd: { type: 'string', description: 'Working directory (optional)' }
      },
      required: ['command']
    },
    handler: async (args: any) => {
      try {
        const { stdout, stderr } = await execAsync(args.command, { 
          cwd: args.cwd || process.cwd(),
          timeout: 30000 
        });
        return stdout || stderr || 'Command executed successfully';
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    }
  },

  // Claude Code - Bash command
  {
    name: 'bash',
    description: 'Perintah shell (Claude Code)',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Bash command' }
      },
      required: ['command']
    },
    handler: async (args: any) => {
      try {
        const { stdout, stderr } = await execAsync(args.command, { timeout: 30000 });
        return stdout || stderr || 'Done';
      } catch (error: any) {
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
