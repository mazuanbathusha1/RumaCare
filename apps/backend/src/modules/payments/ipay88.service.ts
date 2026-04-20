import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";

/**
 * iPay88 uses a SHA-256 HMAC signature based on key + merchantCode + refNo + amount + currency.
 * Amount in the form fields is "123.45"; the digit portion (no decimal) is what feeds the signature.
 *
 * Docs: https://developer.ipay88.com/
 */
@Injectable()
export class Ipay88Service {
  constructor(private readonly config: ConfigService) {}

  private requireConfig<T extends string>(key: T): string {
    const v = this.config.get<string>(key);
    if (!v) throw new BadRequestException(`${key} is not configured`);
    return v;
  }

  get merchantCode(): string {
    return this.requireConfig("IPAY88_MERCHANT_CODE");
  }

  get merchantKey(): string {
    return this.requireConfig("IPAY88_MERCHANT_KEY");
  }

  get paymentUrl(): string {
    return (
      this.config.get<string>("IPAY88_PAYMENT_URL") ??
      "https://payment.ipay88.com.my/ePayment/entry.asp"
    );
  }

  get responseUrl(): string {
    return this.requireConfig("IPAY88_RESPONSE_URL");
  }

  get backendUrl(): string {
    return this.requireConfig("IPAY88_BACKEND_URL");
  }

  formatAmount(sen: number): string {
    return (sen / 100).toFixed(2);
  }

  signRequest(params: {
    refNo: string;
    amountSen: number;
    currency: string;
  }): string {
    const amountDigits = String(params.amountSen);
    const source =
      this.merchantKey +
      this.merchantCode +
      params.refNo +
      amountDigits +
      params.currency;
    return crypto
      .createHmac("sha256", this.merchantKey)
      .update(source)
      .digest("base64");
  }

  signResponse(params: {
    paymentId: string;
    refNo: string;
    amount: string;
    currency: string;
    status: string;
  }): string {
    const amountDigits = params.amount.replace(/[^0-9]/g, "");
    const source =
      this.merchantKey +
      this.merchantCode +
      params.paymentId +
      params.refNo +
      amountDigits +
      params.currency +
      params.status;
    return crypto
      .createHmac("sha256", this.merchantKey)
      .update(source)
      .digest("base64");
  }

  verifyResponse(params: {
    paymentId: string;
    refNo: string;
    amount: string;
    currency: string;
    status: string;
    signature: string;
  }): boolean {
    const expected = this.signResponse({
      paymentId: params.paymentId,
      refNo: params.refNo,
      amount: params.amount,
      currency: params.currency,
      status: params.status,
    });
    const a = Buffer.from(expected);
    const b = Buffer.from(params.signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  buildRequestForm(params: {
    refNo: string;
    amountSen: number;
    currency: string;
    productDescription: string;
    userName: string;
    userEmail: string;
    userContact: string;
  }): Record<string, string> {
    return {
      MerchantCode: this.merchantCode,
      PaymentId: "",
      RefNo: params.refNo,
      Amount: this.formatAmount(params.amountSen),
      Currency: params.currency,
      ProdDesc: params.productDescription,
      UserName: params.userName,
      UserEmail: params.userEmail,
      UserContact: params.userContact,
      Remark: "",
      Lang: "UTF-8",
      SignatureType: "SHA256",
      Signature: this.signRequest({
        refNo: params.refNo,
        amountSen: params.amountSen,
        currency: params.currency,
      }),
      ResponseURL: this.responseUrl,
      BackendURL: this.backendUrl,
    };
  }
}
