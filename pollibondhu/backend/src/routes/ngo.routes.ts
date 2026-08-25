import { Router } from 'express';
import { ngoController } from '../controllers/ngo.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', (req, res) => ngoController.listOrganisations(req, res));
router.get('/:id', (req, res) => ngoController.getOrganisation(req, res));
router.get('/:id/stats', (req, res) => ngoController.getOrganisationStats(req, res));
router.get('/programmes/list', (req, res) => ngoController.listProgrammes(req, res));
router.get('/programmes/:id', (req, res) => ngoController.getProgramme(req, res));
router.get('/donations/list', (req, res) => ngoController.listDonations(req, res));

// Protected routes - Organisation management
router.post('/', authMiddleware, requirePermission('ngo.create'), (req, res) => ngoController.createOrganisation(req, res));
router.put('/:id', authMiddleware, requirePermission('ngo.update'), (req, res) => ngoController.updateOrganisation(req, res));
router.delete('/:id', authMiddleware, requirePermission('ngo.delete'), (req, res) => ngoController.deleteOrganisation(req, res));

// Programme management
router.post('/programmes', authMiddleware, requirePermission('ngo.programme.create'), (req, res) => ngoController.createProgramme(req, res));
router.put('/programmes/:id', authMiddleware, requirePermission('ngo.programme.update'), (req, res) => ngoController.updateProgramme(req, res));
router.delete('/programmes/:id', authMiddleware, requirePermission('ngo.programme.delete'), (req, res) => ngoController.deleteProgramme(req, res));

// Donations (authenticated users can donate)
router.post('/donations', authMiddleware, (req, res) => ngoController.createDonation(req, res));

export default router;
