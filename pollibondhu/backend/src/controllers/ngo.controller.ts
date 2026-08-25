import { Request, Response } from 'express';
import { ngoService } from '../services/ngo.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class NgoController {
  // Organisations
  async listOrganisations(req: Request, res: Response) {
    try {
      const { type, search, district } = req.query;
      const orgs = await ngoService.listOrganisations({
        type: type as string,
        search: search as string,
        district: district as string,
      });
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch organisations' });
    }
  }

  async getOrganisation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const org = await ngoService.getOrganisation(id);
      if (!org) return res.status(404).json({ error: 'Organisation not found' });
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch organisation' });
    }
  }

  async createOrganisation(req: AuthenticatedRequest, res: Response) {
    try {
      const org = await ngoService.createOrganisation(req.body);
      res.status(201).json(org);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create organisation' });
    }
  }

  async updateOrganisation(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const org = await ngoService.updateOrganisation(id, req.body);
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update organisation' });
    }
  }

  async deleteOrganisation(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await ngoService.deleteOrganisation(id);
      res.json({ message: 'Organisation deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete organisation' });
    }
  }

  // Programmes
  async listProgrammes(req: Request, res: Response) {
    try {
      const { organisation_id } = req.query;
      const programmes = await ngoService.listProgrammes(organisation_id ? parseInt(organisation_id as string) : undefined);
      res.json(programmes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch programmes' });
    }
  }

  async getProgramme(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const programme = await ngoService.getProgramme(id);
      if (!programme) return res.status(404).json({ error: 'Programme not found' });
      res.json(programme);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch programme' });
    }
  }

  async createProgramme(req: AuthenticatedRequest, res: Response) {
    try {
      const programme = await ngoService.createProgramme(req.body);
      res.status(201).json(programme);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create programme' });
    }
  }

  async updateProgramme(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const programme = await ngoService.updateProgramme(id, req.body);
      res.json(programme);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update programme' });
    }
  }

  async deleteProgramme(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await ngoService.deleteProgramme(id);
      res.json({ message: 'Programme deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete programme' });
    }
  }

  // Donations
  async listDonations(req: Request, res: Response) {
    try {
      const { organisation_id } = req.query;
      const donations = await ngoService.listDonations({
        organisation_id: organisation_id ? parseInt(organisation_id as string) : undefined,
      });
      res.json(donations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch donations' });
    }
  }

  async createDonation(req: AuthenticatedRequest, res: Response) {
    try {
      const donation = await ngoService.createDonation(req.body);
      res.status(201).json(donation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create donation' });
    }
  }

  // Stats
  async getOrganisationStats(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const stats = await ngoService.getOrganisationStats(id);
      if (!stats) return res.status(404).json({ error: 'Organisation not found' });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
}

export const ngoController = new NgoController();
