import { Router } from "express";
import foldersRouter from "../media/folder-management.routes.js";
import mediaRoutes from "../media/index.js";

const router = Router();

router.use("/media", mediaRoutes);
router.use(foldersRouter);

export default router;
