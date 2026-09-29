/**
 * Category: Git & Version Control (12 tools)
 */

import { Tool } from '../../types/index.js';

export const gitTools: Tool[] = [
  { name: 'git_status', description: 'Status repo', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_status belum diimplementasikan' },
  { name: 'git_diff', description: 'Diff changes', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_diff belum diimplementasikan' },
  { name: 'git_commit', description: 'Commit changes', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_commit belum diimplementasikan' },
  { name: 'git_log', description: 'Log commit', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_log belum diimplementasikan' },
  { name: 'git_branch', description: 'List/buat/pindah branch', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_branch belum diimplementasikan' },
  { name: 'git_checkout', description: 'Checkout file/branch', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_checkout belum diimplementasikan' },
  { name: 'git_stash', description: 'Stash/unstash changes', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_stash belum diimplementasikan' },
  { name: 'git_pull', description: 'Pull dari remote', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_pull belum diimplementasikan' },
  { name: 'git_push', description: 'Push ke remote', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_push belum diimplementasikan' },
  { name: 'git_merge', description: 'Merge branch', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_merge belum diimplementasikan' },
  { name: 'git_rebase', description: 'Rebase branch', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_rebase belum diimplementasikan' },
  { name: 'git_clone', description: 'Clone repo', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool git_clone belum diimplementasikan' }
];
