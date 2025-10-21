/**
 * MCP Executor Service
 * Lógica de negócio para execução MCP user-friendly
 */

import { createClient } from '@supabase/supabase-js';
import { MCPJob, MCPExecutionOptions, MCPExecutionResult, MCPJobStatus } from '@/types/mcp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class MCPExecutor {
  private supabase: any;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Executar job MCP
   */
  async executeJob(userId: string, options: MCPExecutionOptions): Promise<MCPExecutionResult> {
    try {
      // Criar job no banco
      const job = await this.createJob(userId, options.gmail_account);
      
      // Iniciar processamento assíncrono
      this.processGmailAsync(job.id, options);
      
      return {
        job_id: job.id,
        status: 'pending',
        gmail_account: options.gmail_account,
        started_at: job.started_at
      };
    } catch (error) {
      console.error('Erro ao executar MCP job:', error);
      throw new Error(`Falha ao iniciar execução MCP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Criar job no banco de dados
   */
  private async createJob(userId: string, gmailAccount: string): Promise<MCPJob> {
    const { data, error } = await this.supabase
      .from('mcp_jobs')
      .insert({
        user_id: userId,
        gmail_account: gmailAccount,
        status: 'pending',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar job: ${error.message}`);
    }

    return data;
  }

  /**
   * Processar Gmail de forma assíncrona
   */
  private async processGmailAsync(jobId: string, options: MCPExecutionOptions): Promise<void> {
    try {
      // Atualizar status para running
      await this.updateJobStatus(jobId, 'running');

      // Simular processamento MCP (substituir pela implementação real)
      const result = await this.simulateMCPProcessing(options);

      // Atualizar job com resultado
      await this.updateJobCompletion(jobId, 'completed', result.emailsProcessed);
      
    } catch (error) {
      console.error(`Erro no processamento MCP job ${jobId}:`, error);
      await this.updateJobCompletion(jobId, 'failed', 0, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  /**
   * Simular processamento MCP (substituir pela implementação real)
   */
  private async simulateMCPProcessing(options: MCPExecutionOptions): Promise<{ emailsProcessed: number }> {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular resultado
    return {
      emailsProcessed: Math.floor(Math.random() * 10) + 1
    };
  }

  /**
   * Atualizar status do job
   */
  private async updateJobStatus(jobId: string, status: 'running' | 'completed' | 'failed'): Promise<void> {
    const { error } = await this.supabase
      .from('mcp_jobs')
      .update({ status })
      .eq('id', jobId);

    if (error) {
      console.error(`Erro ao atualizar status do job ${jobId}:`, error);
    }
  }

  /**
   * Atualizar conclusão do job
   */
  private async updateJobCompletion(
    jobId: string, 
    status: 'completed' | 'failed', 
    emailsProcessed: number, 
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      emails_processed: emailsProcessed,
      completed_at: new Date().toISOString()
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await this.supabase
      .from('mcp_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error(`Erro ao atualizar conclusão do job ${jobId}:`, error);
    }
  }

  /**
   * Obter status do job
   */
  async getJobStatus(jobId: string): Promise<MCPJobStatus | null> {
    const { data, error } = await this.supabase
      .from('mcp_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error(`Erro ao obter status do job ${jobId}:`, error);
      return null;
    }

    return {
      id: data.id,
      status: data.status,
      emails_processed: data.emails_processed,
      started_at: data.started_at,
      completed_at: data.completed_at,
      error_message: data.error_message
    };
  }

  /**
   * Obter histórico de jobs do usuário
   */
  async getUserJobHistory(userId: string, limit: number = 10): Promise<MCPJob[]> {
    const { data, error } = await this.supabase
      .from('mcp_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Erro ao obter histórico de jobs do usuário ${userId}:`, error);
      return [];
    }

    return data || [];
  }
}




