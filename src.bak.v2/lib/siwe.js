/**
 * Minimal EIP-4361 (Sign-In With Ethereum) message builder.
 *
 * We don't need the full `siwe` npm package on the client — we just need to
 * format the message string in the exact shape the spec requires, so that
 * (a) the wallet displays it sensibly to the user, and (b) the backend can
 * parse + verify it. The backend uses the real `siwe` package for verification.
 *
 * Spec: https://eips.ethereum.org/EIPS/eip-4361
 */
export class SiweMessage {
  constructor({
    domain,
    address,
    statement,
    uri,
    version = "1",
    chainId,
    nonce,
    issuedAt,
    expirationTime,
    notBefore,
    requestId,
    resources = [],
  }) {
    this.domain = domain;
    this.address = address;
    this.statement = statement;
    this.uri = uri;
    this.version = version;
    this.chainId = chainId;
    this.nonce = nonce;
    this.issuedAt = issuedAt || new Date().toISOString();
    this.expirationTime = expirationTime;
    this.notBefore = notBefore;
    this.requestId = requestId;
    this.resources = resources;
  }

  prepareMessage() {
    const header = `${this.domain} wants you to sign in with your Ethereum account:\n${this.address}`;
    const body = this.statement ? `\n\n${this.statement}\n` : "\n";

    const fields = [
      `URI: ${this.uri}`,
      `Version: ${this.version}`,
      `Chain ID: ${this.chainId}`,
      `Nonce: ${this.nonce}`,
      `Issued At: ${this.issuedAt}`,
    ];
    if (this.expirationTime) fields.push(`Expiration Time: ${this.expirationTime}`);
    if (this.notBefore) fields.push(`Not Before: ${this.notBefore}`);
    if (this.requestId) fields.push(`Request ID: ${this.requestId}`);
    if (this.resources && this.resources.length) {
      fields.push(`Resources:`);
      for (const r of this.resources) fields.push(`- ${r}`);
    }

    return header + body + "\n" + fields.join("\n");
  }
}
