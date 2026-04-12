import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import http from "http";

const s3 = new S3Client({
  endpoint: "http://localhost:9000",
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
export default s3;