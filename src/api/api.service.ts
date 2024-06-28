import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { randomUUID } = require('crypto');

@Injectable()
export class ApiService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getBankTransferMethods() {
    const client: any = this.supabaseService.client() as any;
    const { data: bankTransferMethods, error: bankTransferMethodsError } =
      await client
        .from('payment_methods')
        .select('id, name, logo, status')
        .eq('status', 'active')
        .neq('id', 'aad2e73d-0a8a-4de4-9841-980567cbf34f')
        .neq('id', '279fbfdb-34c8-41e5-9d9b-54137ad20f8b');
    const returnData = bankTransferMethods.map((method) => {
      return {
        _id: method.id,
        name: method.name,
        logo: method.logo,
        status: method.status,
      };
    });
    if (bankTransferMethodsError) {
      console.error('Bir hata oluştu:', bankTransferMethodsError);
      return;
    }
    return returnData;
  }
  async checkInvestor(investor: any): Promise<any> {
    const client: any = this.supabaseService.client() as any;
    const { data: user, error: userError } = await client
      .from('investors')
      .select('id')
      .eq('site_user_id', investor.user_id)
      .eq('site', '7b5233ef-202f-46c4-a4d9-9be055388311');
    if (userError) {
      console.error('Bir hata oluştu:', userError);
      return;
    }
    if (user.length > 0) {
      return user[0].id;
    }
    function splitName(fullName) {
      const parts = fullName.trim().split(/\s+/); // Tüm boşlukları baz alarak ayır
      const lastName = parts.pop(); // Son elemanı al ve kaldır (soyisim)
      const firstName = parts.join(' '); // Geri kalan elemanları birleştir (isim)
      return { firstName, lastName };
    }
    const { firstName, lastName } = splitName(investor.user_full_name);
    const { data, error } = await client
      .from('investors')
      .insert([
        {
          name: firstName,
          surname: lastName,
          full_name: investor.user_full_name,
          username: investor.user_name || null,
          site: '7b5233ef-202f-46c4-a4d9-9be055388311',
          site_user_id: investor.user_id,
          metadata: {
            email: investor.email ? investor.email : null,
            tc_number: investor.tc_number ? investor.tc_number : null,
            phone: investor.phone ? investor.phone : null,
            birth_date: investor.birth_date ? investor.birth_date : null,
          },
          creator: 'cc43948a-cc2e-41c9-9407-960118cd7b98',
        },
      ])
      .select('id');
    if (error) {
      console.error('Bir hata oluştu:', error);
      return;
    }
    return data[0].id;
  }
  async checkBankAccount(
    amount: any,
    paymentMethod: any,
    siteId: any,
  ): Promise<any> {
    const client: any = this.supabaseService.client() as any;
    if (paymentMethod) {
      const { data, error } = await client
        .from('bank_accounts')
        .select('id, name, account_number,team, payment_method(name,logo)')
        .eq('payment_method', paymentMethod)
        .eq('status', 'active')
        .eq('site', siteId)
        .lte('min_limit', amount)
        .gte('max_limit', amount);
      if (error) {
        console.error('Bir hata oluştu:', error);
        return;
      }
      if (data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return {
          id: data[randomIndex].id,
          name: data[randomIndex].name,
          team: data[randomIndex].team,
          payment_method: data[randomIndex].payment_method.id,
          account_number: data[randomIndex].account_number,
          logo: data[randomIndex].payment_method.logo,
          bank_name: data[randomIndex].payment_method.name,
          min_transfer_amount: data[randomIndex].min_limit,
          max_transfer_amount: data[randomIndex].max_limit,
        };
      }
      return false;
    } else {
      const { data, error } = await client
        .from('bank_accounts')
        .select('id, name, account_number,team, payment_method(id, name, logo)')
        .eq('status', 'active')
        .eq('site', siteId)
        .neq('payment_method', '279fbfdb-34c8-41e5-9d9b-54137ad20f8b')
        .neq('payment_method', 'aad2e73d-0a8a-4de4-9841-980567cbf34f')
        .lte('min_limit', amount)
        .gte('max_limit', amount);
      if (error) {
        console.error('Bir hata oluştu:', error);
        return;
      }
      if (data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return {
          id: data[randomIndex].id,
          name: data[randomIndex].name,
          team: data[randomIndex].team,
          payment_method: data[randomIndex].payment_method.id,
          account_number: data[randomIndex].account_number,
          logo: data[randomIndex].payment_method.logo,
          bank_name: data[randomIndex].payment_method.name,
          min_transfer_amount: data[randomIndex].min_limit,
          max_transfer_amount: data[randomIndex].max_limit,
        };
      }
      return false;
    }
  }
  async deposit(createDepositDto: CreateDepositDto) {
    const client: any = this.supabaseService.client() as any;
    const siteId = '7b5233ef-202f-46c4-a4d9-9be055388311';
    const investor = await this.checkInvestor(createDepositDto.user);
    const bankAccount = await this.checkBankAccount(
      createDepositDto.amount,
      null,
      siteId,
    );
    if (!bankAccount)
      return new NotFoundException(
        'No account could be found to invest in for the relevant investment request.',
      ).getResponse();
    const investment: any = {
      investor: investor,
      bank_account: bankAccount.id,
      amount: createDepositDto.amount,
      currency: 'TRY',
      status: 'pending',
      type: 'fast',
      team: bankAccount.team,
      creator: 'cc43948a-cc2e-41c9-9407-960118cd7b98',
      site: siteId,
      transaction_id: createDepositDto.transaction_id,
      payment_method: bankAccount.payment_method,
      success_url: '',
      fail_url: '',
      transactions: {
        data: [
          {
            message:
              'Yatırım talebi ' +
              new Date().toLocaleString('TR-tr', {
                timeZone: 'Europe/Istanbul',
              }) +
              ' tarihinde merit api tarafından oluşturuldu.',
          },
        ],
      },
    };
    const { error } = await client.from('investments').insert([investment]);
    if (error) {
      return new BadRequestException(
        'This transaction has been created before. Check the transaction_id field!',
      ).getResponse();
    }
    return {
      investment: {
        transaction_id: createDepositDto.transaction_id,
        amount: createDepositDto.amount,
        status: 'pending',
        created: new Date(),
        user: createDepositDto.user,
      },
      bank_accounts: [
        {
          id: bankAccount.id,
          bank_name: bankAccount.bank_name,
          name: bankAccount.name,
          account_number: bankAccount.account_number,
          min_transfer_amount: 50,
          max_transfer_amount: 20000,
          status: 'active',
        },
      ],
    };
  }

  async createDepositMerit(createDepositDto: CreateDepositDto) {
    const login = await fetch('https://v2.rushpay.online/v1/integration/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_key: 'meritking@32e032daab',
        app_secret: '9q1PYi1Z5k71',
      }),
    });
    const loginResponse = await login.json();
    const token = loginResponse.token;
    function splitName(fullName) {
      const nameParts = fullName.trim().split(' ');

      const lastName = nameParts.pop();

      const firstName = nameParts.join(' ');

      return {
        firstName: firstName,
        lastName: lastName,
      };
    }
    const { firstName, lastName } = splitName(
      createDepositDto.user.user_full_name,
    );
    const postData = {
      payment_method: 'Bank Transfer',
      amount: Number(createDepositDto.amount),
      currency: 'TRY',
      user: {
        id: createDepositDto.user.user_id,
        name: firstName,
        surname: lastName,
        username: createDepositDto.user.user_name,
      },
      transaction_id: createDepositDto.transaction_id,
      success_url: 'https://example.com/success',
      fail_url: 'https://example.com/fail',
    };
    const deposit = await fetch(
      'https://v2.rushpay.online/v1/integration/deposit/bank-transfer/havale',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      },
    );
    const depositResponse = await deposit.json();
    return {
      investment: {
        transaction_id: createDepositDto.transaction_id,
        amount: createDepositDto.amount,
        status: 'pending',
        created: new Date(),
        user: createDepositDto.user,
      },
      bank_accounts: [
        {
          id: 'e0468efe-cd4a-44bc-a0c2-9f3150863148',
          bank_name: 'FAST2',
          name: depositResponse.name,
          account_number: depositResponse.account_number,
          min_transfer_amount: 50,
          max_transfer_amount: 100000,
          status: 'active',
        },
      ],
    };
  }
}
