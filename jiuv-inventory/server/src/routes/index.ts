import { Router } from 'express';
import authRoutes from './auth';
import beerRoutes from './beers';
import supplierRoutes from './suppliers';
import inventoryRoutes from './inventory';
import purchaseRoutes from './purchases';
import saleRoutes from './sales';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/beers', beerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/sales', saleRoutes);

export default router;
