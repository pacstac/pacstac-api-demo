export type VerifyRequest = {
  wallet: { chain: string; address: string };
  asset: { type: "domain"; ref: { domain: string } };
  asOf?: string;
  require?: { maxAgeSeconds?: number; notRevoked?: boolean };
};

