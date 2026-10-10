import { Router, type IRouter } from "express";
import healthRouter from "./health";
import translationsRouter from "./translations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(translationsRouter);

export default router;
