/**
 * Gallery Types and Interfaces
 * Photo gallery with approval workflow for organizations
 */

export interface GalleryPhoto {
  id: string;
  organizationId: string;
  
  // Photo details
  title?: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  storagePath: string;
  
  // Upload information
  uploadedBy: string;
  uploaderName: string;
  uploaderEmail: string;
  uploadedAt: Date;
  
  // Approval workflow
  status: PhotoStatus;
  approvedBy?: string;
  approverName?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  
  // Metadata
  fileSize: number;
  fileType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  
  // Engagement
  likes: number;
  likedBy: string[];
  viewCount: number;
  viewedBy: string[]; // Array of user IDs who have viewed this photo
  
  // Organization
  tags?: string[];
  eventId?: string;
  denId?: string;
  albumId?: string; // Album/folder this photo belongs to
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export enum PhotoStatus {
  PENDING = 'pending',     // Awaiting approval
  APPROVED = 'approved',   // Visible to everyone
  REJECTED = 'rejected',   // Not visible, rejected
  FLAGGED = 'flagged'      // Flagged for review
}

export interface GalleryAlbum {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  photoCount: number;
  
  // Organization & Access
  denId?: string; // Optional: Filter to specific den
  denName?: string;
  parentAlbumId?: string; // For sub-albums/folders
  
  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Display order
  sortOrder?: number;
}

export interface PhotoUploadRequest {
  file: File;
  title?: string;
  description?: string;
  tags?: string[];
  eventId?: string;
  denId?: string;
  albumId?: string; // Optional: Add to specific album
}

export interface PhotoApprovalAction {
  photoId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

