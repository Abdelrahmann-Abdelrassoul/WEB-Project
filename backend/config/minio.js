import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import http from "http";

const rawEndpoint = process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000";
const normalizedEndpoint = rawEndpoint.replace("localhost", "127.0.0.1");

const s3 = new S3Client({
  endpoint: normalizedEndpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true,
  tls: false,
  requestHandler: new NodeHttpHandler({
    httpAgent: new http.Agent(),
  }),
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME;

/**
 * Rewrites a presigned URL so the browser hits Nginx (/storage/...)
 * instead of the internal minio:9000 hostname.
 *
 * MINIO_ENDPOINT   = http://minio:9000        (internal, for server-side requests)
 * MINIO_PUBLIC_URL = https://localhost/storage (public, for browser URLs)
 */
export const rewritePresignedUrl = (presignedUrl) => {
  const publicBase = process.env.MINIO_PUBLIC_URL;
  if (!publicBase) return presignedUrl;

  // presignedUrl looks like: http://minio:9000/videos/file.mp4?X-Amz-...
  // We replace everything up to and including the bucket name
  const url = new URL(presignedUrl);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const pathWithoutBucket = "/" + pathParts.slice(1).join("/");

  return `${publicBase.replace(/\/$/, "")}${pathWithoutBucket}${url.search}`;
};

export const ensureBucketExists = async () => {
  if (!BUCKET_NAME) {
    throw new Error("MINIO_BUCKET_NAME is not set");
  }

  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (err) {
    const statusCode = err?.$metadata?.httpStatusCode;
    if (statusCode !== 404 && statusCode !== 400) {
      throw err;
    }
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
  }
};

export default s3;