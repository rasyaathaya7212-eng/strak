#!/usr/bin/env node

/**
 * STRAK AGENT - AI Agent with Chimera Architecture
 * Entry Point
 */

import { CLI } from './cli';

async function main() {
  try {
    const cli = new CLI();
    await cli.start();
  } catch (error: any) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the CLI
main();
