import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import agentsRouter from "./agents";
import tasksRouter from "./tasks";
import engagementRouter from "./engagement";
import settingsRouter from "./manager-settings";
import adDraftsRouter from "./ad-drafts";
import growthPlaybooksRouter from "./growth-playbooks";
import playlistPitchesRouter from "./playlist-pitches";
import youtubeGrowthRouter from "./youtube-growth";
import spotifyCapiRouter from "./spotify-capi";
import creatorsRouter from "./creators";
import creatorFactoryRouter from "./creator-factory";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/agents", agentsRouter);
router.use("/tasks", tasksRouter);
router.use("/engagement", engagementRouter);
router.use("/settings", settingsRouter);
router.use("/ad-drafts", adDraftsRouter);
router.use("/growth-playbooks", growthPlaybooksRouter);
router.use("/playlists", playlistPitchesRouter);
router.use("/youtube-growth", youtubeGrowthRouter);
router.use("/spotify-capi", spotifyCapiRouter);
router.use("/creators", creatorsRouter);
router.use("/creator-factory", creatorFactoryRouter);

export default router;
