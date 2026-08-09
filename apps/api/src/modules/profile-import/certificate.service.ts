import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import {
  Certificate,
  CertificateSchema,
} from '../../schemas/certificate.schema';
import { UploadService } from '../upload/upload.service';
import { UpdateCertificateDto } from './dto/profile-import.dto';

const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<Certificate>,
    private readonly uploadService: UploadService,
  ) {}

  async upload(
    userId: string,
    file: Express.Multer.File,
    fields: {
      title?: string;
      organization?: string;
      issueDate?: string;
      expirationDate?: string;
      credentialId?: string;
      credentialUrl?: string;
    },
  ): Promise<Certificate> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No certificate file provided.');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file format. Only PDF, JPG, JPEG and PNG are allowed.',
      );
    }

    const title = fields.title?.trim();
    if (!title) {
      throw new BadRequestException('Certificate title is required.');
    }

    const { url, publicId } =
      await this.uploadService.uploadCertificateFile(file);

    return this.certificateModel.create({
      userId,
      title,
      organization: fields.organization?.trim() || undefined,
      issueDate: fields.issueDate || undefined,
      expirationDate: fields.expirationDate || undefined,
      credentialId: fields.credentialId?.trim() || undefined,
      credentialUrl: fields.credentialUrl?.trim() || undefined,
      fileUrl: url,
      fileName: file.originalname,
      fileType: file.mimetype,
      publicId,
    });
  }

  list(userId: string): Promise<Certificate[]> {
    return this.certificateModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCertificateDto,
  ): Promise<Certificate> {
    const cert = await this.certificateModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: dto },
      { new: true },
    );
    if (!cert) throw new NotFoundException('Certificate not found.');
    return cert;
  }

  async remove(userId: string, id: string): Promise<void> {
    const cert = await this.certificateModel.findOne({ _id: id, userId });
    if (!cert) throw new NotFoundException('Certificate not found.');
    if (cert.publicId) {
      try {
        await cloudinary.uploader.destroy(cert.publicId, {
          resource_type: 'image',
        });
        await cloudinary.uploader.destroy(cert.publicId, {
          resource_type: 'raw',
        });
      } catch (err: any) {
        this.logger.warn(
          `Failed to delete Cloudinary asset ${cert.publicId}: ${err.message}`,
        );
      }
    }
    await cert.deleteOne();
  }

  /** Returns the file URL for view/download. Throws if the cert isn't the user's. */
  async getFileUrl(userId: string, id: string): Promise<string> {
    const cert = await this.certificateModel
      .findOne({ _id: id, userId })
      .select('fileUrl')
      .lean();
    if (!cert?.fileUrl)
      throw new NotFoundException('Certificate file not found.');
    return cert.fileUrl;
  }
}
