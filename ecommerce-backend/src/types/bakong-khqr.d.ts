declare module 'bakong-khqr' {
  export class IndividualInfo {
    constructor(
      bakongAccountId: string,
      merchantName: string,
      merchantCity: string,
      optional?: {
        amount?: number;
        currency?: any;
        billNumber?: string;
        mobileNumber?: string;
        storeLabel?: string;
        terminalLabel?: string;
        purposeOfTransaction?: string;
        expirationTimestamp?: number;
      },
    );
  }

  export class MerchantInfo {
    constructor(
      bakongAccountId: string,
      merchantName: string,
      merchantCity: string,
      merchantId: string,
      acquiringBank: string,
      optional?: {
        amount?: number;
        currency?: any;
        billNumber?: string;
        mobileNumber?: string;
        storeLabel?: string;
        terminalLabel?: string;
        purposeOfTransaction?: string;
        expirationTimestamp?: number;
      },
    );
  }

  export const khqrData: {
    currency: {
      usd: any;
      khr: any;
    };
  };

  export class BakongKHQR {
    generateIndividual(info: IndividualInfo): {
      status: { code: number; errorCode: any; message: any };
      data: { qr: string; md5: string };
    };
    generateMerchant(info: MerchantInfo): {
      status: { code: number; errorCode: any; message: any };
      data: { qr: string; md5: string };
    };
    static decode(qrString: string): any;
    static verify(qrString: string): any;
  }
}
