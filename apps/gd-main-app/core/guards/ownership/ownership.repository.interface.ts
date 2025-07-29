export interface IOwnershipRepository {
  checkOwnership(resourceId: number, userId: number): Promise<boolean>;
}
