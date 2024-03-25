import { Inject, Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ExtractJwt } from 'passport-jwt';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private clientInstance: SupabaseClient;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  async getClient() {


    this.clientInstance = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
        },
        global: {
          headers: {
            Authorization: `Bearer ${
              ExtractJwt.fromAuthHeaderAsBearerToken() && this.request
                ? ExtractJwt.fromAuthHeaderAsBearerToken()(this.request)
                : ''
            }`,
          },
        },
      },
    );
    return this.clientInstance;
  }

  client() {
    return this.supabase;
  }

  async getAuthUser(client: any) {
    const authUser = await client.auth.getUser();
    const authId = authUser.data.user.id;
    const { data: user } = await client
      .from('users')
      .select('*')
      .eq('id', authId)
      .single();

    return user;
  }
}
