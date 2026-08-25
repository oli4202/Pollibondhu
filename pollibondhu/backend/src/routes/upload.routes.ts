import { Router } from 'express';
import multer from 'multer';
import { upload } from '../utils/upload';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/apiResponse';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File too large. Maximum size is 5MB.', 400);
        }
        return sendError(res, err.message, 400);
      }
      return sendError(res, err.message, 400);
    }

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const fileUrl = `/uploads/${req.body.entity_type || 'general'}/${req.file.filename}`;

    sendSuccess(res, {
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
    }, 'File uploaded successfully', 201);
  });
});

export default router;
