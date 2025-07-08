import { Injectable } from '@nestjs/common';
import * as argon2 from '@node-rs/argon2';

@Injectable()
export class CryptoService {
  async createHash(password: string) {
    return await argon2.hash(password);
  }

  async comparePassword(password: string, hash: string) {
    return argon2.verify(hash, password);
  }
}
