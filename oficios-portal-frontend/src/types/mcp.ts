/**
 * Tipos TypeScript para MCP User-Friendly System
 * Preparado para RBAC e multitenancy futuro
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  created_at: string;
}

export interface MCPJob {
  id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  gmail_account: string;
  emails_processed: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
}

export interface MCPExecutionOptions {
  gmail_account: string;
  label?: string;
  max_emails?: number;
}

export interface MCPError {
  error: {
    code: 'MCP_CONNECTION_ERROR' | 'MCP_PROCESSING_ERROR' | 'MCP_AUTH_ERROR';
    message: string;
    details?: {
      gmail_account: string;
      job_id: string;
      retry_after?: number;
    };
    timestamp: string;
    requestId: string;
  };
}

export interface MCPExecutionResult {
  job_id: string;
  status: 'pending' | 'running';
  gmail_account: string;
  started_at: string;
}

export interface MCPJobStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  emails_processed: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}




