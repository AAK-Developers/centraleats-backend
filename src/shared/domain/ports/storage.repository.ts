export interface IStorageRepository {
  uploadImage(fileBuffer: Buffer, fileName: string, mimeType: string, bucket: string): Promise<string>;
}
