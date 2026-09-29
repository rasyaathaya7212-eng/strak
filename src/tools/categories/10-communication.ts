/**
 * Category: Komunikasi & Pesan (10 tools)
 */

import { Tool } from '../../types/index.js';

export const communicationTools: Tool[] = [
  { name: 'message_send', description: 'Kirim pesan ke channel', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool message_send belum diimplementasikan' },
  { name: 'email_send', description: 'Kirim email (SMTP gratis)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool email_send belum diimplementasikan' },
  { name: 'email_read', description: 'Baca email (IMAP)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool email_read belum diimplementasikan' },
  { name: 'slack_send', description: 'Kirim ke Slack', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool slack_send belum diimplementasikan' },
  { name: 'discord_send', description: 'Kirim ke Discord', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool discord_send belum diimplementasikan' },
  { name: 'telegram_send', description: 'Kirim ke Telegram', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool telegram_send belum diimplementasikan' },
  { name: 'whatsapp_send', description: 'Kirim ke WhatsApp', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool whatsapp_send belum diimplementasikan' },
  { name: 'matrix_send', description: 'Kirim ke Matrix', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool matrix_send belum diimplementasikan' },
  { name: 'irc_send', description: 'Kirim ke IRC', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool irc_send belum diimplementasikan' },
  { name: 'sms_send', description: 'Kirim SMS (via gateway gratis)', parameters: { type: 'object', properties: {} }, handler: async () => 'Tool sms_send belum diimplementasikan' }
];
