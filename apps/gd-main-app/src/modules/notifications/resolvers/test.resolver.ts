import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class TestResolver {
  @Query(() => String)
  hello() {
    return 'Hello world!';
  }
}
