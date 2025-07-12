export class UserContextDto {
  id: number;
}

export class UserRefreshContextDto extends UserContextDto {
  exp: string;
}
