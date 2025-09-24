export interface IOwnershipRepository {
  checkOwnership(resourceId: number | string, userId: number): Promise<boolean>;
}
