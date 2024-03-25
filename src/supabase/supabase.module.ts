import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseStrategy } from './strategy/supabase.strategy';

@Module({
  providers: [SupabaseService, SupabaseStrategy],
})
export class SupabaseModule {}
