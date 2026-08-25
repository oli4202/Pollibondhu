import { Router } from 'express';
import { listingController } from '../controllers/listing.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', (req, res) => listingController.getListings(req, res));
router.get('/:id', (req, res) => listingController.getListing(req, res));

// Protected routes (require login)
router.post('/', authMiddleware, (req, res) => listingController.createListing(req, res));
router.put('/:id', authMiddleware, (req, res) => listingController.updateListing(req, res));
router.delete('/:id', authMiddleware, (req, res) => listingController.deleteListing(req, res));
router.get('/my/listings', authMiddleware, (req, res) => listingController.getMyListings(req, res));

export default router;
