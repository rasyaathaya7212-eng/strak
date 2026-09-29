/**
 * ASCII Art Logo (Optimized for terminal)
 */

import chalk from 'chalk';

export const logoLeft = `
    ░▓████▓▒
  ▓██████████▓
 ░████████████░
 ▓█████████████
 ██████████████
 ▓█████████████
 ░████████████░
   ▒████████▒
     ▓████▓
 ░▒▓░ ▓████▓ ░▓▒░
░█████░▓████▓░█████░
 ░▒▓░  ▓████▓  ░▓▒░
       ▓████▓
`;

export const logoRight = logoLeft;

export const robotSmall = `
  ╔═══╗
  ║ ◉ ║
  ╠═══╣
  ║▓▓▓║
  ╚═╤═╝
   ╔╩╗
   ║ ║
  ╔╝ ╚╗
`;

// Main logo - smaller version for header
export const mainLogo = [
  '       ░▓██▓▒',
  '     ▓████████▓',
  '    ████████████',
  '    ████████████',
  '    ████████████',
  '     ▒██████▒',
  '  ░▓░  ████  ░▓░',
  ' ░███░ ████ ░███░',
  '   ▒▓  ████  ▓▒'
];

export function getColoredLogo(): string[] {
  return mainLogo.map(line => {
    return line
      .replace(/█/g, chalk.cyan('█'))
      .replace(/▓/g, chalk.blue('▓'))
      .replace(/▒/g, chalk.magenta('▒'))
      .replace(/░/g, chalk.gray('░'));
  });
}

export function getFullLogo(): string {
  return chalk.cyan(logoLeft);
}
