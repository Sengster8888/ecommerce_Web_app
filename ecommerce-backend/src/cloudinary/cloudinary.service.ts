import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  uploadImage(file: any): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'ecommerce_products' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadApiResponse);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  deleteImage(publicIdOrUrl: string): Promise<any> {
    const publicId = this.extractPublicId(publicIdOrUrl);
    if (!publicId) {
      return Promise.resolve(null);
    }
    return cloudinary.uploader.destroy(publicId);
  }

  extractPublicId(urlOrId: string): string | null {
    if (!urlOrId) return null;
    if (!urlOrId.startsWith('http://') && !urlOrId.startsWith('https://')) {
      return urlOrId;
    }
    try {
      const regex = /\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/;
      const match = urlOrId.match(regex);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}
