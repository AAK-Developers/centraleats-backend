import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageRepository } from '../../domain/ports/storage.repository';
import * as fs from 'fs';
import * as path from 'path';

export class SupabaseStorageAdapter implements IStorageRepository {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isPlaceholder = !supabaseKey || supabaseKey === "your-service-role-key" || supabaseKey.includes("placeholder");

    if (!supabaseUrl || isPlaceholder) {
      console.warn('[SupabaseStorageAdapter] Supabase credentials are missing or are placeholder keys. Image uploads will fallback to local storage.');
      this.supabase = null;
    } else {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
      } catch (err: any) {
        console.error(`[SupabaseStorageAdapter] Failed to initialize Supabase client: ${err.message}. Uploads will fallback to local storage.`);
        this.supabase = null;
      }
    }
  }

  private async saveLocally(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const uniqueFileName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadsDir, uniqueFileName);
      await fs.promises.writeFile(filePath, fileBuffer);
      
      return `/uploads/${uniqueFileName}`;
    } catch (err: any) {
      console.error(`[SupabaseStorageAdapter] Failed to save file locally: ${err.message}`);
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fileName)}&background=0D8ABC&color=fff&size=200`;
    }
  }

  async uploadImage(fileBuffer: Buffer, fileName: string, mimeType: string, bucket: string, folderPath?: string): Promise<string> {
    if (!this.supabase) {
      console.warn(`[SupabaseStorageAdapter] No active Supabase client. Saving ${fileName} locally.`);
      return this.saveLocally(fileBuffer, fileName);
    }

    const uniqueFileName = `${Date.now()}-${fileName}`;
    const filePath = folderPath ? `${folderPath}/${uniqueFileName}` : uniqueFileName;
    
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.warn(`[SupabaseStorageAdapter] Error uploading image to Supabase: ${error.message}. Saving locally as fallback.`);
        return this.saveLocally(fileBuffer, fileName);
      }

      const { data: publicUrlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.warn(`[SupabaseStorageAdapter] Exception during image upload to Supabase: ${err.message}. Saving locally as fallback.`);
      return this.saveLocally(fileBuffer, fileName);
    }
  }
}

