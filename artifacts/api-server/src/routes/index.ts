import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import requestsRouter from "./requests";
import agreementsRouter from "./agreements";
import trackingRouter from "./tracking";
import ratingsRouter from "./ratings";
import disputesRouter from "./disputes";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requestsRouter);
router.use(agreementsRouter);
router.use(trackingRouter);
router.use(ratingsRouter);
router.use(disputesRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);

export default router;
