import { Router } from "express";
import accessoriesRouter from "../core/accessories.js";
import categoriesRouter from "../core/categories.js";
import certificatesRouter from "../core/certificates.js";
import fabricsRouter from "../core/fabrics.js";
import materialsRouter from "../core/materials.js";
import productsRouter from "../core/products.js";
import sizeChartsRouter from "../core/size-charts.js";

import { inquiryRoutes } from "../inquiries.js";

const router = Router();

router.use(categoriesRouter);
router.use(productsRouter);
router.use(fabricsRouter);
router.use(materialsRouter);
router.use(accessoriesRouter);
router.use(certificatesRouter);
router.use(sizeChartsRouter);

// Mount inquiry routes
router.use(inquiryRoutes);

export default router;
