#!/usr/bin/env node

/**
 * MCP Gmail Sync - Processar emails INGEST
 * 
 * Este script usa MCP para acessar Gmail do Google Workspace
 * e processar emails com label INGEST automaticamente
 */

const { spawn } = require('child_process');

class MCPGmailSync {
  constructor() {
    this.workspace = 'resper@ness.com.br';
    this.label = 'INGEST';
    this.interval = 15 * 60 * 1000; // 15 minutos
  }

  /**
   * Executar sincronização via MCP
   */
  async syncEmails() {
    console.log('📧 Iniciando sincronização Gmail via MCP...');
    
    try {
      // Usar MCP para acessar Gmail
      const emails = await this.searchEmails();
      console.log(`📬 Encontrados ${emails.length} emails com label ${this.label}`);
      
      // Processar cada email
      for (const email of emails) {
        await this.processEmail(email);
      }
      
      console.log('✅ Sincronização concluída!');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  }

  /**
   * Buscar emails com label INGEST
   */
  async searchEmails() {
    return new Promise((resolve, reject) => {
      const mcp = spawn('mcp', ['gmail', 'search', '--label', this.label, '--workspace', this.workspace]);
      
      let output = '';
      mcp.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      mcp.on('close', (code) => {
        if (code === 0) {
          try {
            const emails = JSON.parse(output);
            resolve(emails);
          } catch (error) {
            reject(new Error('Erro ao parsear resposta MCP'));
          }
        } else {
          reject(new Error(`MCP falhou com código ${code}`));
        }
      });
    });
  }

  /**
   * Processar email individual
   */
  async processEmail(email) {
    console.log(`📧 Processando: ${email.subject}`);
    
    try {
      // Extrair dados do email
      const dados = await this.extractEmailData(email);
      
      // Criar ofício no Supabase
      await this.createOficio(dados);
      
      // Marcar como processado
      await this.markAsProcessed(email.id);
      
      console.log(`✅ Email processado: ${email.subject}`);
    } catch (error) {
      console.error(`❌ Erro ao processar email ${email.subject}:`, error);
    }
  }

  /**
   * Extrair dados do email
   */
  async extractEmailData(email) {
    return new Promise((resolve, reject) => {
      const mcp = spawn('mcp', ['gmail', 'extract', '--email-id', email.id]);
      
      let output = '';
      mcp.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      mcp.on('close', (code) => {
        if (code === 0) {
          try {
            const dados = JSON.parse(output);
            resolve(dados);
          } catch (error) {
            reject(new Error('Erro ao extrair dados do email'));
          }
        } else {
          reject(new Error(`Extração falhou com código ${code}`));
        }
      });
    });
  }

  /**
   * Criar ofício no Supabase
   */
  async createOficio(dados) {
    return new Promise((resolve, reject) => {
      const mcp = spawn('mcp', ['supabase', 'create-oficio', '--data', JSON.stringify(dados)]);
      
      mcp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Criação de ofício falhou com código ${code}`));
        }
      });
    });
  }

  /**
   * Marcar email como processado
   */
  async markAsProcessed(emailId) {
    return new Promise((resolve, reject) => {
      const mcp = spawn('mcp', ['gmail', 'mark-processed', '--email-id', emailId]);
      
      mcp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Marcação falhou com código ${code}`));
        }
      });
    });
  }

  /**
   * Iniciar monitoramento contínuo
   */
  startMonitoring() {
    console.log(`🔄 Iniciando monitoramento a cada ${this.interval / 1000 / 60} minutos`);
    
    // Executar imediatamente
    this.syncEmails();
    
    // Executar a cada intervalo
    setInterval(() => {
      this.syncEmails();
    }, this.interval);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const sync = new MCPGmailSync();
  
  if (process.argv.includes('--monitor')) {
    sync.startMonitoring();
  } else {
    sync.syncEmails();
  }
}

module.exports = MCPGmailSync;




