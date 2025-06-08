import { format, getDaysInMonth, subDays } from "date-fns";
import { and, eq, sql, sum } from "drizzle-orm";
import { zValidator } from "@/lib/validator-wrapper";
import { Hono } from "hono";
import { z } from "zod"

import { dynamicRevenueNewSales, dynamicRevenueNewSalesPrabayar, dynamicTrxNewSales, dynamicTrxNewSalesPrabayar, summaryRevAllByLosRegional, summaryRevAllByLosBranch, summaryRevAllByLosSubbranch, summaryRevAllByLosCluster, summaryRevAllByLosKabupaten, summaryRevByuByLosRegional, summaryRevByuByLosBranch, summaryRevByuByLosSubbranch, summaryRevByuByLosCluster, summaryRevByuByLosKabupaten, feiTargetPuma } from "@/db/schema/v_honai_puma";
import { db } from "@/db";
import { Regional } from "@/types";
import { territoryArea4 } from "@/db/schema/puma_2025";
import { index, unionAll } from "drizzle-orm/mysql-core";

const app = new Hono()
    .get('/revenue-new-sales', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')

            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const trxDate = format(selectedDate, 'yyyy-MM-dd')
            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')

            const revenueNewSales = dynamicRevenueNewSales(currYear, currMonth)

            const revenueCVM = db
                .select()
                .from(revenueNewSales)
                .where(eq(revenueNewSales.transactionDate, trxDate))
                .prepare()

            const [revenues] = await Promise.all([
                revenueCVM.execute()
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
    .get('/revenue-new-sales-prabayar', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const trxDate = format(selectedDate, 'yyyy-MM-dd')
            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')

            const revenueNewSalesPrabayar = dynamicRevenueNewSalesPrabayar(currYear, currMonth)

            const revenueCVM = db
                .select()
                .from(revenueNewSalesPrabayar)
                .where(eq(revenueNewSalesPrabayar.transactionDate, trxDate))
                .prepare()

            const [revenues] = await Promise.all([
                revenueCVM.execute()
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
    .get('/trx-new-sales', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const trxDate = format(selectedDate, 'yyyy-MM-dd')
            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')

            const trxNewSales = dynamicTrxNewSales(currYear, currMonth)

            const revenueCVM = db
                .select()
                .from(trxNewSales)
                .where(eq(trxNewSales.transactionDate, trxDate))
                .prepare()

            const [revenues] = await Promise.all([
                revenueCVM.execute()
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
    .get('/trx-new-sales-prabayar', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const trxDate = format(selectedDate, 'yyyy-MM-dd')
            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')

            const trxNewSalesPrabayar = dynamicTrxNewSalesPrabayar(currYear, currMonth)

            const revenueCVM = db
                .select()
                .from(trxNewSalesPrabayar)
                .where(eq(trxNewSalesPrabayar.transactionDate, trxDate))
                .prepare()

            const [revenues] = await Promise.all([
                revenueCVM.execute()
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
    .get('/revenue-new-sales-v2', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const currDate = format(selectedDate, 'yyyy-MM-dd')
            const yyyyMM = format(selectedDate, 'yyyyMM')
            const daysInMonth = getDaysInMonth(selectedDate)
            const today = Number(format(selectedDate, 'd'))

            const regionalSubquery = db
                .select({ regional: territoryArea4.regional })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.regional)
                .as('a')

            const summaryRevRegional = db
                .select()
                .from(summaryRevAllByLosRegional, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosRegional.tgl),
                        index('regional').on(summaryRevAllByLosRegional.regional)
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosRegional.tgl, currDate),
                    eq(summaryRevAllByLosRegional.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosRegional.regional)
                .as('b')

            const regionalTargetRevenue = db
                .select({
                    regional: territoryArea4.regional,
                    target_rev_ns: sum(feiTargetPuma.rev_ns).as('target_rev_ns')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.regional)
                .as('c')

            const revenueRegional = db
                .select({
                    name: regionalSubquery.regional,
                    target_rev_ns: sql<number>`ROUND(SUM(${regionalTargetRevenue.target_rev_ns}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevRegional.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.rev_new_sales_m})/SUM(${regionalTargetRevenue.target_rev_ns}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${regionalTargetRevenue.target_rev_ns}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevRegional.rev_new_sales_m}) - SUM(${regionalTargetRevenue.target_rev_ns}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(${summaryRevRegional.rev_new_sales_mom}, '%')`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`ROUND(SUM(${summaryRevRegional.rev_new_sales_absolut}),2)`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`CONCAT(${summaryRevRegional.rev_new_sales_yoy}, '%')`.as('yoy_ns'),
                    qoq_ns: sql<string>`CONCAT(${summaryRevRegional.rev_new_sales_qoq}, '%')`.as('qoq_ns'),
                    ytd_ns: sql<string>`CONCAT(${summaryRevRegional.rev_new_sales_ytd}, '%')`.as('ytd_ns'),
                })
                .from(regionalSubquery)
                .leftJoin(summaryRevRegional, eq(regionalSubquery.regional, summaryRevRegional.regional))
                .leftJoin(regionalTargetRevenue, eq(regionalSubquery.regional, regionalTargetRevenue.regional))
                .groupBy(regionalSubquery.regional)

            const branchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'BRANCH'`,
                    target_rev_ns: sql<number>`''`.as('target_ns'),
                    rev_ns: sql<number>`''`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`''`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`''`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`''`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`''`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`''`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`''`.as('yoy_ns'),
                    qoq_ns: sql<string>`''`.as('qoq_ns'),
                    ytd_ns: sql<string>`''`.as('ytd_ns'),
                })
                .from(feiTargetPuma)

            const branchSubquery = db
                .select({ branch: territoryArea4.branch })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.branch)
                .as('a')

            const summaryRevBranch = db
                .select()
                .from(summaryRevAllByLosBranch, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosBranch.tgl),
                        index('regional').on(summaryRevAllByLosBranch.regional),
                        index('branch').on(summaryRevAllByLosBranch.branch),
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosBranch.tgl, currDate),
                    eq(summaryRevAllByLosBranch.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosBranch.branch)
                .as('b')

            const branchTargetRevenue = db
                .select({
                    branch: territoryArea4.branch,
                    target_rev_ns: sum(feiTargetPuma.rev_ns).as('target_rev_ns')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.branch)
                .as('c')

            const revenueBranch = db
                .select({
                    name: branchSubquery.branch,
                    target_rev_ns: sql<number>`ROUND(SUM(${branchTargetRevenue.target_rev_ns}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevBranch.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.rev_new_sales_m})/SUM(${branchTargetRevenue.target_rev_ns}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${branchTargetRevenue.target_rev_ns}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevBranch.rev_new_sales_m}) - SUM(${branchTargetRevenue.target_rev_ns}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(${summaryRevBranch.rev_new_sales_mom}, '%')`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`ROUND(SUM(${summaryRevBranch.rev_new_sales_absolut}),2)`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`CONCAT(${summaryRevBranch.rev_new_sales_yoy}, '%')`.as('yoy_ns'),
                    qoq_ns: sql<string>`CONCAT(${summaryRevBranch.rev_new_sales_qoq}, '%')`.as('qoq_ns'),
                    ytd_ns: sql<string>`CONCAT(${summaryRevBranch.rev_new_sales_ytd}, '%')`.as('ytd_ns'),
                })
                .from(branchSubquery)
                .leftJoin(summaryRevBranch, eq(branchSubquery.branch, summaryRevBranch.branch))
                .leftJoin(branchTargetRevenue, eq(branchSubquery.branch, branchTargetRevenue.branch))
                .groupBy(branchSubquery.branch)

            const subbranchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'SUBBRANCH'`,
                    target_rev_ns: sql<number>`''`.as('target_ns'),
                    rev_ns: sql<number>`''`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`''`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`''`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`''`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`''`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`''`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`''`.as('yoy_ns'),
                    qoq_ns: sql<string>`''`.as('qoq_ns'),
                    ytd_ns: sql<string>`''`.as('ytd_ns'),
                })
                .from(feiTargetPuma)

            const subbranchSubquery = db
                .select({ subbranch: territoryArea4.subbranch })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.subbranch)
                .as('a')

            const summaryRevSubbranch = db
                .select()
                .from(summaryRevAllByLosSubbranch, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosSubbranch.tgl),
                        index('regional').on(summaryRevAllByLosSubbranch.regional),
                        index('branch').on(summaryRevAllByLosSubbranch.branch),
                        index('subbranch').on(summaryRevAllByLosSubbranch.subbranch),
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosSubbranch.tgl, currDate),
                    eq(summaryRevAllByLosSubbranch.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosSubbranch.subbranch)
                .as('b')

            const subbranchTargetRevenue = db
                .select({
                    subbranch: territoryArea4.subbranch,
                    target_rev_ns: sum(feiTargetPuma.rev_ns).as('target_rev_ns')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.subbranch)
                .as('c')

            const revenueSubbranch = db
                .select({
                    name: subbranchSubquery.subbranch,
                    target_rev_ns: sql<number>`ROUND(SUM(${subbranchTargetRevenue.target_rev_ns}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevSubbranch.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.rev_new_sales_m})/SUM(${subbranchTargetRevenue.target_rev_ns}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${subbranchTargetRevenue.target_rev_ns}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevSubbranch.rev_new_sales_m}) - SUM(${subbranchTargetRevenue.target_rev_ns}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(${summaryRevSubbranch.rev_new_sales_mom}, '%')`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.rev_new_sales_absolut}),2)`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`CONCAT(${summaryRevSubbranch.rev_new_sales_yoy}, '%')`.as('yoy_ns'),
                    qoq_ns: sql<string>`CONCAT(${summaryRevSubbranch.rev_new_sales_qoq}, '%')`.as('qoq_ns'),
                    ytd_ns: sql<string>`CONCAT(${summaryRevSubbranch.rev_new_sales_ytd}, '%')`.as('ytd_ns'),
                })
                .from(subbranchSubquery)
                .leftJoin(summaryRevSubbranch, eq(subbranchSubquery.subbranch, summaryRevSubbranch.subbranch))
                .leftJoin(subbranchTargetRevenue, eq(subbranchSubquery.subbranch, subbranchTargetRevenue.subbranch))
                .groupBy(subbranchSubquery.subbranch)

            const clusterHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'CLUSTER'`,
                    target_rev_ns: sql<number>`''`.as('target_ns'),
                    rev_ns: sql<number>`''`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`''`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`''`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`''`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`''`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`''`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`''`.as('yoy_ns'),
                    qoq_ns: sql<string>`''`.as('qoq_ns'),
                    ytd_ns: sql<string>`''`.as('ytd_ns'),
                })
                .from(feiTargetPuma)

            const clusterSubquery = db
                .select({ cluster: territoryArea4.cluster })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.cluster)
                .as('a')

            const summaryRevCluster = db
                .select()
                .from(summaryRevAllByLosCluster, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosCluster.tgl),
                        index('regional').on(summaryRevAllByLosCluster.regional),
                        index('branch').on(summaryRevAllByLosCluster.branch),
                        index('subbranch').on(summaryRevAllByLosCluster.subbranch),
                        index('cluster').on(summaryRevAllByLosCluster.cluster),
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosCluster.tgl, currDate),
                    eq(summaryRevAllByLosCluster.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosCluster.cluster)
                .as('b')

            const clusterTargetRevenue = db
                .select({
                    cluster: territoryArea4.cluster,
                    target_rev_ns: sum(feiTargetPuma.rev_ns).as('target_rev_ns')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.cluster)
                .as('c')

            const revenueCluster = db
                .select({
                    name: clusterSubquery.cluster,
                    target_rev_ns: sql<number>`ROUND(SUM(${clusterTargetRevenue.target_rev_ns}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevCluster.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.rev_new_sales_m})/SUM(${clusterTargetRevenue.target_rev_ns}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${clusterTargetRevenue.target_rev_ns}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevCluster.rev_new_sales_m}) - SUM(${clusterTargetRevenue.target_rev_ns}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(${summaryRevCluster.rev_new_sales_mom}, '%')`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`ROUND(SUM(${summaryRevCluster.rev_new_sales_absolut}),2)`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`CONCAT(${summaryRevCluster.rev_new_sales_yoy}, '%')`.as('yoy_ns'),
                    qoq_ns: sql<string>`CONCAT(${summaryRevCluster.rev_new_sales_qoq}, '%')`.as('qoq_ns'),
                    ytd_ns: sql<string>`CONCAT(${summaryRevCluster.rev_new_sales_ytd}, '%')`.as('ytd_ns'),
                })
                .from(clusterSubquery)
                .leftJoin(summaryRevCluster, eq(clusterSubquery.cluster, summaryRevCluster.cluster))
                .leftJoin(clusterTargetRevenue, eq(clusterSubquery.cluster, clusterTargetRevenue.cluster))
                .groupBy(clusterSubquery.cluster)

            const kabupatenHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'KABUPATEN'`,
                    target_rev_ns: sql<number>`''`.as('target_ns'),
                    rev_ns: sql<number>`''`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`''`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`''`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`''`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`''`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`''`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`''`.as('yoy_ns'),
                    qoq_ns: sql<string>`''`.as('qoq_ns'),
                    ytd_ns: sql<string>`''`.as('ytd_ns'),
                })
                .from(feiTargetPuma)

            const kabupatenSubquery = db
                .select({ kabupaten: territoryArea4.kabupaten })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.kabupaten)
                .as('a')

            const summaryRevKabupaten = db
                .select()
                .from(summaryRevAllByLosKabupaten, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosKabupaten.tgl),
                        index('regional').on(summaryRevAllByLosKabupaten.regional),
                        index('branch').on(summaryRevAllByLosKabupaten.branch),
                        index('subbranch').on(summaryRevAllByLosKabupaten.subbranch),
                        index('cluster').on(summaryRevAllByLosKabupaten.cluster),
                        index('kabupaten').on(summaryRevAllByLosKabupaten.kabupaten),
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosKabupaten.tgl, currDate),
                    eq(summaryRevAllByLosKabupaten.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosKabupaten.kabupaten)
                .as('b')

            const kabupatenTargetRevenue = db
                .select({
                    kabupaten: territoryArea4.kabupaten,
                    target_rev_ns: sum(feiTargetPuma.rev_ns).as('target_rev_ns')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.kabupaten)
                .as('c')

            const revenueKabupaten = db
                .select({
                    name: kabupatenSubquery.kabupaten,
                    target_rev_ns: sql<number>`ROUND(SUM(${kabupatenTargetRevenue.target_rev_ns}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevKabupaten.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.rev_new_sales_m})/SUM(${kabupatenTargetRevenue.target_rev_ns}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${kabupatenTargetRevenue.target_rev_ns}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevKabupaten.rev_new_sales_m}) - SUM(${kabupatenTargetRevenue.target_rev_ns}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(${summaryRevKabupaten.rev_new_sales_mom}, '%')`.as('mom_ns'),
                    rev_ns_absolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.rev_new_sales_absolut}),2)`.as('rev_ns_absolut'),
                    yoy_ns: sql<string>`CONCAT(${summaryRevKabupaten.rev_new_sales_yoy}, '%')`.as('yoy_ns'),
                    qoq_ns: sql<string>`CONCAT(${summaryRevKabupaten.rev_new_sales_qoq}, '%')`.as('qoq_ns'),
                    ytd_ns: sql<string>`CONCAT(${summaryRevKabupaten.rev_new_sales_ytd}, '%')`.as('ytd_ns'),
                })
                .from(kabupatenSubquery)
                .leftJoin(summaryRevKabupaten, eq(kabupatenSubquery.kabupaten, summaryRevKabupaten.kabupaten))
                .leftJoin(kabupatenTargetRevenue, eq(kabupatenSubquery.kabupaten, kabupatenTargetRevenue.kabupaten))
                .groupBy(kabupatenSubquery.kabupaten)

            const [finalDataRevenue] = await Promise.all([
                unionAll(revenueRegional, branchHeaderQuery, revenueBranch, subbranchHeaderQuery, revenueSubbranch, clusterHeaderQuery, revenueCluster, kabupatenHeaderQuery, revenueKabupaten)
            ])

            return c.json({ data: finalDataRevenue }, 200)
        })
    .get('/revenue-new-sales-prabayar-v2', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const currDate = format(selectedDate, 'yyyy-MM-dd')
            const yyyyMM = format(selectedDate, 'yyyyMM')
            const daysInMonth = getDaysInMonth(selectedDate)
            const today = Number(format(selectedDate, 'd'))

            const regionalSubquery = db
                .select({ regional: territoryArea4.regional })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.regional)
                .as('a')

            const summaryRevRegional = db
                .select()
                .from(summaryRevAllByLosRegional, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosRegional.tgl),
                        index('regional').on(summaryRevAllByLosRegional.regional)
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosRegional.tgl, currDate),
                    eq(summaryRevAllByLosRegional.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosRegional.regional)
                .as('b')

            const regionalTargetRevenue = db
                .select({
                    regional: territoryArea4.regional,
                    target_rev_ns_prepaid: sum(feiTargetPuma.rev_ns_prepaid).as('target_rev_ns_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.regional)
                .as('c')

            const revByuRegional = db
                .select()
                .from(summaryRevByuByLosRegional)
                .where(and(
                    eq(summaryRevByuByLosRegional.tgl, currDate),
                    eq(summaryRevByuByLosRegional.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuByLosRegional.regional)
                .as('d')

            const revenueRegional = db
                .select({
                    name: regionalSubquery.regional,
                    target_rev_ns_prepaid: sql<number>`ROUND(SUM(${regionalTargetRevenue.target_rev_ns_prepaid}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevRegional.rev_new_sales_m} - ${revByuRegional.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.rev_new_sales_m} - ${revByuRegional.rev_new_sales_m})/SUM(${regionalTargetRevenue.target_rev_ns_prepaid}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.rev_new_sales_m} - ${revByuRegional.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${regionalTargetRevenue.target_rev_ns_prepaid}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevRegional.rev_new_sales_m} - ${revByuRegional.rev_new_sales_m}) - SUM(${regionalTargetRevenue.target_rev_ns_prepaid}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevRegional.rev_new_sales_mom} - ${revByuRegional.rev_new_sales_mom}),2), '%')`.as('mom_ns'),
                    yoy_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevRegional.rev_new_sales_yoy} - ${revByuRegional.rev_new_sales_yoy}),2), '%')`.as('yoy_ns'),
                    ytd_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevRegional.rev_new_sales_ytd} - ${revByuRegional.rev_new_sales_ytd}),2), '%')`.as('ytd_ns'),
                })
                .from(regionalSubquery)
                .leftJoin(summaryRevRegional, eq(regionalSubquery.regional, summaryRevRegional.regional))
                .leftJoin(regionalTargetRevenue, eq(regionalSubquery.regional, regionalTargetRevenue.regional))
                .leftJoin(revByuRegional, eq(regionalSubquery.regional, revByuRegional.regional))
                .groupBy(regionalSubquery.regional)

            const branchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'BRANCH'`,
                    target_rev_ns_prepaid: sql<number>`''`.as('target_ns'),
                    rev_ns: sql<number>`''`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`''`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`''`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`''`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`''`.as('mom_ns'),
                    yoy_ns: sql<string>`''`.as('yoy_ns'),
                    ytd_ns: sql<string>`''`.as('ytd_ns'),
                })
                .from(feiTargetPuma)

            const branchSubquery = db
                .select({ branch: territoryArea4.branch })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.branch)
                .as('a')

            const summaryRevBranch = db
                .select()
                .from(summaryRevAllByLosBranch, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosBranch.tgl),
                        index('regional').on(summaryRevAllByLosBranch.regional),
                        index('branch').on(summaryRevAllByLosBranch.branch),
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosBranch.tgl, currDate),
                    eq(summaryRevAllByLosBranch.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosBranch.branch)
                .as('b')

            const branchTargetRevenue = db
                .select({
                    branch: territoryArea4.branch,
                    target_rev_ns_prepaid: sum(feiTargetPuma.rev_ns_prepaid).as('target_rev_ns_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.branch)
                .as('c')

            const revByuBranch = db
                .select()
                .from(summaryRevByuByLosBranch)
                .where(and(
                    eq(summaryRevByuByLosBranch.tgl, currDate),
                    eq(summaryRevByuByLosBranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuByLosBranch.branch)
                .as('d')

            const revenueBranch = db
                .select({
                    name: branchSubquery.branch,
                    target_rev_ns_prepaid: sql<number>`ROUND(SUM(${branchTargetRevenue.target_rev_ns_prepaid}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevBranch.rev_new_sales_m} - ${revByuBranch.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.rev_new_sales_m} - ${revByuBranch.rev_new_sales_m})/SUM(${branchTargetRevenue.target_rev_ns_prepaid}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.rev_new_sales_m} - ${revByuBranch.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${branchTargetRevenue.target_rev_ns_prepaid}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevBranch.rev_new_sales_m} - ${revByuBranch.rev_new_sales_m}) - SUM(${branchTargetRevenue.target_rev_ns_prepaid}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevBranch.rev_new_sales_mom} - ${revByuBranch.rev_new_sales_mom}),2), '%')`.as('mom_ns'),
                    yoy_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevBranch.rev_new_sales_yoy} - ${revByuBranch.rev_new_sales_yoy}),2), '%')`.as('yoy_ns'),
                    ytd_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevBranch.rev_new_sales_ytd} - ${revByuBranch.rev_new_sales_ytd}),2), '%')`.as('ytd_ns'),
                })
                .from(branchSubquery)
                .leftJoin(summaryRevBranch, eq(branchSubquery.branch, summaryRevBranch.branch))
                .leftJoin(branchTargetRevenue, eq(branchSubquery.branch, branchTargetRevenue.branch))
                .leftJoin(revByuBranch, eq(branchSubquery.branch, revByuBranch.branch))
                .groupBy(branchSubquery.branch)

            const subbranchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'SUBBRANCH'`,
                    target_rev_ns_prepaid: sql<number>`''`.as('target_ns'),
                    rev_ns: sql<number>`''`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`''`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`''`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`''`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`''`.as('mom_ns'),
                    yoy_ns: sql<string>`''`.as('yoy_ns'),
                    ytd_ns: sql<string>`''`.as('ytd_ns'),
                })
                .from(feiTargetPuma)

            const subbranchSubquery = db
                .select({ subbranch: territoryArea4.subbranch })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.subbranch)
                .as('a')

            const summaryRevSubbranch = db
                .select()
                .from(summaryRevAllByLosSubbranch, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosSubbranch.tgl),
                        index('regional').on(summaryRevAllByLosSubbranch.regional),
                        index('branch').on(summaryRevAllByLosSubbranch.branch),
                        index('subbranch').on(summaryRevAllByLosSubbranch.subbranch),
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosSubbranch.tgl, currDate),
                    eq(summaryRevAllByLosSubbranch.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosSubbranch.subbranch)
                .as('b')

            const subbranchTargetRevenue = db
                .select({
                    subbranch: territoryArea4.subbranch,
                    target_rev_ns_prepaid: sum(feiTargetPuma.rev_ns_prepaid).as('target_rev_ns_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.subbranch)
                .as('c')

            const revByuSubbranch = db
                .select()
                .from(summaryRevByuByLosSubbranch)
                .where(and(
                    eq(summaryRevByuByLosSubbranch.tgl, currDate),
                    eq(summaryRevByuByLosSubbranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuByLosSubbranch.subbranch)
                .as('d')

            const revenueSubbranch = db
                .select({
                    name: subbranchSubquery.subbranch,
                    target_rev_ns_prepaid: sql<number>`ROUND(SUM(${subbranchTargetRevenue.target_rev_ns_prepaid}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevSubbranch.rev_new_sales_m} - ${revByuSubbranch.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.rev_new_sales_m} - ${revByuSubbranch.rev_new_sales_m})/SUM(${subbranchTargetRevenue.target_rev_ns_prepaid}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.rev_new_sales_m} - ${revByuSubbranch.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${subbranchTargetRevenue.target_rev_ns_prepaid}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevSubbranch.rev_new_sales_m} - ${revByuSubbranch.rev_new_sales_m}) - SUM(${subbranchTargetRevenue.target_rev_ns_prepaid}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevSubbranch.rev_new_sales_mom} - ${revByuSubbranch.rev_new_sales_mom}),2), '%')`.as('mom_ns'),
                    yoy_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevSubbranch.rev_new_sales_yoy} - ${revByuSubbranch.rev_new_sales_yoy}),2), '%')`.as('yoy_ns'),
                    ytd_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevSubbranch.rev_new_sales_ytd} - ${revByuSubbranch.rev_new_sales_ytd}),2), '%')`.as('ytd_ns'),
                })
                .from(subbranchSubquery)
                .leftJoin(summaryRevSubbranch, eq(subbranchSubquery.subbranch, summaryRevSubbranch.subbranch))
                .leftJoin(subbranchTargetRevenue, eq(subbranchSubquery.subbranch, subbranchTargetRevenue.subbranch))
                .leftJoin(revByuSubbranch, eq(subbranchSubquery.subbranch, revByuSubbranch.subbranch))
                .groupBy(subbranchSubquery.subbranch)

            const clusterHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'CLUSTER'`,
                    target_rev_ns_prepaid: sql<number>`''`.as('target_ns'),
                    rev_ns: sql<number>`''`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`''`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`''`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`''`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`''`.as('mom_ns'),
                    yoy_ns: sql<string>`''`.as('yoy_ns'),
                    ytd_ns: sql<string>`''`.as('ytd_ns'),
                })
                .from(feiTargetPuma)

            const clusterSubquery = db
                .select({ cluster: territoryArea4.cluster })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.cluster)
                .as('a')

            const summaryRevCluster = db
                .select()
                .from(summaryRevAllByLosCluster, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosCluster.tgl),
                        index('regional').on(summaryRevAllByLosCluster.regional),
                        index('branch').on(summaryRevAllByLosCluster.branch),
                        index('subbranch').on(summaryRevAllByLosCluster.subbranch),
                        index('cluster').on(summaryRevAllByLosCluster.cluster),
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosCluster.tgl, currDate),
                    eq(summaryRevAllByLosCluster.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosCluster.cluster)
                .as('b')

            const clusterTargetRevenue = db
                .select({
                    cluster: territoryArea4.cluster,
                    target_rev_ns_prepaid: sum(feiTargetPuma.rev_ns_prepaid).as('target_rev_ns_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.cluster)
                .as('c')

            const revByuCluster = db
                .select()
                .from(summaryRevByuByLosCluster)
                .where(and(
                    eq(summaryRevByuByLosCluster.tgl, currDate),
                    eq(summaryRevByuByLosCluster.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuByLosCluster.cluster)
                .as('d')

            const revenueCluster = db
                .select({
                    name: clusterSubquery.cluster,
                    target_rev_ns_prepaid: sql<number>`ROUND(SUM(${clusterTargetRevenue.target_rev_ns_prepaid}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevCluster.rev_new_sales_m} - ${revByuCluster.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.rev_new_sales_m} - ${revByuCluster.rev_new_sales_m})/SUM(${clusterTargetRevenue.target_rev_ns_prepaid}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.rev_new_sales_m} - ${revByuCluster.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${clusterTargetRevenue.target_rev_ns_prepaid}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevCluster.rev_new_sales_m} - ${revByuCluster.rev_new_sales_m}) - SUM(${clusterTargetRevenue.target_rev_ns_prepaid}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevCluster.rev_new_sales_mom} - ${revByuCluster.rev_new_sales_mom}),2), '%')`.as('mom_ns'),
                    yoy_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevCluster.rev_new_sales_yoy} - ${revByuCluster.rev_new_sales_yoy}),2), '%')`.as('yoy_ns'),
                    ytd_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevCluster.rev_new_sales_ytd} - ${revByuCluster.rev_new_sales_ytd}),2), '%')`.as('ytd_ns'),
                })
                .from(clusterSubquery)
                .leftJoin(summaryRevCluster, eq(clusterSubquery.cluster, summaryRevCluster.cluster))
                .leftJoin(clusterTargetRevenue, eq(clusterSubquery.cluster, clusterTargetRevenue.cluster))
                .leftJoin(revByuCluster, eq(clusterSubquery.cluster, revByuCluster.cluster))
                .groupBy(clusterSubquery.cluster)

            const kabupatenHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'KABUPATEN'`,
                    target_rev_ns_prepaid: sql<number>`''`.as('target_ns'),
                    rev_ns: sql<number>`''`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`''`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`''`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`''`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`''`.as('mom_ns'),
                    yoy_ns: sql<string>`''`.as('yoy_ns'),
                    ytd_ns: sql<string>`''`.as('ytd_ns'),
                })
                .from(feiTargetPuma)

            const kabupatenSubquery = db
                .select({ kabupaten: territoryArea4.kabupaten })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.kabupaten)
                .as('a')

            const summaryRevKabupaten = db
                .select()
                .from(summaryRevAllByLosKabupaten, {
                    useIndex: [
                        index('tgl').on(summaryRevAllByLosKabupaten.tgl),
                        index('regional').on(summaryRevAllByLosKabupaten.regional),
                        index('branch').on(summaryRevAllByLosKabupaten.branch),
                        index('subbranch').on(summaryRevAllByLosKabupaten.subbranch),
                        index('cluster').on(summaryRevAllByLosKabupaten.cluster),
                        index('kabupaten').on(summaryRevAllByLosKabupaten.kabupaten),
                    ]
                })
                .where(and(
                    eq(summaryRevAllByLosKabupaten.tgl, currDate),
                    eq(summaryRevAllByLosKabupaten.regional, 'PUMA'),
                ))
                .groupBy(summaryRevAllByLosKabupaten.kabupaten)
                .as('b')

            const kabupatenTargetRevenue = db
                .select({
                    kabupaten: territoryArea4.kabupaten,
                    target_rev_ns_prepaid: sum(feiTargetPuma.rev_ns_prepaid).as('target_rev_ns_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.kabupaten)
                .as('c')

            const revByuKabupaten = db
                .select()
                .from(summaryRevByuByLosKabupaten)
                .where(and(
                    eq(summaryRevByuByLosKabupaten.tgl, currDate),
                    eq(summaryRevByuByLosKabupaten.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuByLosKabupaten.kabupaten)
                .as('d')

            const revenueKabupaten = db
                .select({
                    name: kabupatenSubquery.kabupaten,
                    target_rev_ns_prepaid: sql<number>`ROUND(SUM(${kabupatenTargetRevenue.target_rev_ns_prepaid}),2)`.as('target_ns'),
                    rev_ns: sql<number>`ROUND(SUM(${summaryRevKabupaten.rev_new_sales_m} - ${revByuKabupaten.rev_new_sales_m}),2)`.as('rev_ns'),
                    ach_target_fm_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.rev_new_sales_m} - ${revByuKabupaten.rev_new_sales_m})/SUM(${kabupatenTargetRevenue.target_rev_ns_prepaid}))*100,2),'%')`.as('ach_target_fm_ns'),
                    drr_ns: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.rev_new_sales_m} - ${revByuKabupaten.rev_new_sales_m})/(${today}/${daysInMonth}*(SUM(${kabupatenTargetRevenue.target_rev_ns_prepaid}))))*100,2),'%')`.as('drr_ns'),
                    gap_to_target_ns: sql<number>`ROUND((COALESCE(SUM(${summaryRevKabupaten.rev_new_sales_m} - ${revByuKabupaten.rev_new_sales_m}) - SUM(${kabupatenTargetRevenue.target_rev_ns_prepaid}),0)),2)`.as('gap_to_target_ns'),
                    mom_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevKabupaten.rev_new_sales_mom} - ${revByuKabupaten.rev_new_sales_mom}),2), '%')`.as('mom_ns'),
                    yoy_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevKabupaten.rev_new_sales_yoy} - ${revByuKabupaten.rev_new_sales_yoy}),2), '%')`.as('yoy_ns'),
                    ytd_ns: sql<string>`CONCAT(ROUND(SUM(${summaryRevKabupaten.rev_new_sales_ytd} - ${revByuKabupaten.rev_new_sales_ytd}),2), '%')`.as('ytd_ns'),
                })
                .from(kabupatenSubquery)
                .leftJoin(summaryRevKabupaten, eq(kabupatenSubquery.kabupaten, summaryRevKabupaten.kabupaten))
                .leftJoin(kabupatenTargetRevenue, eq(kabupatenSubquery.kabupaten, kabupatenTargetRevenue.kabupaten))
                .leftJoin(revByuKabupaten, eq(kabupatenSubquery.kabupaten, revByuKabupaten.kabupaten))
                .groupBy(kabupatenSubquery.kabupaten)

            const [finalDataRevenue] = await Promise.all([
                unionAll(revenueRegional, branchHeaderQuery, revenueBranch, subbranchHeaderQuery, revenueSubbranch, clusterHeaderQuery, revenueCluster, kabupatenHeaderQuery, revenueKabupaten)
            ])

            return c.json({ data: finalDataRevenue }, 200)
        })

export default app