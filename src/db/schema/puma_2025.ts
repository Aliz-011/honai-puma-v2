import { mysqlSchema, varchar, decimal, index, int } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const pumaSchema = mysqlSchema("puma_2025");

export const regionals = pumaSchema.table("regionals", {
    id: varchar("id", { length: 100 }).primaryKey(),
    regional: varchar("regional", { length: 40 }).notNull(),
});

export const regionalRelations = relations(regionals, ({ many }) => ({
    branches: many(branches),
}));

export const branches = pumaSchema.table("branches_new", {
    id: varchar("id", { length: 100 }).primaryKey(),
    regionalId: varchar("id_regional", { length: 100 }).notNull(),
    branchNew: varchar("branch_new", { length: 30 }).notNull(),
}, t => [
    index('idx_regional_id').on(t.regionalId).using('btree')
]);

export const branchRelations = relations(branches, ({ one, many }) => ({
    regional: one(regionals, {
        fields: [branches.regionalId],
        references: [regionals.id],
    }),
    subbranches: many(subbranches),
    woks: many(woks)
}));

export const subbranches = pumaSchema.table("subbranches_new", {
    id: varchar("id", { length: 100 }).primaryKey(),
    branchId: varchar("id_branch", { length: 100 }).notNull(),
    subbranchNew: varchar("subbranch_new", { length: 30 }).notNull(),
}, t => [
    index('idx_branch_id').on(t.branchId).using('btree')
]);

export const subbranchRelations = relations(subbranches, ({ one, many }) => ({
    branch: one(branches, {
        fields: [subbranches.branchId],
        references: [branches.id],
    }),
    clusters: many(clusters),
}));

export const clusters = pumaSchema.table("clusters_new", {
    id: varchar("id", { length: 100 }).primaryKey(),
    subbranchId: varchar("subbranch_id", { length: 100 }).notNull(),
    cluster: varchar("cluster", { length: 30 }).notNull(),
}, t => [
    index('idx_subbranch_id').on(t.subbranchId).using('btree')
]);

export const clusterRelations = relations(clusters, ({ one, many }) => ({
    subbranch: one(subbranches, {
        fields: [clusters.subbranchId],
        references: [subbranches.id],
    }),
    kabupatens: many(kabupatens),
}));

export const kabupatens = pumaSchema.table("kabupatens", {
    id: varchar({ length: 100 }).primaryKey(),
    clusterId: varchar("id_cluster", { length: 100 }).notNull(),
    kabupaten: varchar({ length: 30 }).notNull(),
}, t => [
    index('idx_cluster_id').on(t.clusterId).using('btree')
]);

export const kabupatenRelations = relations(kabupatens, ({ one, many }) => ({
    cluster: one(clusters, {
        fields: [kabupatens.clusterId],
        references: [clusters.id],
    }),

}));

export const territoryArea4 = pumaSchema.table('teritory_area4_2023', {
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),
    cluster: varchar('cluster', { length: 100 }),
    kabupaten: varchar('kabupaten', { length: 100 }),
}, t => [
    index('teritory_area4_2023_regional_IDX').on(t.regional, t.branch, t.subbranch, t.cluster, t.kabupaten).using('btree')
])

export const territoryHousehold = pumaSchema.table('ref_teritory_household', {
    area: varchar('area', { length: 20 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    cluster: varchar('cluster', { length: 100 }),
    kabupaten: varchar('kabupaten', { length: 200 }),
    wok: varchar('wok', { length: 100 }),
    sto: varchar('sto', { length: 100 }),
    nama_sto: varchar('nama_sto', { length: 100 }),
    code_nama_sto: varchar('code_nama_sto', { length: 100 }),
})

export const territoryArea4RgbHq = pumaSchema.table('teritory_area4_2023_rgb_hq', {
    regional: varchar('regional', { length: 50 }),
    branch: varchar('branch', { length: 50 }),
    subbranch: varchar('subbranch', { length: 50 }),
    cluster: varchar('cluster', { length: 50 }),
    kabupaten: varchar('kabupaten', { length: 50 }),
}, t => ({
    teritory_area4_2023_kabupaten_IDX: index('teritory_area4_2023_kabupaten_IDX').on(t.kabupaten).using('btree')
}))

export const woks = pumaSchema.table('wok', {
    id: int().primaryKey(),
    wok: varchar({ length: 30 }).notNull(),
    branchId: varchar('branch_id', { length: 100 })
})

export const wokRelations = relations(woks, ({ one, many }) => ({
    branch: one(branches, {
        fields: [woks.branchId],
        references: [branches.id]
    }),
    stos: many(stos)
}))

export const stos = pumaSchema.table('sto', {
    id: int().primaryKey(),
    sto: varchar({ length: 4 }).notNull(),
    wokId: int('wok_id').notNull()
})

export const stoRelations = relations(stos, ({ one }) => ({
    wok: one(woks, {
        fields: [stos.wokId],
        references: [woks.id]
    })
}))

export type Kabupaten = typeof kabupatens.$inferSelect
export type Cluster = typeof clusters.$inferSelect
export type Subbranch = typeof subbranches.$inferSelect
export type Branch = typeof branches.$inferSelect
export type Regional = typeof regionals.$inferSelect