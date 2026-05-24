import { createHmac, randomBytes } from "node:crypto";

export interface TwitterOAuth1Credentials {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function buildSignatureBaseString(
  method: string,
  url: string,
  params: Record<string, string>,
): string {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");
  return [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join("&");
}

function buildSigningKey(consumerSecret: string, tokenSecret: string): string {
  return `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
}

/**
 * Build an OAuth 1.0a Authorization header for a Twitter API v2 request.
 * Body params for JSON POSTs are NOT included in the signature base string
 * (per Twitter spec — only query-string and form-encoded params are signed).
 */
export function buildOAuth1Header(
  method: string,
  url: string,
  creds: TwitterOAuth1Credentials,
  queryParams: Record<string, string> = {},
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const allParams = { ...oauthParams, ...queryParams };
  const baseString = buildSignatureBaseString(method, url, allParams);
  const signingKey = buildSigningKey(
    creds.consumerSecret,
    creds.accessTokenSecret,
  );
  const signature = createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const headerString = Object.keys(headerParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
    .join(", ");

  return `OAuth ${headerString}`;
}
