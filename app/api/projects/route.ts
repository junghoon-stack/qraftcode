import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { createProject, deleteProject, listProjects, updateProject } from "@/lib/projects";

const createSchema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(1000).default("") });
const updateSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(100).optional(), description: z.string().trim().max(1000).optional() }).refine((value) => value.name !== undefined || value.description !== undefined);

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ projects: await listProjects(user.id) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project details." }, { status: 400 });
  return NextResponse.json({ project: await createProject(user.id, parsed.data) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project details." }, { status: 400 });
  const { id, ...changes } = parsed.data;
  const project = await updateProject(user.id, id, changes);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: "Project not found." }, { status: 404 });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Valid project id required." }, { status: 400 });
  const deleted = await deleteProject(user.id, id);
  return NextResponse.json({ deleted }, { status: deleted ? 200 : 404 });
}
