import { Router } from "express";
import accessoriesRouter from "./accessories.js";
import blogRouter from "./blog.js";
import categoriesRouter from "./categories.js";
import certificatesRouter from "./certificates.js";
import fabricsRouter from "./fabrics.js";
import healthRouter from "./health.js";
import inquiriesRouter from "./inquiries.js";
import legalRouter from "./legal.js";
import materialsRouter from "./materials.js";
import productsRouter from "./products.js";
import servicesRouter from "./services.js";
import sizeChartsRouter from "./size-charts.js";

const router = Router();

router.use("/health", healthRouter);
router.use(inquiriesRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(fabricsRouter);
router.use(materialsRouter);
router.use(certificatesRouter);
router.use(accessoriesRouter);
router.use(sizeChartsRouter);
router.use(servicesRouter);
router.use(legalRouter);
router.use(blogRouter);

export default router;
