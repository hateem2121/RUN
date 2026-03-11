import { selectCategorySchema } from "@shared/index";
import { z } from "zod";

export const categoriesResponseSchema = z.array(selectCategorySchema);
