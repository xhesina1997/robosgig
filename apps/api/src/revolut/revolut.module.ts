import { Global, Module } from '@nestjs/common';
import { RevolutService } from './revolut.service';

@Global()
@Module({
  providers: [RevolutService],
  exports: [RevolutService],
})
export class RevolutModule {}
