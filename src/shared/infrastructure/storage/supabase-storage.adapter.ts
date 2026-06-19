import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageRepository } from '../../domain/ports/storage.repository';
import { AppError } from '../../errors/AppError';

export class SupabaseStorageAdapter implements IStorageRepository {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadImage(fileBuffer: Buffer, fileName: string, mimeType: string, bucket: string): Promise<string> {
    const uniqueFileName = `${Date.now()}-${fileName}`;
    
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(uniqueFileName, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new AppError(`Error uploading image: ${error.message}`, 500);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFileName);

    return publicUrlData.publicUrl;
  }
}
