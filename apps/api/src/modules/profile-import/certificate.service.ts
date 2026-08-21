import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  private toUserObjectId(userId: string | Types.ObjectId): Types.ObjectId {
    return Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : (userId as any);
  }

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

    const userObjectId = this.toUserObjectId(userId);
    return this.certificateModel.create({
      userId: userObjectId,
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
      status: 'Pending',
    });
  }

  list(userId: string): Promise<Certificate[]> {
    const userObjectId = this.toUserObjectId(userId);
    return this.certificateModel
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCertificateDto,
  ): Promise<Certificate> {
    const userObjectId = this.toUserObjectId(userId);
    const cert = await this.certificateModel.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { $set: dto },
      { new: true },
    );
    if (!cert) throw new NotFoundException('Certificate not found.');
    return cert;
  }

  async remove(userId: string, id: string): Promise<void> {
    const userObjectId = this.toUserObjectId(userId);
    const cert = await this.certificateModel.findOne({
      _id: id,
      userId: userObjectId,
    });
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
    const userObjectId = this.toUserObjectId(userId);
    const cert = await this.certificateModel
      .findOne({ _id: id, userId: userObjectId })
      .select('fileUrl')
      .lean();
    if (!cert?.fileUrl)
      throw new NotFoundException('Certificate file not found.');
    return cert.fileUrl;
  }

  // ───────────────────────────── Admin Methods ─────────────────────────────

  async listForAdmin(status?: string, search?: string): Promise<Certificate[]> {
    const filter: any = {};
    if (status && ['Pending', 'Verified', 'Rejected'].includes(status)) {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { organization: regex },
        { credentialId: regex },
      ];
    }

    return this.certificateModel
      .find(filter)
      .populate('userId', 'name email role avatar')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async verifyCertificate(
    id: string,
    status: 'Verified' | 'Rejected',
    reason?: string,
    adminId?: string,
  ): Promise<Certificate> {
    const cert = await this.certificateModel.findById(id);
    if (!cert) {
      throw new NotFoundException('Certificate not found.');
    }

    cert.status = status;
    cert.rejectionReason = status === 'Rejected' ? reason?.trim() : undefined;
    cert.reviewedBy =
      adminId && Types.ObjectId.isValid(adminId)
        ? new Types.ObjectId(adminId)
        : undefined;
    cert.reviewedAt = new Date();

    const saved = await cert.save();
    return this.certificateModel
      .findById(saved._id)
      .populate('userId', 'name email role avatar')
      .populate('reviewedBy', 'name email')
      .exec() as Promise<Certificate>;
  }

  async getAdminFileUrl(id: string): Promise<string> {
    const cert = await this.certificateModel
      .findById(id)
      .select('fileUrl')
      .lean();
    if (!cert?.fileUrl) {
      throw new NotFoundException('Certificate file not found.');
    }
    return cert.fileUrl;
  }
}
