import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [ApiController],
  providers: [ApiService, SupabaseService],
})
export class ApiModule {}
