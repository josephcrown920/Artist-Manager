import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db";
import {
  GetTasksResponse,
  CreateTaskBody,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  DeleteTaskResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
    const tasks = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      status: r.status as "todo" | "in_progress" | "done",
      priority: r.priority as "low" | "medium" | "high",
      dueDate: r.dueDate ? r.dueDate.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));
    const data = GetTasksResponse.parse({ tasks });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Get tasks error");
    res.status(500).json({ error: "Failed to get tasks" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateTaskBody.parse(req.body);
    const [row] = await db.insert(tasksTable).values({
      title: body.title,
      description: body.description ?? null,
      status: "todo",
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    }).returning();

    const task = {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      status: row.status as "todo" | "in_progress" | "done",
      priority: row.priority as "low" | "medium" | "high",
      dueDate: row.dueDate ? row.dueDate.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
    res.status(201).json({ task });
  } catch (err) {
    req.log.error({ err }, "Create task error");
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdateTaskParams.parse({ id: Number(req.params.id) });
    const body = UpdateTaskBody.parse(req.body);

    const updates: Partial<typeof tasksTable.$inferInsert> = {};
    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description ?? null;
    if (body.status) updates.status = body.status;
    if (body.priority) updates.priority = body.priority;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const [row] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();

    const task = {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      status: row.status as "todo" | "in_progress" | "done",
      priority: row.priority as "low" | "medium" | "high",
      dueDate: row.dueDate ? row.dueDate.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
    const data = UpdateTaskResponse.parse({ task });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Update task error");
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteTaskParams.parse({ id: Number(req.params.id) });
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    const data = DeleteTaskResponse.parse({ success: true });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Delete task error");
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
