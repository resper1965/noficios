import { supabase } from './supabase';

// Storage Service para Anexos
export class StorageService {
  private bucketName = 'oficios-anexos';

  /**
   * Upload de arquivo para Supabase Storage
   * @param oficioId - ID do ofício
   * @param file - File object ou Buffer
   * @param filename - Nome do arquivo
   * @returns URL pública do arquivo
   */
  async uploadAnexo(oficioId: number | string, file: File | Buffer, filename: string): Promise<string> {
    try {
      // Gerar nome único para evitar conflitos
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${oficioId}/${timestamp}-${sanitizedFilename}`;

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload de anexo:', error);
      throw new Error('Falha ao fazer upload do arquivo');
    }
  }

  /**
   * Download de arquivo
   * @param filePath - Caminho do arquivo no storage
   * @returns Blob do arquivo
   */
  async downloadAnexo(filePath: string): Promise<Blob> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
      throw new Error('Falha ao baixar arquivo');
    }
  }

  /**
   * Listar anexos de um ofício
   * @param oficioId - ID do ofício
   * @returns Lista de arquivos
   */
  async listAnexos(oficioId: number | string): Promise<Array<{ name: string; url: string; size: number }>> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(`${oficioId}/`);

      if (error) throw error;

      return data.map(file => ({
        name: file.name,
        url: this.getPublicUrl(`${oficioId}/${file.name}`),
        size: file.metadata?.size || 0,
      }));
    } catch (error) {
      console.error('Erro ao listar anexos:', error);
      return [];
    }
  }

  /**
   * Deletar anexo
   * @param filePath - Caminho do arquivo
   */
  async deleteAnexo(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
      throw new Error('Falha ao deletar arquivo');
    }
  }

  /**
   * Deletar todos os anexos de um ofício
   * @param oficioId - ID do ofício
   */
  async deleteAllAnexos(oficioId: number | string): Promise<void> {
    try {
      const files = await this.listAnexos(oficioId);
      const filePaths = files.map(f => `${oficioId}/${f.name}`);

      if (filePaths.length > 0) {
        const { error } = await supabase.storage
          .from(this.bucketName)
          .remove(filePaths);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Erro ao deletar anexos:', error);
      throw new Error('Falha ao deletar anexos');
    }
  }

  /**
   * Obter URL pública de um arquivo
   * @param filePath - Caminho do arquivo
   * @returns URL pública
   */
  private getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Validar tipo de arquivo permitido
   * @param filename - Nome do arquivo
   * @returns boolean
   */
  isValidFileType(filename: string): boolean {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    return allowedExtensions.includes(ext);
  }

  /**
   * Validar tamanho do arquivo (máx 10MB)
   * @param size - Tamanho em bytes
   * @returns boolean
   */
  isValidFileSize(size: number): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return size <= maxSize;
  }
}

export const storageService = new StorageService();

