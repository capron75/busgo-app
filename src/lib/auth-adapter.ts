import type { CleanedWhere, CustomAdapter } from "@better-auth/core/db/adapter";
import { createAdapterFactory } from "better-auth/adapters";
import { and, not, or } from "@prisma/orm-postgres/orm-client";
import { db } from "@/prisma/db";

const models = {
  User: db.orm.public.User,
  Session: db.orm.public.Session,
  Account: db.orm.public.Account,
  Verification: db.orm.public.Verification,
} as const;

type ModelName = keyof typeof models;

function table(model: string) {
  if (!(model in models)) {
    throw new Error(`Better Auth asked for an unknown model: ${model}`);
  }
  return models[model as ModelName] as unknown as {
    where: (predicate: (row: FieldRow) => unknown) => Query;
    select: (...fields: string[]) => Query;
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
}

type Field = {
  eq: (value: unknown) => unknown;
  neq: (value: unknown) => unknown;
  lt: (value: unknown) => unknown;
  lte: (value: unknown) => unknown;
  gt: (value: unknown) => unknown;
  gte: (value: unknown) => unknown;
  in: (value: readonly unknown[]) => unknown;
  isNull: () => unknown;
  isNotNull: () => unknown;
  like: (value: string) => unknown;
  ilike: (value: string) => unknown;
  asc: () => unknown;
  desc: () => unknown;
};

type FieldRow = Record<string, Field>;

type Query = {
  where: (predicate: (row: FieldRow) => unknown) => Query;
  orderBy: (predicate: (row: FieldRow) => unknown) => Query;
  limit: (count: number) => Query;
  offset: (count: number) => Query;
  select: (...fields: string[]) => Query;
  first: () => Promise<Record<string, unknown> | null>;
  all: () => Promise<Record<string, unknown>[]>;
  update: (data: Record<string, unknown>) => Promise<unknown>;
  delete: () => Promise<unknown>;
  aggregate: (
    select: (aggregate: { count: () => unknown }) => { total: unknown },
  ) => Promise<{ total: number } | Array<{ total: number }>>;
};

function comparison(field: Field, clause: CleanedWhere) {
  const value = clause.value;
  const text = typeof value === "string" ? value : "";
  const pattern = clause.mode === "insensitive" ? field.ilike.bind(field) : field.like.bind(field);

  switch (clause.operator) {
    case "eq":
      return value === null ? field.isNull() : field.eq(value);
    case "ne":
      return value === null ? field.isNotNull() : field.neq(value);
    case "lt":
      return field.lt(value);
    case "lte":
      return field.lte(value);
    case "gt":
      return field.gt(value);
    case "gte":
      return field.gte(value);
    case "in":
      return field.in(Array.isArray(value) ? value : [value]);
    case "not_in":
      return not(field.in(Array.isArray(value) ? value : [value]) as never);
    case "contains":
      return pattern(`%${text}%`);
    case "starts_with":
      return pattern(`${text}%`);
    case "ends_with":
      return pattern(`%${text}`);
    default:
      return field.eq(value);
  }
}

function whereClause(row: FieldRow, clauses: CleanedWhere[]) {
  const parts = clauses.map((clause) => comparison(row[clause.field], clause));
  return parts.reduce((combined, part, index) => {
    if (index === 0) return part;
    return clauses[index]?.connector === "OR"
      ? or(combined as never, part as never)
      : and(combined as never, part as never);
  });
}

function filtered(model: string, where: CleanedWhere[] | undefined) {
  const query = table(model) as unknown as Query;
  if (!where?.length) return query;
  return query.where((row) => whereClause(row, where));
}

function oneRow(result: unknown) {
  if (result == null) return null;
  if (Array.isArray(result)) return result[0] ?? null;
  return result;
}

export const authDatabase = createAdapterFactory({
  config: {
    adapterId: "prisma8",
    adapterName: "Prisma 8",
    supportsJSON: false,
    supportsDates: true,
    supportsBooleans: true,
    supportsUUIDs: false,
  },
  adapter() {
    return {
      async create({ model, data }) {
        return table(model).create(data);
      },
      async findOne({ model, where }) {
        return filtered(model, where).first();
      },
      async findMany({ model, where, limit, sortBy, offset }) {
        let query = filtered(model, where);
        if (sortBy) {
          query = query.orderBy((row) =>
            sortBy.direction === "desc" ? row[sortBy.field].desc() : row[sortBy.field].asc(),
          );
        }
        if (offset) query = query.offset(offset);
        return query.limit(limit).all();
      },
      async count({ model, where }) {
        const result = await filtered(model, where).aggregate((aggregate) => ({
          total: aggregate.count(),
        }));
        const row = Array.isArray(result) ? result[0] : result;
        return Number(row?.total ?? 0);
      },
      async update({ model, where, update }) {
        if (where.length === 0) return null;
        const result = await filtered(model, where).update(update as Record<string, unknown>);
        return oneRow(result);
      },
      async updateMany({ model, where, update }) {
        if (where.length === 0) return 0;
        const result = await filtered(model, where).update(update);
        if (Array.isArray(result)) return result.length;
        return result == null ? 0 : 1;
      },
      async delete({ model, where }) {
        if (where.length === 0) return;
        await filtered(model, where).delete();
      },
      async deleteMany({ model, where }) {
        if (where.length === 0) return 0;
        const rows = await filtered(model, where).select("id").all();
        if (rows.length === 0) return 0;
        await filtered(model, where).delete();
        return rows.length;
      },
    } as CustomAdapter;
  },
});
