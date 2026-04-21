import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export type StorageDriver = "local" | "s3";

export interface PutObjectInput {
  /** Logical key prefix, e.g. "partners/ic-copy" */
  keyPrefix: string;
  filename: string;
  contentType: string;
  body: Buffer;
}

export interface PutObjectResult {
  key: string;
  url: string;
}

/**
 * Abstracts file storage over local disk (dev) vs S3-compatible (R2 / AWS S3).
 * Driver selection by `STORAGE_DRIVER` env (`local` default).
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private driver: StorageDriver = "local";
  private localDir = "";
  private localPublicPrefix = "/uploads";
  private s3?: S3Client;
  private bucket = "";
  private s3PublicPrefix?: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.driver = (this.config.get<string>("STORAGE_DRIVER") as StorageDriver) ?? "local";
    if (this.driver === "s3") {
      this.bucket = this.requireEnv("S3_BUCKET");
      this.s3 = new S3Client({
        region: this.config.get<string>("S3_REGION") ?? "auto",
        endpoint: this.config.get<string>("S3_ENDPOINT"),
        forcePathStyle: this.config.get<string>("S3_FORCE_PATH_STYLE") === "true",
        credentials: {
          accessKeyId: this.requireEnv("S3_ACCESS_KEY_ID"),
          secretAccessKey: this.requireEnv("S3_SECRET_ACCESS_KEY"),
        },
      });
      this.s3PublicPrefix = this.config.get<string>("S3_PUBLIC_URL_PREFIX");
      this.logger.log(`Storage: s3 driver, bucket=${this.bucket}`);
    } else {
      this.localDir = this.config.get<string>("UPLOAD_DIR") ?? path.join(process.cwd(), "uploads");
      if (!fs.existsSync(this.localDir)) fs.mkdirSync(this.localDir, { recursive: true });
      this.logger.log(`Storage: local driver, dir=${this.localDir}`);
    }
  }

  private requireEnv(name: string): string {
    const v = this.config.get<string>(name);
    if (!v) throw new Error(`${name} must be set when STORAGE_DRIVER=s3`);
    return v;
  }

  private randomKey(prefix: string, filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const rand = crypto.randomBytes(8).toString("hex");
    const ts = Date.now();
    return `${prefix}/${ts}-${rand}${ext}`;
  }

  async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    const key = this.randomKey(input.keyPrefix, input.filename);
    if (this.driver === "s3" && this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: input.body,
          ContentType: input.contentType,
        }),
      );
      const url = this.s3PublicPrefix
        ? `${this.s3PublicPrefix.replace(/\/$/, "")}/${key}`
        : `s3://${this.bucket}/${key}`;
      return { key, url };
    }
    const target = path.join(this.localDir, key);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, input.body);
    return { key, url: `${this.localPublicPrefix}/${key}` };
  }

  /**
   * Returns a short-lived URL an admin can use to view the file. For local
   * driver just returns the public static URL (the file is served by Nest's
   * `ServeStaticModule`-style mount). For S3 returns a pre-signed GET URL.
   */
  async getSignedViewUrl(key: string, expiresSeconds = 300): Promise<string> {
    if (this.driver === "s3" && this.s3) {
      return getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: expiresSeconds },
      );
    }
    return `${this.localPublicPrefix}/${key}`;
  }

  /**
   * For fields that store a full URL (legacy `/uploads/foo.jpg` or `s3://...`
   * or https URLs from a public prefix), return a viewable URL. Handles both
   * legacy-style stored strings and key-only storage.
   */
  async resolveUrl(storedValue: string): Promise<string> {
    if (!storedValue) return storedValue;
    if (/^https?:\/\//i.test(storedValue)) return storedValue;
    if (storedValue.startsWith(this.localPublicPrefix + "/")) return storedValue;
    // Treat as an opaque storage key.
    return this.getSignedViewUrl(storedValue);
  }
}
