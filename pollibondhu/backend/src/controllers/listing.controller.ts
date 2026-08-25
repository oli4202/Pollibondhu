import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ListingController {
  // Get all active listings with filters
  async getListings(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string; // BUY, SELL, RENT
      const category = req.query.category as string;
      const district = req.query.district as string;
      const search = req.query.search as string;

      const where: any = { is_active: true };
      if (type) where.type = type.toUpperCase();
      if (category) where.category = category.toUpperCase();
      if (district) where.district = district;
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                phone: true,
                district: true,
                upazila: true,
                avatar_url: true,
              },
            },
          },
        }),
        prisma.listing.count({ where }),
      ]);

      sendSuccess(res, { data, total, page, limit });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // Get a single listing by ID
  async getListing(req: Request, res: Response) {
    try {
      const listing_id = parseInt(req.params.id);
      const listing = await prisma.listing.findUnique({
        where: { listing_id },
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
              phone: true,
              district: true,
              upazila: true,
              avatar_url: true,
            },
          },
        },
      });
      if (!listing) {
        sendError(res, 'Listing not found', 404);
        return;
      }
      sendSuccess(res, listing);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // Create a new listing
  async createListing(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { title, description, type, category, price, price_type, image_url, location, district, phone } = req.body;

      if (!title || !type) {
        sendError(res, 'Title and type (BUY/SELL/RENT) are required', 400);
        return;
      }

      const listing = await prisma.listing.create({
        data: {
          user_id: userId,
          title,
          description: description || null,
          type: type.toUpperCase(),
          category: (category || 'OTHER').toUpperCase(),
          price: price || null,
          price_type: price_type || null,
          image_url: image_url || null,
          location: location || null,
          district: district || null,
          phone: phone || null,
        },
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
              phone: true,
              district: true,
            },
          },
        },
      });

      sendSuccess(res, listing, 'Listing created', 201);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // Update a listing (owner only)
  async updateListing(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const listing_id = parseInt(req.params.id);

      const existing = await prisma.listing.findUnique({ where: { listing_id } });
      if (!existing) {
        sendError(res, 'Listing not found', 404);
        return;
      }
      if (existing.user_id !== userId) {
        sendError(res, 'You can only edit your own listings', 403);
        return;
      }

      const listing = await prisma.listing.update({
        where: { listing_id },
        data: req.body,
      });
      sendSuccess(res, listing, 'Listing updated');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // Delete/deactivate a listing (owner only)
  async deleteListing(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const listing_id = parseInt(req.params.id);

      const existing = await prisma.listing.findUnique({ where: { listing_id } });
      if (!existing) {
        sendError(res, 'Listing not found', 404);
        return;
      }
      if (existing.user_id !== userId) {
        sendError(res, 'You can only delete your own listings', 403);
        return;
      }

      await prisma.listing.update({
        where: { listing_id },
        data: { is_active: false },
      });
      sendSuccess(res, null, 'Listing removed');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // Get listings by the current user
  async getMyListings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const listings = await prisma.listing.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
      sendSuccess(res, listings);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
}

export const listingController = new ListingController();
