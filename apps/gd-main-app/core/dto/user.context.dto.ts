export class UserContextDto {
  id: number;
  sessionId: string;
}

export class UserRefreshContextDto extends UserContextDto {
  exp: string;
}
