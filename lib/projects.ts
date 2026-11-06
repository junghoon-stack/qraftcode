import { randomUUID } from "crypto";
import { database } from "@/lib/db";

export type Project = { id: string; name: string; description: string; createdAt: string; updatedAt: string };
const toProject = (row: any): Project => ({ id: row.id, name: row.name, description: row.description, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString() });

export async function listProjects(userId: string): Promise<Project[]> {
  const rows = await database()<any[]>`select id, name, description, created_at, updated_at from projects where user_id = ${userId} order by updated_at desc limit 100`;
  return rows.map(toProject);
}

export async function createProject(userId: string, input: { name: string; description: string }): Promise<Project> {
  const id = randomUUID();
  const [row] = await database()<any[]>`insert into projects (id, user_id, name, description) values (${id}, ${userId}, ${input.name}, ${input.description}) returning id, name, description, created_at, updated_at`;
  return toProject(row);
}

export async function updateProject(userId: string, id: string, input: { name?: string; description?: string }): Promise<Project | null> {
  const [row] = await database()<any[]>`update projects set name = coalesce(${input.name ?? null}, name), description = coalesce(${input.description ?? null}, description), updated_at = now() where id = ${id} and user_id = ${userId} returning id, name, description, created_at, updated_at`;
  return row ? toProject(row) : null;
}

export async function deleteProject(userId: string, id: string): Promise<boolean> {
  const result = await database()<any[]>`delete from projects where id = ${id} and user_id = ${userId} returning id`;
  return result.length > 0;
}
