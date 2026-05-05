import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RevolutCounterparty {
  id: string;
  accounts: { id: string; currency: string }[];
}

@Injectable()
export class RevolutService {
  private readonly logger = new Logger(RevolutService.name);

  constructor(private config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get('REVOLUT_SANDBOX') === 'true'
      ? 'https://sandbox-b2b.revolut.com/api/1.0'
      : 'https://b2b.revolut.com/api/1.0';
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.get('REVOLUT_API_KEY')}`,
      'Content-Type': 'application/json',
    };
  }

  isConfigured(): boolean {
    const key = this.config.get<string>('REVOLUT_API_KEY') ?? '';
    const accountId = this.config.get<string>('REVOLUT_ACCOUNT_ID') ?? '';
    return !!(key && accountId && !key.includes('placeholder'));
  }

  private async addIbanCounterparty(name: string, iban: string, bic: string, currency = 'EUR'): Promise<RevolutCounterparty> {
    const res = await fetch(`${this.baseUrl}/counterparty`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ company_name: name, currency, iban, bic }),
    });
    if (!res.ok) throw new Error(`Revolut add counterparty failed: ${await res.text()}`);
    return res.json();
  }

  private async addRevolutCounterparty(name: string, contact: string): Promise<RevolutCounterparty> {
    // contact can be a revtag (e.g. "@username") or phone number
    const isPhone = /^\+?[0-9\s\-()]{7,}$/.test(contact);
    const body = isPhone
      ? { profile_type: 'personal', name, phone: contact }
      : { profile_type: 'personal', name, revtag: contact.replace(/^@/, '') };

    const res = await fetch(`${this.baseUrl}/counterparty`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Revolut add counterparty failed: ${await res.text()}`);
    return res.json();
  }

  async sendPayout(opts: {
    requestId: string;
    amount: number;
    currency: string;
    workerName: string;
    revolutContact?: string | null;
    bankIban?: string | null;
    bankBic?: string | null;
    reference: string;
  }): Promise<void> {
    const accountId = this.config.get<string>('REVOLUT_ACCOUNT_ID')!;

    let cp: RevolutCounterparty;
    if (opts.revolutContact) {
      cp = await this.addRevolutCounterparty(opts.workerName, opts.revolutContact);
    } else if (opts.bankIban && opts.bankBic) {
      cp = await this.addIbanCounterparty(opts.workerName, opts.bankIban, opts.bankBic, opts.currency);
    } else {
      throw new Error('No payout method: worker needs a Revolut contact or IBAN+BIC');
    }

    const targetAccountId = cp.accounts.find(a => a.currency === opts.currency)?.id ?? cp.accounts[0]?.id;
    if (!targetAccountId) throw new Error('No matching account found on Revolut counterparty');

    const res = await fetch(`${this.baseUrl}/pay`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        request_id: opts.requestId,
        account_id: accountId,
        receiver: { counterparty_id: cp.id, account_id: targetAccountId },
        amount: opts.amount,
        currency: opts.currency,
        reference: opts.reference,
      }),
    });

    if (!res.ok) throw new Error(`Revolut payment failed: ${await res.text()}`);
    this.logger.log(`Revolut payout sent: ${opts.amount} ${opts.currency} → ${opts.workerName} (ref: ${opts.requestId})`);
  }
}
