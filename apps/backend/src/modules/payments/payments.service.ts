import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { Ipay88Service } from "./ipay88.service";

export interface IpayResponse {
  MerchantCode: string;
  PaymentId: string;
  RefNo: string;
  Amount: string;
  Currency: string;
  Status: string; // "1" = success, "0" or "6" = failed
  Remark?: string;
  TransId?: string;
  AuthCode?: string;
  ErrDesc?: string;
  Signature: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ipay88: Ipay88Service,
    private readonly settings: SettingsService,
  ) {}

  async createBookingCheckout(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.customerId !== userId) {
      throw new BadRequestException("Not your booking");
    }
    if (booking.totalAmount <= 0) {
      throw new BadRequestException("Booking has no amount to charge");
    }

    let payment = await this.prisma.payment.findFirst({
      where: {
        bookingId,
        kind: "CUSTOMER_CHARGE",
        status: "PENDING",
        provider: "IPAY88",
      },
    });

    if (!payment) {
      const settings = await this.settings.get();
      payment = await this.prisma.payment.create({
        data: {
          bookingId,
          userId,
          kind: "CUSTOMER_CHARGE",
          amount: booking.totalAmount,
          currency: settings.defaultCurrency,
          provider: "IPAY88",
          status: "PENDING",
          referenceNo: `BK-${booking.id.slice(0, 8)}-${Date.now()}`,
        },
      });
    }

    const form = this.ipay88.buildRequestForm({
      refNo: payment.referenceNo!,
      amountSen: payment.amount,
      currency: payment.currency,
      productDescription: `RumaCare booking ${booking.id.slice(0, 8)}`,
      userName: booking.customer.name,
      userEmail: booking.customer.email,
      userContact: booking.customer.phone ?? "",
    });

    return {
      paymentId: payment.id,
      referenceNo: payment.referenceNo,
      amountSen: payment.amount,
      currency: payment.currency,
      url: this.ipay88.paymentUrl,
      form,
    };
  }

  async handleIpay88Response(body: IpayResponse) {
    const ok = this.ipay88.verifyResponse({
      paymentId: body.PaymentId,
      refNo: body.RefNo,
      amount: body.Amount,
      currency: body.Currency,
      status: body.Status,
      signature: body.Signature,
    });
    if (!ok) throw new BadRequestException("Invalid iPay88 signature");

    const payment = await this.prisma.payment.findUnique({
      where: { referenceNo: body.RefNo },
    });
    if (!payment) throw new NotFoundException("Unknown referenceNo");

    if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
      return payment;
    }

    const status = body.Status === "1" ? "SUCCEEDED" : "FAILED";
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        externalTransId: body.TransId ?? null,
        rawResponse: body as unknown as Prisma.InputJsonValue,
      },
    });

    if (status === "SUCCEEDED" && payment.bookingId) {
      this.logger.log(
        `Booking ${payment.bookingId} paid (${this.ipay88.formatAmount(payment.amount)} ${payment.currency})`,
      );
    }

    return updated;
  }

  async recordWorkerPayout(bookingId: string, workerId: string, amountSen: number) {
    return this.prisma.payment.create({
      data: {
        bookingId,
        userId: workerId,
        kind: "WORKER_PAYOUT",
        amount: amountSen,
        provider: "MANUAL",
        status: "SUCCEEDED",
        note: "Auto-queued on booking completion",
      },
    });
  }

  async recordContactViewFee(params: {
    workerId: string;
    homeServiceCategoryId: string;
    feeSen: number;
  }) {
    return this.prisma.payment.create({
      data: {
        userId: params.workerId,
        kind: "WORKER_CONTACT_VIEW_FEE",
        amount: params.feeSen,
        provider: "MANUAL",
        status: "SUCCEEDED",
        note: `home_service_category=${params.homeServiceCategoryId}`,
      },
    });
  }
}
