import { Router } from 'express';
import { metaController } from '../controllers/meta.controller';

const router = Router();

router.get('/meta/amenities', metaController.amenities);
router.get('/meta/cities', metaController.cities);

export default router;
