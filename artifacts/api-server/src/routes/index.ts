import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import agentsRouter from "./agents";
import tasksRouter from "./tasks";
import engagementRouter from "./engagement";
import settingsRouter from "./manager-settings";
import adDraftsRouter from "./ad-drafts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/agents", agentsRouter);
router.use("/tasks", tasksRouter);
router.use("/engagement", engagementRouter);
router.use("/settings", settingsRouter);
router.use("/ad-drafts", adDraftsRouter);

export default router;
