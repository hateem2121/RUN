import { Router } from "express";
import accessoriesRouter from "./accessories.js";
import categoriesRouter from "./categories.js";
import certificatesRouter from "./certificates.js";
import fabricsRouter from "./fabrics.js";
import healthRouter from "./health.js";
import materialsRouter from "./materials.js";
import productsRouter from "./products.js";
import sizeChartsRouter from "./size-charts.js";

const router = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(fabricsRouter);
router.use(materialsRouter);
router.use(certificatesRouter);
router.use(accessoriesRouter);
router.use(sizeChartsRouter);

export default router;
