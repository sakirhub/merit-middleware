import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiService } from './api.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}
  @Post('bank-trasfer/methods')
  getBankTransferMethods() {
    return this.apiService.getBankTransferMethods();
  }
  @Post('deposit')
  deposit(@Body() createDepositDto: CreateDepositDto) {
    return this.apiService.createDepositMerit(createDepositDto);
  }
  @Post('deposit/verify')
  verifyDeposit(@Body() body: any) {
    return {
      status: 'success',
      transaction_id: body.transaction_id,
    };
  }
}
