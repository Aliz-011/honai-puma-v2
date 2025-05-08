import { format, subDays } from "date-fns";
import { eq } from "drizzle-orm";
import { zValidator } from "@/lib/validator-wrapper";
import { Hono } from "hono";
import { z } from "zod"

import { revenueCVM } from "@/db/schema/v_honai_puma";
import { db } from "@/db";
import { Regional } from "@/types";

const app = new Hono()
    .get('revenue-cvm', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 3)

            const trxDate = format(selectedDate, 'yyyy-MM-dd')

            const revenue = db
                .select()
                .from(revenueCVM)
                .where(eq(revenueCVM.transactionDate, trxDate))
                .prepare()

            const [revenues] = await Promise.all([
                revenue.execute()
            ])

            const regionalsMap = new Map()

            revenues.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: row.currentMonthRegionRevenue || 0,
                    currMonthTarget: row.regionalTargetRevenue || 0,
                    currYtdRevenue: row.ytdRegionalRevenue || 0,
                    prevYtdRevenue: row.prevYtdRegionalRevenue || 0,
                    prevMonthRevenue: row.previousMonthRegionRevenue || 0,
                    prevYearCurrMonthRevenue: row.previousYearSameMonthRegionRevenue || 0,
                    branches: new Map()
                }).get(regionalName);

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: row.currentMonthBranchRevenue || 0,
                        currMonthTarget: row.branchTargetRevenue || 0,
                        currYtdRevenue: row.ytdBranchRevenue || 0,
                        prevYtdRevenue: row.prevYtdBranchRevenue || 0,
                        prevMonthRevenue: row.previousMonthBranchRevenue || 0,
                        prevYearCurrMonthRevenue: row.previousYearSameMonthBranchRevenue || 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: row.currentMonthSubbranchRevenue || 0,
                        currMonthTarget: row.subbranchTargetRevenue || 0,
                        currYtdRevenue: row.ytdSubbranchRevenue || 0,
                        prevYtdRevenue: row.prevYtdSubbranchRevenue || 0,
                        prevMonthRevenue: row.previousMonthSubbranchRevenue || 0,
                        prevYearCurrMonthRevenue: row.previousYearSameMonthSubbranchRevenue || 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: row.currentMonthClusterRevenue || 0,
                        currMonthTarget: row.clusterTargetRevenue || 0,
                        currYtdRevenue: row.ytdClusterRevenue || 0,
                        prevYtdRevenue: row.prevYtdClusterRevenue || 0,
                        prevMonthRevenue: row.previousMonthClusterRevenue || 0,
                        prevYearCurrMonthRevenue: row.previousYearSameMonthClusterRevenue || 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));

                // Initialize kabupaten if it doesn't exist
                cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: row.currentMonthKabupatenRevenue || 0,
                        currMonthTarget: row.kabupatenTargetRevenue || 0,
                        currYtdRevenue: row.ytdKabupatenRevenue || 0,
                        prevYtdRevenue: row.prevYtdKabupatenRevenue || 0,
                        prevMonthRevenue: row.previousMonthKabupatenRevenue || 0,
                        prevYearCurrMonthRevenue: row.previousYearSameMonthKabupatenRevenue || 0,
                    }), cluster.kabupatens.get(kabupatenName));
            })

            const finalDataRevenue: Regional[] = Array.from(regionalsMap.values()).map((regional: Regional) => ({
                ...regional,
                branches: Array.from(regional.branches.values()).map((branch) => ({
                    ...branch,
                    subbranches: Array.from(branch.subbranches.values()).map((subbranch) => ({
                        ...subbranch,
                        clusters: Array.from(subbranch.clusters.values()).map((cluster) => ({
                            ...cluster,
                            kabupatens: Array.from(cluster.kabupatens.values())
                        })),
                    })),
                })),
            }));

            return c.json({ data: finalDataRevenue })
        })

export default app