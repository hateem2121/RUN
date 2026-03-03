import { z } from "zod";
import { selectCategorySchema } from "@shared/index";

export const categoriesResponseSchema = z.array(selectCategorySchema);
