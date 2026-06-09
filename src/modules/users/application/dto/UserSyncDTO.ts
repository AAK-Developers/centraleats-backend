export interface UserSyncDTO {
  eventType: 'created' | 'updated' | 'deleted';
  externalId: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}
