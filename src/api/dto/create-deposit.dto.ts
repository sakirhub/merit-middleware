import { IsOptional } from 'class-validator';
export class CreateDepositDto {
  access_token: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  user: {
    user_id: string;
    user_name: string;
    user_full_name: string;
  };
  @IsOptional()
  team: string;
}
