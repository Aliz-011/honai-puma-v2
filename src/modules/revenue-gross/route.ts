import { format, subDays, getDaysInMonth, endOfMonth, subMonths, subYears } from "date-fns";
import { and, eq, inArray, sql, sum } from "drizzle-orm";
import { index, unionAll } from 'drizzle-orm/mysql-core'
import { Hono } from "hono";
import { z } from "zod"

import { dynamicRevenueGross, summaryRevAllRegional, summaryRevAllBranch, summaryRevAllSubbranch, summaryRevAllCluster, summaryRevAllKabupaten, feiTargetPuma, summaryRevByuRegional, summaryRevByuBranch, summaryRevByuSubbranch, summaryRevByuCluster, summaryRevByuKabupaten, summaryRevPrabayarRegional, summaryRevPrabayarBranch, summaryRevPrabayarSubbranch, summaryRevPrabayarCluster, summaryRevPrabayarKabupaten } from "@/db/schema/v_honai_puma";
import { territoryArea4 } from '@/db/schema/puma_2025'
import { db } from "@/db";
import { zValidator } from "@/lib/validator-wrapper";
import { Regional } from "@/types";

const app = new Hono()
    .get('/revenue-gross', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const trxDate = format(selectedDate, 'yyyy-MM-dd')
            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')

            const revenueGross = dynamicRevenueGross(currYear, currMonth)

            const revenueCVM = db
                .select()
                .from(revenueGross)
                .where(eq(revenueGross.processingDate, format(selectedDate, 'yyyy-MM-dd')))
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
    .get('/revenue-gross-prabayar', zValidator('query', z.object({ date: z.coerce.date().optional(), branch: z.string().optional(), subbranch: z.string().optional(), cluster: z.string().optional(), kabupaten: z.string().optional() })),
        async c => {
            const { date, branch, subbranch, cluster, kabupaten } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            const currDate = format(selectedDate, 'yyyy-MM-dd')
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');
            const yyyyMM = format(selectedDate, 'yyyyMM')
            const daysInMonth = getDaysInMonth(selectedDate)
            const today = Number(format(selectedDate, 'd'))

            const regionalSubquery = db
                .select({ regional: territoryArea4.regional })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.regional)
                .as('a')

            const revAllCurrentMonthRegional = db
                .select({
                    regional: summaryRevAllRegional.regional,
                    currentRevAllM: summaryRevAllRegional.rev_all_m,
                    currentRevAllYtd: summaryRevAllRegional.rev_all_ytd,
                })
                .from(summaryRevAllRegional)
                .where(and(
                    eq(summaryRevAllRegional.tgl, currDate),
                    eq(summaryRevAllRegional.regional, 'PUMA'),
                    eq(summaryRevAllRegional.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllRegional.regional)
                .as('rev_all_curr');

            // Subquery for ALL revenue - Previous Month
            const revAllPreviousMonthRegional = db
                .select({
                    regional: summaryRevAllRegional.regional,
                    prevRevAllM: summaryRevAllRegional.rev_all_m,
                })
                .from(summaryRevAllRegional)
                .where(and(
                    eq(summaryRevAllRegional.tgl, prevDate),
                    eq(summaryRevAllRegional.regional, 'PUMA'),
                    eq(summaryRevAllRegional.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllRegional.regional)
                .as('rev_all_prev');

            // Subquery for ALL revenue - Previous Year Same Month
            const revAllPreviousYearRegional = db
                .select({
                    regional: summaryRevAllRegional.regional,
                    prevYearRevAllM: summaryRevAllRegional.rev_all_m,
                })
                .from(summaryRevAllRegional)
                .where(and(
                    eq(summaryRevAllRegional.tgl, prevYearCurrDate),
                    eq(summaryRevAllRegional.regional, 'PUMA'),
                    eq(summaryRevAllRegional.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllRegional.regional)
                .as('rev_all_prev_year');

            // Subquery for BYU revenue - Current Month
            const revByuCurrentMonthRegional = db
                .select({
                    regional: summaryRevByuRegional.regional,
                    currentRevByuM: summaryRevByuRegional.rev_all_m,
                    currentRevByuYtd: summaryRevByuRegional.rev_all_ytd,
                })
                .from(summaryRevByuRegional)
                .where(and(
                    eq(summaryRevByuRegional.tgl, currDate),
                    eq(summaryRevByuRegional.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuRegional.regional)
                .as('rev_byu_curr');

            // Subquery for BYU revenue - Previous Month
            const revByuPreviousMonthRegional = db
                .select({
                    regional: summaryRevByuRegional.regional,
                    prevRevByuM: summaryRevByuRegional.rev_all_m,
                })
                .from(summaryRevByuRegional)
                .where(and(
                    eq(summaryRevByuRegional.tgl, prevDate),
                    eq(summaryRevByuRegional.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuRegional.regional)
                .as('rev_byu_prev');

            // Subquery for BYU revenue - Previous Year Same Month
            const revByuPreviousYearRegional = db
                .select({
                    regional: summaryRevByuRegional.regional,
                    prevYearRevByuM: summaryRevByuRegional.rev_all_m,
                })
                .from(summaryRevByuRegional)
                .where(and(
                    eq(summaryRevByuRegional.tgl, prevYearCurrDate),
                    eq(summaryRevByuRegional.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuRegional.regional)
                .as('rev_byu_prev_year');


            const regionalTargetRevenue = db
                .select({
                    regional: territoryArea4.regional,
                    targetRevPrepaid: sum(feiTargetPuma.rev_prepaid).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.regional)
                .as('c')

            const revenueRegional = db
                .select({
                    name: regionalSubquery.regional,
                    targetAll: sql<number>`ROUND(COALESCE(${regionalTargetRevenue.targetRevPrepaid}, 0), 2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(COALESCE(${revAllCurrentMonthRegional.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthRegional.currentRevByuM}, 0),2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthRegional.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthRegional.currentRevByuM}, 0)) / NULLIF(COALESCE(${regionalTargetRevenue.targetRevPrepaid}, 0), 0)) * 100,2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthRegional.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthRegional.currentRevByuM}, 0)) / (${today}/${daysInMonth} * NULLIF(COALESCE(${regionalTargetRevenue.targetRevPrepaid}, 0), 0))) * 100,2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(${revAllCurrentMonthRegional.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthRegional.currentRevByuM}, 0)) - COALESCE(${regionalTargetRevenue.targetRevPrepaid}, 0),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthRegional.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthRegional.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthRegional.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthRegional.prevRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousMonthRegional.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthRegional.prevRevByuM}, 0)),0)) * 100,2), '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthRegional.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthRegional.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousYearRegional.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearRegional.prevYearRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousYearRegional.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearRegional.prevYearRevByuM}, 0)),0)) * 100,2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(COALESCE(${revAllCurrentMonthRegional.currentRevAllYtd}, 0) - COALESCE(${revByuCurrentMonthRegional.currentRevByuYtd}, 0),2), '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND((COALESCE(${revAllCurrentMonthRegional.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthRegional.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthRegional.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthRegional.prevRevByuM}, 0)),2)`.as('rev_absolut')
                })
                .from(regionalSubquery)
                .leftJoin(revAllCurrentMonthRegional, eq(regionalSubquery.regional, revAllCurrentMonthRegional.regional))
                .leftJoin(revAllPreviousMonthRegional, eq(regionalSubquery.regional, revAllPreviousMonthRegional.regional))
                .leftJoin(revAllPreviousYearRegional, eq(regionalSubquery.regional, revAllPreviousYearRegional.regional))
                .leftJoin(revByuCurrentMonthRegional, eq(regionalSubquery.regional, revByuCurrentMonthRegional.regional))
                .leftJoin(revByuPreviousMonthRegional, eq(regionalSubquery.regional, revByuPreviousMonthRegional.regional))
                .leftJoin(revByuPreviousYearRegional, eq(regionalSubquery.regional, revByuPreviousYearRegional.regional))
                .leftJoin(regionalTargetRevenue, eq(regionalSubquery.regional, regionalTargetRevenue.regional))
                .groupBy(regionalSubquery.regional)

            const branchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'BRANCH'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revAbsolut: sql<number>`''`,
                })
                .from(feiTargetPuma)

            const branchSubquery = db
                .select({ branch: territoryArea4.branch })
                .from(territoryArea4)
                .where(and(
                    eq(territoryArea4.regional, 'PUMA'),
                    branch ? eq(territoryArea4.branch, branch) : undefined
                ))
                .groupBy(territoryArea4.branch)
                .as('a')

            const revAllCurrentMonthBranch = db
                .select({
                    branch: summaryRevAllBranch.branch,
                    currentRevAllM: summaryRevAllBranch.rev_all_m,
                    currentRevAllYtd: summaryRevAllBranch.rev_all_ytd,
                })
                .from(summaryRevAllBranch)
                .where(and(
                    eq(summaryRevAllBranch.tgl, currDate),
                    eq(summaryRevAllBranch.regional, 'PUMA'),
                    eq(summaryRevAllBranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllBranch.branch)
                .as('rev_all_curr');

            // Subquery for ALL revenue - Previous Month
            const revAllPreviousMonthBranch = db
                .select({
                    branch: summaryRevAllBranch.branch,
                    prevRevAllM: summaryRevAllBranch.rev_all_m,
                })
                .from(summaryRevAllBranch)
                .where(and(
                    eq(summaryRevAllBranch.tgl, prevDate),
                    eq(summaryRevAllBranch.regional, 'PUMA'),
                    eq(summaryRevAllBranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllBranch.branch)
                .as('rev_all_prev');

            // Subquery for ALL revenue - Previous Year Same Month
            const revAllPreviousYearBranch = db
                .select({
                    branch: summaryRevAllBranch.branch,
                    prevYearRevAllM: summaryRevAllBranch.rev_all_m,
                })
                .from(summaryRevAllBranch)
                .where(and(
                    eq(summaryRevAllBranch.tgl, prevYearCurrDate),
                    eq(summaryRevAllBranch.regional, 'PUMA'),
                    eq(summaryRevAllBranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllBranch.branch)
                .as('rev_all_prev_year');

            // Subquery for BYU revenue - Current Month
            const revByuCurrentMonthBranch = db
                .select({
                    branch: summaryRevByuBranch.branch,
                    currentRevByuM: summaryRevByuBranch.rev_all_m,
                    currentRevByuYtd: summaryRevByuBranch.rev_all_ytd,
                })
                .from(summaryRevByuBranch)
                .where(and(
                    eq(summaryRevByuBranch.tgl, currDate),
                    eq(summaryRevByuBranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuBranch.branch)
                .as('rev_byu_curr');

            // Subquery for BYU revenue - Previous Month
            const revByuPreviousMonthBranch = db
                .select({
                    branch: summaryRevByuBranch.branch,
                    prevRevByuM: summaryRevByuBranch.rev_all_m,
                })
                .from(summaryRevByuBranch)
                .where(and(
                    eq(summaryRevByuBranch.tgl, prevDate),
                    eq(summaryRevByuBranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuBranch.branch)
                .as('rev_byu_prev');

            // Subquery for BYU revenue - Previous Year Same Month
            const revByuPreviousYearBranch = db
                .select({
                    branch: summaryRevByuBranch.branch,
                    prevYearRevByuM: summaryRevByuBranch.rev_all_m,
                })
                .from(summaryRevByuBranch)
                .where(and(
                    eq(summaryRevByuBranch.tgl, prevYearCurrDate),
                    eq(summaryRevByuBranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuBranch.branch)
                .as('rev_byu_prev_year');


            const branchTargetRevenue = db
                .select({
                    branch: territoryArea4.branch,
                    targetRevPrepaid: sum(feiTargetPuma.rev_prepaid).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.branch)
                .as('c')

            const revenueBranch = db
                .select({
                    name: branchSubquery.branch,
                    targetAll: sql<number>`ROUND(COALESCE(${branchTargetRevenue.targetRevPrepaid}, 0), 2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(COALESCE(${revAllCurrentMonthBranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthBranch.currentRevByuM}, 0),2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthBranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthBranch.currentRevByuM}, 0)) / NULLIF(COALESCE(${branchTargetRevenue.targetRevPrepaid}, 0), 0)) * 100,2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthBranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthBranch.currentRevByuM}, 0)) / (${today}/${daysInMonth} * NULLIF(COALESCE(${branchTargetRevenue.targetRevPrepaid}, 0), 0))) * 100,2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(${revAllCurrentMonthBranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthBranch.currentRevByuM}, 0)) - COALESCE(${branchTargetRevenue.targetRevPrepaid}, 0),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthBranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthBranch.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthBranch.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthBranch.prevRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousMonthBranch.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthBranch.prevRevByuM}, 0)),0)) * 100,2), '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthBranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthBranch.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousYearBranch.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearBranch.prevYearRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousYearBranch.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearBranch.prevYearRevByuM}, 0)),0)) * 100,2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(COALESCE(${revAllCurrentMonthBranch.currentRevAllYtd}, 0) - COALESCE(${revByuCurrentMonthBranch.currentRevByuYtd}, 0),2), '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND((COALESCE(${revAllCurrentMonthBranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthBranch.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthBranch.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthBranch.prevRevByuM}, 0)),2)`.as('rev_absolut')
                })
                .from(branchSubquery)
                .leftJoin(revAllCurrentMonthBranch, eq(branchSubquery.branch, revAllCurrentMonthBranch.branch))
                .leftJoin(revAllPreviousMonthBranch, eq(branchSubquery.branch, revAllPreviousMonthBranch.branch))
                .leftJoin(revAllPreviousYearBranch, eq(branchSubquery.branch, revAllPreviousYearBranch.branch))
                .leftJoin(revByuCurrentMonthBranch, eq(branchSubquery.branch, revByuCurrentMonthBranch.branch))
                .leftJoin(revByuPreviousMonthBranch, eq(branchSubquery.branch, revByuPreviousMonthBranch.branch))
                .leftJoin(revByuPreviousYearBranch, eq(branchSubquery.branch, revByuPreviousYearBranch.branch))
                .leftJoin(branchTargetRevenue, eq(branchSubquery.branch, branchTargetRevenue.branch))
                .groupBy(branchSubquery.branch)

            const subbranchHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'SUBBRANCH'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revAbsolut: sql<number>`''`,
                })
                .from(feiTargetPuma)

            const subbranchSubquery = db
                .select({ subbranch: territoryArea4.subbranch })
                .from(territoryArea4)
                .where(branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch)
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch)
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.subbranch)
                .as('a')

            const revAllCurrentMonthSubbranch = db
                .select({
                    subbranch: summaryRevAllSubbranch.subbranch,
                    currentRevAllM: summaryRevAllSubbranch.rev_all_m,
                    currentRevAllYtd: summaryRevAllSubbranch.rev_all_ytd,
                })
                .from(summaryRevAllSubbranch)
                .where(and(
                    eq(summaryRevAllSubbranch.tgl, currDate),
                    eq(summaryRevAllSubbranch.regional, 'PUMA'),
                    eq(summaryRevAllSubbranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllSubbranch.subbranch)
                .as('rev_all_curr');

            // Subquery for ALL revenue - Previous Month
            const revAllPreviousMonthSubbranch = db
                .select({
                    subbranch: summaryRevAllSubbranch.subbranch,
                    prevRevAllM: summaryRevAllSubbranch.rev_all_m,
                })
                .from(summaryRevAllSubbranch)
                .where(and(
                    eq(summaryRevAllSubbranch.tgl, prevDate),
                    eq(summaryRevAllSubbranch.regional, 'PUMA'),
                    eq(summaryRevAllSubbranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllSubbranch.subbranch)
                .as('rev_all_prev');

            // Subquery for ALL revenue - Previous Year Same Month
            const revAllPreviousYearSubbranch = db
                .select({
                    subbranch: summaryRevAllSubbranch.subbranch,
                    prevYearRevAllM: summaryRevAllSubbranch.rev_all_m,
                })
                .from(summaryRevAllSubbranch)
                .where(and(
                    eq(summaryRevAllSubbranch.tgl, prevYearCurrDate),
                    eq(summaryRevAllSubbranch.regional, 'PUMA'),
                    eq(summaryRevAllSubbranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllSubbranch.subbranch)
                .as('rev_all_prev_year');

            // Subquery for BYU revenue - Current Month
            const revByuCurrentMonthSubbranch = db
                .select({
                    subbranch: summaryRevByuSubbranch.subbranch,
                    currentRevByuM: summaryRevByuSubbranch.rev_all_m,
                    currentRevByuYtd: summaryRevByuSubbranch.rev_all_ytd,
                })
                .from(summaryRevByuSubbranch)
                .where(and(
                    eq(summaryRevByuSubbranch.tgl, currDate),
                    eq(summaryRevByuSubbranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuSubbranch.subbranch)
                .as('rev_byu_curr');

            // Subquery for BYU revenue - Previous Month
            const revByuPreviousMonthSubbranch = db
                .select({
                    subbranch: summaryRevByuSubbranch.subbranch,
                    prevRevByuM: summaryRevByuSubbranch.rev_all_m,
                })
                .from(summaryRevByuSubbranch)
                .where(and(
                    eq(summaryRevByuSubbranch.tgl, prevDate),
                    eq(summaryRevByuSubbranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuSubbranch.subbranch)
                .as('rev_byu_prev');

            // Subquery for BYU revenue - Previous Year Same Month
            const revByuPreviousYearSubbranch = db
                .select({
                    subbranch: summaryRevByuSubbranch.subbranch,
                    prevYearRevByuM: summaryRevByuSubbranch.rev_all_m,
                })
                .from(summaryRevByuSubbranch)
                .where(and(
                    eq(summaryRevByuSubbranch.tgl, prevYearCurrDate),
                    eq(summaryRevByuSubbranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuSubbranch.subbranch)
                .as('rev_byu_prev_year');


            const subbranchTargetRevenue = db
                .select({
                    subbranch: territoryArea4.subbranch,
                    targetRevPrepaid: sum(feiTargetPuma.rev_prepaid).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.subbranch)
                .as('c')

            const revenueSubbranch = db
                .select({
                    name: subbranchSubquery.subbranch,
                    targetAll: sql<number>`ROUND(COALESCE(${subbranchTargetRevenue.targetRevPrepaid}, 0), 2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(COALESCE(${revAllCurrentMonthSubbranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthSubbranch.currentRevByuM}, 0),2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthSubbranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthSubbranch.currentRevByuM}, 0)) / NULLIF(COALESCE(${subbranchTargetRevenue.targetRevPrepaid}, 0), 0)) * 100,2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthSubbranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthSubbranch.currentRevByuM}, 0)) / (${today}/${daysInMonth} * NULLIF(COALESCE(${subbranchTargetRevenue.targetRevPrepaid}, 0), 0))) * 100,2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(${revAllCurrentMonthSubbranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthSubbranch.currentRevByuM}, 0)) - COALESCE(${subbranchTargetRevenue.targetRevPrepaid}, 0),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthSubbranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthSubbranch.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthSubbranch.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthSubbranch.prevRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousMonthSubbranch.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthSubbranch.prevRevByuM}, 0)),0)) * 100,2), '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthSubbranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthSubbranch.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousYearSubbranch.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearSubbranch.prevYearRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousYearSubbranch.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearSubbranch.prevYearRevByuM}, 0)),0)) * 100,2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(COALESCE(${revAllCurrentMonthSubbranch.currentRevAllYtd}, 0) - COALESCE(${revByuCurrentMonthSubbranch.currentRevByuYtd}, 0),2), '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND((COALESCE(${revAllCurrentMonthSubbranch.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthSubbranch.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthSubbranch.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthSubbranch.prevRevByuM}, 0)),2)`.as('rev_absolut')
                })
                .from(subbranchSubquery)
                .leftJoin(revAllCurrentMonthSubbranch, eq(subbranchSubquery.subbranch, revAllCurrentMonthSubbranch.subbranch))
                .leftJoin(revAllPreviousMonthSubbranch, eq(subbranchSubquery.subbranch, revAllPreviousMonthSubbranch.subbranch))
                .leftJoin(revAllPreviousYearSubbranch, eq(subbranchSubquery.subbranch, revAllPreviousYearSubbranch.subbranch))
                .leftJoin(revByuCurrentMonthSubbranch, eq(subbranchSubquery.subbranch, revByuCurrentMonthSubbranch.subbranch))
                .leftJoin(revByuPreviousMonthSubbranch, eq(subbranchSubquery.subbranch, revByuPreviousMonthSubbranch.subbranch))
                .leftJoin(revByuPreviousYearSubbranch, eq(subbranchSubquery.subbranch, revByuPreviousYearSubbranch.subbranch))
                .leftJoin(subbranchTargetRevenue, eq(subbranchSubquery.subbranch, subbranchTargetRevenue.subbranch))
                .groupBy(subbranchSubquery.subbranch)

            const clusterHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'CLUSTER'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revAbsolut: sql<number>`''`
                })
                .from(feiTargetPuma)

            const clusterSubquery = db
                .select({ cluster: territoryArea4.cluster })
                .from(territoryArea4)
                .where(branch && subbranch && cluster ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                ) : branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.cluster)
                .as('a')

            const revAllCurrentMonthCluster = db
                .select({
                    cluster: summaryRevAllCluster.cluster,
                    currentRevAllM: summaryRevAllCluster.rev_all_m,
                    currentRevAllYtd: summaryRevAllCluster.rev_all_ytd,
                })
                .from(summaryRevAllCluster)
                .where(and(
                    eq(summaryRevAllCluster.tgl, currDate),
                    eq(summaryRevAllCluster.regional, 'PUMA'),
                    eq(summaryRevAllCluster.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllCluster.cluster)
                .as('rev_all_curr');

            // Subquery for ALL revenue - Previous Month
            const revAllPreviousMonthCluster = db
                .select({
                    cluster: summaryRevAllCluster.cluster,
                    prevRevAllM: summaryRevAllCluster.rev_all_m,
                })
                .from(summaryRevAllCluster)
                .where(and(
                    eq(summaryRevAllCluster.tgl, prevDate),
                    eq(summaryRevAllCluster.regional, 'PUMA'),
                    eq(summaryRevAllCluster.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllCluster.cluster)
                .as('rev_all_prev');

            // Subquery for ALL revenue - Previous Year Same Month
            const revAllPreviousYearCluster = db
                .select({
                    cluster: summaryRevAllCluster.cluster,
                    prevYearRevAllM: summaryRevAllCluster.rev_all_m,
                })
                .from(summaryRevAllCluster)
                .where(and(
                    eq(summaryRevAllCluster.tgl, prevYearCurrDate),
                    eq(summaryRevAllCluster.regional, 'PUMA'),
                    eq(summaryRevAllCluster.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllCluster.cluster)
                .as('rev_all_prev_year');

            // Subquery for BYU revenue - Current Month
            const revByuCurrentMonthCluster = db
                .select({
                    cluster: summaryRevByuCluster.cluster,
                    currentRevByuM: summaryRevByuCluster.rev_all_m,
                    currentRevByuYtd: summaryRevByuCluster.rev_all_ytd,
                })
                .from(summaryRevByuCluster)
                .where(and(
                    eq(summaryRevByuCluster.tgl, currDate),
                    eq(summaryRevByuCluster.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuCluster.cluster)
                .as('rev_byu_curr');

            // Subquery for BYU revenue - Previous Month
            const revByuPreviousMonthCluster = db
                .select({
                    cluster: summaryRevByuCluster.cluster,
                    prevRevByuM: summaryRevByuCluster.rev_all_m,
                })
                .from(summaryRevByuCluster)
                .where(and(
                    eq(summaryRevByuCluster.tgl, prevDate),
                    eq(summaryRevByuCluster.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuCluster.cluster)
                .as('rev_byu_prev');

            // Subquery for BYU revenue - Previous Year Same Month
            const revByuPreviousYearCluster = db
                .select({
                    cluster: summaryRevByuCluster.cluster,
                    prevYearRevByuM: summaryRevByuCluster.rev_all_m,
                })
                .from(summaryRevByuCluster)
                .where(and(
                    eq(summaryRevByuCluster.tgl, prevYearCurrDate),
                    eq(summaryRevByuCluster.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuCluster.cluster)
                .as('rev_byu_prev_year');


            const clusterTargetRevenue = db
                .select({
                    cluster: territoryArea4.cluster,
                    targetRevPrepaid: sum(feiTargetPuma.rev_prepaid).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.cluster)
                .as('c')

            const revenueCluster = db
                .select({
                    name: clusterSubquery.cluster,
                    targetAll: sql<number>`ROUND(COALESCE(${clusterTargetRevenue.targetRevPrepaid}, 0), 2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(COALESCE(${revAllCurrentMonthCluster.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthCluster.currentRevByuM}, 0),2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthCluster.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthCluster.currentRevByuM}, 0)) / NULLIF(COALESCE(${clusterTargetRevenue.targetRevPrepaid}, 0), 0)) * 100,2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthCluster.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthCluster.currentRevByuM}, 0)) / (${today}/${daysInMonth} * NULLIF(COALESCE(${clusterTargetRevenue.targetRevPrepaid}, 0), 0))) * 100,2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(${revAllCurrentMonthCluster.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthCluster.currentRevByuM}, 0)) - COALESCE(${clusterTargetRevenue.targetRevPrepaid}, 0),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthCluster.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthCluster.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthCluster.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthCluster.prevRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousMonthCluster.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthCluster.prevRevByuM}, 0)),0)) * 100,2), '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthCluster.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthCluster.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousYearCluster.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearCluster.prevYearRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousYearCluster.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearCluster.prevYearRevByuM}, 0)),0)) * 100,2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(COALESCE(${revAllCurrentMonthCluster.currentRevAllYtd}, 0) - COALESCE(${revByuCurrentMonthCluster.currentRevByuYtd}, 0),2), '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND((COALESCE(${revAllCurrentMonthCluster.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthCluster.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthCluster.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthCluster.prevRevByuM}, 0)),2)`.as('rev_absolut')
                })
                .from(clusterSubquery)
                .leftJoin(revAllCurrentMonthCluster, eq(clusterSubquery.cluster, revAllCurrentMonthCluster.cluster))
                .leftJoin(revAllPreviousMonthCluster, eq(clusterSubquery.cluster, revAllPreviousMonthCluster.cluster))
                .leftJoin(revAllPreviousYearCluster, eq(clusterSubquery.cluster, revAllPreviousYearCluster.cluster))
                .leftJoin(revByuCurrentMonthCluster, eq(clusterSubquery.cluster, revByuCurrentMonthCluster.cluster))
                .leftJoin(revByuPreviousMonthCluster, eq(clusterSubquery.cluster, revByuPreviousMonthCluster.cluster))
                .leftJoin(revByuPreviousYearCluster, eq(clusterSubquery.cluster, revByuPreviousYearCluster.cluster))
                .leftJoin(clusterTargetRevenue, eq(clusterSubquery.cluster, clusterTargetRevenue.cluster))
                .groupBy(clusterSubquery.cluster)

            const kabupatenHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'KABUPATEN'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revAbsolut: sql<number>`''`
                })
                .from(feiTargetPuma)

            const kabupatenSubquery = db
                .select({ kabupaten: territoryArea4.kabupaten })
                .from(territoryArea4)
                .where(branch && subbranch && cluster && kabupaten ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                    eq(territoryArea4.kabupaten, kabupaten),
                ) : branch && subbranch && cluster ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                ) : branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.kabupaten)
                .as('a')

            const revAllCurrentMonthKabupaten = db
                .select({
                    kabupaten: summaryRevAllKabupaten.kabupaten,
                    currentRevAllM: summaryRevAllKabupaten.rev_all_m,
                    currentRevAllYtd: summaryRevAllKabupaten.rev_all_ytd,
                })
                .from(summaryRevAllKabupaten)
                .where(and(
                    eq(summaryRevAllKabupaten.tgl, currDate),
                    eq(summaryRevAllKabupaten.regional, 'PUMA'),
                    eq(summaryRevAllKabupaten.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllKabupaten.kabupaten)
                .as('rev_all_curr');

            // Subquery for ALL revenue - Previous Month
            const revAllPreviousMonthKabupaten = db
                .select({
                    kabupaten: summaryRevAllKabupaten.kabupaten,
                    prevRevAllM: summaryRevAllKabupaten.rev_all_m,
                })
                .from(summaryRevAllKabupaten)
                .where(and(
                    eq(summaryRevAllKabupaten.tgl, prevDate),
                    eq(summaryRevAllKabupaten.regional, 'PUMA'),
                    eq(summaryRevAllKabupaten.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllKabupaten.kabupaten)
                .as('rev_all_prev');

            // Subquery for ALL revenue - Previous Year Same Month
            const revAllPreviousYearKabupaten = db
                .select({
                    kabupaten: summaryRevAllKabupaten.kabupaten,
                    prevYearRevAllM: summaryRevAllKabupaten.rev_all_m,
                })
                .from(summaryRevAllKabupaten)
                .where(and(
                    eq(summaryRevAllKabupaten.tgl, prevYearCurrDate),
                    eq(summaryRevAllKabupaten.regional, 'PUMA'),
                    eq(summaryRevAllKabupaten.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllKabupaten.kabupaten)
                .as('rev_all_prev_year');

            // Subquery for BYU revenue - Current Month
            const revByuCurrentMonthKabupaten = db
                .select({
                    kabupaten: summaryRevByuKabupaten.kabupaten,
                    currentRevByuM: summaryRevByuKabupaten.rev_all_m,
                    currentRevByuYtd: summaryRevByuKabupaten.rev_all_ytd,
                })
                .from(summaryRevByuKabupaten)
                .where(and(
                    eq(summaryRevByuKabupaten.tgl, currDate),
                    eq(summaryRevByuKabupaten.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuKabupaten.kabupaten)
                .as('rev_byu_curr');

            // Subquery for BYU revenue - Previous Month
            const revByuPreviousMonthKabupaten = db
                .select({
                    kabupaten: summaryRevByuKabupaten.kabupaten,
                    prevRevByuM: summaryRevByuKabupaten.rev_all_m,
                })
                .from(summaryRevByuKabupaten)
                .where(and(
                    eq(summaryRevByuKabupaten.tgl, prevDate),
                    eq(summaryRevByuKabupaten.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuKabupaten.kabupaten)
                .as('rev_byu_prev');

            // Subquery for BYU revenue - Previous Year Same Month
            const revByuPreviousYearKabupaten = db
                .select({
                    kabupaten: summaryRevByuKabupaten.kabupaten,
                    prevYearRevByuM: summaryRevByuKabupaten.rev_all_m,
                })
                .from(summaryRevByuKabupaten)
                .where(and(
                    eq(summaryRevByuKabupaten.tgl, prevYearCurrDate),
                    eq(summaryRevByuKabupaten.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuKabupaten.kabupaten)
                .as('rev_byu_prev_year');


            const kabupatenTargetRevenue = db
                .select({
                    kabupaten: territoryArea4.kabupaten,
                    targetRevPrepaid: sum(feiTargetPuma.rev_prepaid).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.kabupaten)
                .as('c')

            const revenueKabupaten = db
                .select({
                    name: kabupatenSubquery.kabupaten,
                    targetAll: sql<number>`ROUND(COALESCE(${kabupatenTargetRevenue.targetRevPrepaid}, 0), 2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(COALESCE(${revAllCurrentMonthKabupaten.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthKabupaten.currentRevByuM}, 0),2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthKabupaten.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthKabupaten.currentRevByuM}, 0)) / NULLIF(COALESCE(${kabupatenTargetRevenue.targetRevPrepaid}, 0), 0)) * 100,2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND(((COALESCE(${revAllCurrentMonthKabupaten.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthKabupaten.currentRevByuM}, 0)) / (${today}/${daysInMonth} * NULLIF(COALESCE(${kabupatenTargetRevenue.targetRevPrepaid}, 0), 0))) * 100,2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(${revAllCurrentMonthKabupaten.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthKabupaten.currentRevByuM}, 0)) - COALESCE(${kabupatenTargetRevenue.targetRevPrepaid}, 0),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthKabupaten.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthKabupaten.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthKabupaten.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthKabupaten.prevRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousMonthKabupaten.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthKabupaten.prevRevByuM}, 0)),0)) * 100,2), '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(ROUND((((COALESCE(${revAllCurrentMonthKabupaten.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthKabupaten.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousYearKabupaten.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearKabupaten.prevYearRevByuM}, 0))) / NULLIF((COALESCE(${revAllPreviousYearKabupaten.prevYearRevAllM}, 0) - COALESCE(${revByuPreviousYearKabupaten.prevYearRevByuM}, 0)),0)) * 100,2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(COALESCE(${revAllCurrentMonthKabupaten.currentRevAllYtd}, 0) - COALESCE(${revByuCurrentMonthKabupaten.currentRevByuYtd}, 0),2), '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND((COALESCE(${revAllCurrentMonthKabupaten.currentRevAllM}, 0) - COALESCE(${revByuCurrentMonthKabupaten.currentRevByuM}, 0)) - (COALESCE(${revAllPreviousMonthKabupaten.prevRevAllM}, 0) - COALESCE(${revByuPreviousMonthKabupaten.prevRevByuM}, 0)),2)`.as('rev_absolut')
                })
                .from(kabupatenSubquery)
                .leftJoin(revAllCurrentMonthKabupaten, eq(kabupatenSubquery.kabupaten, revAllCurrentMonthKabupaten.kabupaten))
                .leftJoin(revAllPreviousMonthKabupaten, eq(kabupatenSubquery.kabupaten, revAllPreviousMonthKabupaten.kabupaten))
                .leftJoin(revAllPreviousYearKabupaten, eq(kabupatenSubquery.kabupaten, revAllPreviousYearKabupaten.kabupaten))
                .leftJoin(revByuCurrentMonthKabupaten, eq(kabupatenSubquery.kabupaten, revByuCurrentMonthKabupaten.kabupaten))
                .leftJoin(revByuPreviousMonthKabupaten, eq(kabupatenSubquery.kabupaten, revByuPreviousMonthKabupaten.kabupaten))
                .leftJoin(revByuPreviousYearKabupaten, eq(kabupatenSubquery.kabupaten, revByuPreviousYearKabupaten.kabupaten))
                .leftJoin(kabupatenTargetRevenue, eq(kabupatenSubquery.kabupaten, kabupatenTargetRevenue.kabupaten))
                .groupBy(kabupatenSubquery.kabupaten)

            const [finalDataRevenue] = await Promise.all([
                unionAll(revenueRegional, branchHeaderQuery, revenueBranch, subbranchHeaderQuery, revenueSubbranch, clusterHeaderQuery, revenueCluster, kabupatenHeaderQuery, revenueKabupaten)
            ])

            return c.json({ data: finalDataRevenue }, 200)
        })
    .get('/revenue-byu', zValidator('query', z.object({ date: z.coerce.date().optional(), branch: z.string().optional(), subbranch: z.string().optional(), cluster: z.string().optional(), kabupaten: z.string().optional() })),
        async c => {
            const { date, branch, subbranch, cluster, kabupaten } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);

            const currDate = format(selectedDate, 'yyyy-MM-dd')
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
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
                .select({
                    regional: summaryRevByuRegional.regional,
                    revAllM: sql<number>`SUM(CASE WHEN ${summaryRevByuRegional.tgl} = ${currDate} THEN ${summaryRevByuRegional.rev_all_m} ELSE 0 END)`.as('revAllM'),
                    revAllMom: sql<number>`SUM(CASE WHEN ${summaryRevByuRegional.tgl} = ${currDate} THEN ${summaryRevByuRegional.rev_all_mom} ELSE 0 END)`.as('revAllMom'),
                    revAllYoy: sql<number>`SUM(CASE WHEN ${summaryRevByuRegional.tgl} = ${currDate} THEN ${summaryRevByuRegional.rev_all_yoy} ELSE 0 END)`.as('revAllYoy'),
                    revAllYtd: sql<number>`SUM(CASE WHEN ${summaryRevByuRegional.tgl} = ${currDate} THEN ${summaryRevByuRegional.rev_all_ytd} ELSE 0 END)`.as('revAllYtd'),
                    revAllM1: sql<number>`SUM(CASE WHEN ${summaryRevByuRegional.tgl} = ${prevDate} THEN ${summaryRevByuRegional.rev_all_m} ELSE 0 END)`.as('revAllM1'),
                    revAllMom1: sql<number>`SUM(CASE WHEN ${summaryRevByuRegional.tgl} = ${prevDate} THEN ${summaryRevByuRegional.rev_all_mom} ELSE 0 END)`.as('revAllMom1'),
                    revAllYoy1: sql<number>`SUM(CASE WHEN ${summaryRevByuRegional.tgl} = ${prevDate} THEN ${summaryRevByuRegional.rev_all_yoy} ELSE 0 END)`.as('revAllYoy1'),
                    revAllYtd1: sql<number>`SUM(CASE WHEN ${summaryRevByuRegional.tgl} = ${prevDate} THEN ${summaryRevByuRegional.rev_all_ytd} ELSE 0 END)`.as('revAllYtd1'),
                })
                .from(summaryRevByuRegional)
                .where(eq(summaryRevByuRegional.regional, 'PUMA'))
                .groupBy(summaryRevByuRegional.regional)
                .as('b')

            const regionalTargetRevenue = db
                .select({
                    regional: territoryArea4.regional,
                    targetRevAll: sum(feiTargetPuma.rev_byu).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.regional)
                .as('c')

            const revenueRegional = db
                .select({
                    name: regionalSubquery.regional,
                    targetAll: sql<number>`ROUND(SUM(${regionalTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevRegional.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revAllM})/SUM(${regionalTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revAllM})/(${today}/${daysInMonth}*(SUM(${regionalTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevRegional.revAllM}) - SUM(${regionalTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevRegional.revAllMom}, '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(${summaryRevRegional.revAllYoy}, '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevRegional.revAllYtd}, '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revAllM} - ${summaryRevRegional.revAllM1}), 2)`.as('rev_absolut')
                })
                .from(regionalSubquery)
                .leftJoin(summaryRevRegional, eq(regionalSubquery.regional, summaryRevRegional.regional))
                .leftJoin(regionalTargetRevenue, eq(regionalSubquery.regional, regionalTargetRevenue.regional))
                .groupBy(regionalSubquery.regional)

            const branchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'BRANCH'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revAbsolut: sql<number>`''`
                })
                .from(feiTargetPuma)

            const branchSubquery = db
                .select({ branch: territoryArea4.branch })
                .from(territoryArea4)
                .where(and(
                    eq(territoryArea4.regional, 'PUMA'),
                    branch ? eq(territoryArea4.branch, branch) : undefined
                ))
                .groupBy(territoryArea4.branch)
                .as('a')

            const summaryRevBranch = db
                .select({
                    branch: summaryRevByuBranch.branch,
                    revAllM: sql<number>`SUM(CASE WHEN ${summaryRevByuBranch.tgl} = ${currDate} THEN ${summaryRevByuBranch.rev_all_m} ELSE 0 END)`.as('revAllM'),
                    revAllMom: sql<number>`SUM(CASE WHEN ${summaryRevByuBranch.tgl} = ${currDate} THEN ${summaryRevByuBranch.rev_all_mom} ELSE 0 END)`.as('revAllMom'),
                    revAllYoy: sql<number>`SUM(CASE WHEN ${summaryRevByuBranch.tgl} = ${currDate} THEN ${summaryRevByuBranch.rev_all_yoy} ELSE 0 END)`.as('revAllYoy'),
                    revAllYtd: sql<number>`SUM(CASE WHEN ${summaryRevByuBranch.tgl} = ${currDate} THEN ${summaryRevByuBranch.rev_all_ytd} ELSE 0 END)`.as('revAllYtd'),
                    revAllM1: sql<number>`SUM(CASE WHEN ${summaryRevByuBranch.tgl} = ${prevDate} THEN ${summaryRevByuBranch.rev_all_m} ELSE 0 END)`.as('revAllM1'),
                    revAllMom1: sql<number>`SUM(CASE WHEN ${summaryRevByuBranch.tgl} = ${prevDate} THEN ${summaryRevByuBranch.rev_all_mom} ELSE 0 END)`.as('revAllMom1'),
                    revAllYoy1: sql<number>`SUM(CASE WHEN ${summaryRevByuBranch.tgl} = ${prevDate} THEN ${summaryRevByuBranch.rev_all_yoy} ELSE 0 END)`.as('revAllYoy1'),
                    revAllYtd1: sql<number>`SUM(CASE WHEN ${summaryRevByuBranch.tgl} = ${prevDate} THEN ${summaryRevByuBranch.rev_all_ytd} ELSE 0 END)`.as('revAllYtd1'),
                })
                .from(summaryRevByuBranch)
                .where(eq(summaryRevByuBranch.regional, 'PUMA'))
                .groupBy(summaryRevByuBranch.branch)
                .as('b')

            const branchTargetRevenue = db
                .select({
                    branch: territoryArea4.branch,
                    targetRevAll: sum(feiTargetPuma.rev_byu).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.branch)
                .as('c')

            const revenueBranch = db
                .select({
                    name: branchSubquery.branch,
                    targetAll: sql<number>`ROUND(SUM(${branchTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevBranch.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revAllM})/SUM(${branchTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revAllM})/(${today}/${daysInMonth}*(SUM(${branchTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevBranch.revAllM}) - SUM(${branchTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevBranch.revAllMom}, '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(${summaryRevBranch.revAllYoy}, '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevBranch.revAllYtd}, '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revAllM} - ${summaryRevBranch.revAllM1}), 2)`.as('rev_absolut')
                })
                .from(branchSubquery)
                .leftJoin(summaryRevBranch, eq(branchSubquery.branch, summaryRevBranch.branch))
                .leftJoin(branchTargetRevenue, eq(branchSubquery.branch, branchTargetRevenue.branch))
                .groupBy(branchSubquery.branch)

            const subbranchHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'SUBBRANCH'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revAbsolut: sql<number>`''`
                })
                .from(feiTargetPuma)

            const subbranchSubquery = db
                .select({ subbranch: territoryArea4.subbranch })
                .from(territoryArea4)
                .where(branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch)
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch)
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.subbranch)
                .as('a')

            const summaryRevSubbranch = db
                .select({
                    subbranch: summaryRevByuSubbranch.subbranch,
                    revAllM: sql<number>`SUM(CASE WHEN ${summaryRevByuSubbranch.tgl} = ${currDate} THEN ${summaryRevByuSubbranch.rev_all_m} ELSE 0 END)`.as('revAllM'),
                    revAllMom: sql<number>`SUM(CASE WHEN ${summaryRevByuSubbranch.tgl} = ${currDate} THEN ${summaryRevByuSubbranch.rev_all_mom} ELSE 0 END)`.as('revAllMom'),
                    revAllYoy: sql<number>`SUM(CASE WHEN ${summaryRevByuSubbranch.tgl} = ${currDate} THEN ${summaryRevByuSubbranch.rev_all_yoy} ELSE 0 END)`.as('revAllYoy'),
                    revAllYtd: sql<number>`SUM(CASE WHEN ${summaryRevByuSubbranch.tgl} = ${currDate} THEN ${summaryRevByuSubbranch.rev_all_ytd} ELSE 0 END)`.as('revAllYtd'),
                    revAllM1: sql<number>`SUM(CASE WHEN ${summaryRevByuSubbranch.tgl} = ${prevDate} THEN ${summaryRevByuSubbranch.rev_all_m} ELSE 0 END)`.as('revAllM1'),
                    revAllMom1: sql<number>`SUM(CASE WHEN ${summaryRevByuSubbranch.tgl} = ${prevDate} THEN ${summaryRevByuSubbranch.rev_all_mom} ELSE 0 END)`.as('revAllMom1'),
                    revAllYoy1: sql<number>`SUM(CASE WHEN ${summaryRevByuSubbranch.tgl} = ${prevDate} THEN ${summaryRevByuSubbranch.rev_all_yoy} ELSE 0 END)`.as('revAllYoy1'),
                    revAllYtd1: sql<number>`SUM(CASE WHEN ${summaryRevByuSubbranch.tgl} = ${prevDate} THEN ${summaryRevByuSubbranch.rev_all_ytd} ELSE 0 END)`.as('revAllYtd1'),
                })
                .from(summaryRevByuSubbranch)
                .where(and(
                    eq(summaryRevByuSubbranch.tgl, currDate),
                    eq(summaryRevByuSubbranch.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuSubbranch.subbranch)
                .as('b')

            const subbranchTargetRevenue = db
                .select({
                    subbranch: territoryArea4.subbranch,
                    targetRevAll: sum(feiTargetPuma.rev_byu).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.subbranch)
                .as('c')

            const revenueSubbranch = db
                .select({
                    name: subbranchSubquery.subbranch,
                    targetAll: sql<number>`ROUND(SUM(${subbranchTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevSubbranch.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revAllM})/SUM(${subbranchTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revAllM})/(${today}/${daysInMonth}*(SUM(${subbranchTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevSubbranch.revAllM}) - SUM(${subbranchTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevSubbranch.revAllMom}, '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(${summaryRevSubbranch.revAllYoy}, '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevSubbranch.revAllYtd}, '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revAllM} - ${summaryRevSubbranch.revAllM1}), 2)`.as('rev_absolut')
                })
                .from(subbranchSubquery)
                .leftJoin(summaryRevSubbranch, eq(subbranchSubquery.subbranch, summaryRevSubbranch.subbranch))
                .leftJoin(subbranchTargetRevenue, eq(subbranchSubquery.subbranch, subbranchTargetRevenue.subbranch))
                .groupBy(subbranchSubquery.subbranch)

            const clusterHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'CLUSTER'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revAbsolut: sql<number>`''`
                })
                .from(feiTargetPuma)

            const clusterSubquery = db
                .select({ cluster: territoryArea4.cluster })
                .from(territoryArea4)
                .where(branch && subbranch && cluster ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                ) : branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.cluster)
                .as('a')

            const summaryRevCluster = db
                .select({
                    cluster: summaryRevByuCluster.cluster,
                    revAllM: sql<number>`SUM(CASE WHEN ${summaryRevByuCluster.tgl} = ${currDate} THEN ${summaryRevByuCluster.rev_all_m} ELSE 0 END)`.as('revAllM'),
                    revAllMom: sql<number>`SUM(CASE WHEN ${summaryRevByuCluster.tgl} = ${currDate} THEN ${summaryRevByuCluster.rev_all_mom} ELSE 0 END)`.as('revAllMom'),
                    revAllYoy: sql<number>`SUM(CASE WHEN ${summaryRevByuCluster.tgl} = ${currDate} THEN ${summaryRevByuCluster.rev_all_yoy} ELSE 0 END)`.as('revAllYoy'),
                    revAllYtd: sql<number>`SUM(CASE WHEN ${summaryRevByuCluster.tgl} = ${currDate} THEN ${summaryRevByuCluster.rev_all_ytd} ELSE 0 END)`.as('revAllYtd'),
                    revAllM1: sql<number>`SUM(CASE WHEN ${summaryRevByuCluster.tgl} = ${prevDate} THEN ${summaryRevByuCluster.rev_all_m} ELSE 0 END)`.as('revAllM1'),
                    revAllMom1: sql<number>`SUM(CASE WHEN ${summaryRevByuCluster.tgl} = ${prevDate} THEN ${summaryRevByuCluster.rev_all_mom} ELSE 0 END)`.as('revAllMom1'),
                    revAllYoy1: sql<number>`SUM(CASE WHEN ${summaryRevByuCluster.tgl} = ${prevDate} THEN ${summaryRevByuCluster.rev_all_yoy} ELSE 0 END)`.as('revAllYoy1'),
                    revAllYtd1: sql<number>`SUM(CASE WHEN ${summaryRevByuCluster.tgl} = ${prevDate} THEN ${summaryRevByuCluster.rev_all_ytd} ELSE 0 END)`.as('revAllYtd1'),
                })
                .from(summaryRevByuCluster)
                .where(and(
                    eq(summaryRevByuCluster.tgl, currDate),
                    eq(summaryRevByuCluster.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuCluster.cluster)
                .as('b')

            const clusterTargetRevenue = db
                .select({
                    cluster: territoryArea4.cluster,
                    targetRevAll: sum(feiTargetPuma.rev_byu).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.cluster)
                .as('c')

            const revenueCluster = db
                .select({
                    name: clusterSubquery.cluster,
                    targetAll: sql<number>`ROUND(SUM(${clusterTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevCluster.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revAllM})/SUM(${clusterTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revAllM})/(${today}/${daysInMonth}*(SUM(${clusterTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevCluster.revAllM}) - SUM(${clusterTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevCluster.revAllMom}, '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(${summaryRevCluster.revAllYoy}, '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevCluster.revAllYtd}, '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revAllM} - ${summaryRevSubbranch.revAllM1}), 2)`.as('rev_absolut')
                })
                .from(clusterSubquery)
                .leftJoin(summaryRevCluster, eq(clusterSubquery.cluster, summaryRevCluster.cluster))
                .leftJoin(clusterTargetRevenue, eq(clusterSubquery.cluster, clusterTargetRevenue.cluster))
                .groupBy(clusterSubquery.cluster)

            const kabupatenHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'KABUPATEN'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revAbsolut: sql<number>`''`
                })
                .from(feiTargetPuma)

            const kabupatenSubquery = db
                .select({ kabupaten: territoryArea4.kabupaten })
                .from(territoryArea4)
                .where(branch && subbranch && cluster && kabupaten ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                    eq(territoryArea4.kabupaten, kabupaten),
                ) : branch && subbranch && cluster ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                ) : branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.kabupaten)
                .as('a')

            const summaryRevKabupaten = db
                .select({
                    kabupaten: summaryRevByuKabupaten.kabupaten,
                    revAllM: sql<number>`SUM(CASE WHEN ${summaryRevByuKabupaten.tgl} = ${currDate} THEN ${summaryRevByuKabupaten.rev_all_m} ELSE 0 END)`.as('revAllM'),
                    revAllMom: sql<number>`SUM(CASE WHEN ${summaryRevByuKabupaten.tgl} = ${currDate} THEN ${summaryRevByuKabupaten.rev_all_mom} ELSE 0 END)`.as('revAllMom'),
                    revAllYoy: sql<number>`SUM(CASE WHEN ${summaryRevByuKabupaten.tgl} = ${currDate} THEN ${summaryRevByuKabupaten.rev_all_yoy} ELSE 0 END)`.as('revAllYoy'),
                    revAllYtd: sql<number>`SUM(CASE WHEN ${summaryRevByuKabupaten.tgl} = ${currDate} THEN ${summaryRevByuKabupaten.rev_all_ytd} ELSE 0 END)`.as('revAllYtd'),
                    revAllM1: sql<number>`SUM(CASE WHEN ${summaryRevByuKabupaten.tgl} = ${prevDate} THEN ${summaryRevByuKabupaten.rev_all_m} ELSE 0 END)`.as('revAllM1'),
                    revAllMom1: sql<number>`SUM(CASE WHEN ${summaryRevByuKabupaten.tgl} = ${prevDate} THEN ${summaryRevByuKabupaten.rev_all_mom} ELSE 0 END)`.as('revAllMom1'),
                    revAllYoy1: sql<number>`SUM(CASE WHEN ${summaryRevByuKabupaten.tgl} = ${prevDate} THEN ${summaryRevByuKabupaten.rev_all_yoy} ELSE 0 END)`.as('revAllYoy1'),
                    revAllYtd1: sql<number>`SUM(CASE WHEN ${summaryRevByuKabupaten.tgl} = ${prevDate} THEN ${summaryRevByuKabupaten.rev_all_ytd} ELSE 0 END)`.as('revAllYtd1'),
                })
                .from(summaryRevByuKabupaten)
                .where(and(
                    eq(summaryRevByuKabupaten.tgl, currDate),
                    eq(summaryRevByuKabupaten.regional, 'PUMA')
                ))
                .groupBy(summaryRevByuKabupaten.kabupaten)
                .as('b')

            const kabupatenTargetRevenue = db
                .select({
                    kabupaten: territoryArea4.kabupaten,
                    targetRevAll: sum(feiTargetPuma.rev_byu).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.kabupaten)
                .as('c')

            const revenueKabupaten = db
                .select({
                    name: kabupatenSubquery.kabupaten,
                    targetAll: sql<number>`ROUND(SUM(${kabupatenTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevKabupaten.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revAllM})/SUM(${kabupatenTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revAllM})/(${today}/${daysInMonth}*(SUM(${kabupatenTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevKabupaten.revAllM}) - SUM(${kabupatenTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevKabupaten.revAllMom}, '%')`.as('mom_all'),
                    yoyAll: sql<string>`CONCAT(${summaryRevKabupaten.revAllYoy}, '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevKabupaten.revAllYtd}, '%')`.as('ytd_all'),
                    revAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revAllM} - ${summaryRevKabupaten.revAllM1}), 2)`.as('rev_absolut')
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
    .get('/revenue-byu-v2', zValidator('query', z.object({ date: z.coerce.date().optional(), branch: z.string().optional(), subbranch: z.string().optional(), cluster: z.string().optional(), kabupaten: z.string().optional() })),
        async c => {
            const { date, branch, subbranch, cluster, kabupaten } = c.req.valid('query')
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
                .select({
                    regional: summaryRevAllRegional.regional,
                    revAllM: summaryRevAllRegional.rev_all_m,
                    revAllMom: summaryRevAllRegional.rev_all_mom,
                    revAllAbsolut: summaryRevAllRegional.rev_all_absolut,
                    revAllYoy: summaryRevAllRegional.rev_all_yoy,
                    revAllYtd: summaryRevAllRegional.rev_all_ytd,
                    revAllQoq: summaryRevAllRegional.rev_all_qoq,
                    revBBM: summaryRevAllRegional.rev_bb_m,
                    revBBMom: summaryRevAllRegional.rev_bb_mom,
                    revBBAbsolut: summaryRevAllRegional.rev_bb_absolut,
                    revBBYoy: summaryRevAllRegional.rev_bb_yoy,
                    revBBYtd: summaryRevAllRegional.rev_bb_ytd,
                    revBBQoq: summaryRevAllRegional.rev_bb_qoq,
                    revVoiceM: summaryRevAllRegional.rev_voice_m,
                    revVoiceMom: summaryRevAllRegional.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllRegional.rev_voice_absol,
                    revVoiceYoy: summaryRevAllRegional.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllRegional.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllRegional.rev_voice_qoq,
                    revDigitalM: summaryRevAllRegional.rev_digital_m,
                    revDigitalMom: summaryRevAllRegional.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllRegional.rev_digital_absol,
                    revDigitalYoy: summaryRevAllRegional.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllRegional.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllRegional.rev_digital_qoq,
                    revSmSM: summaryRevAllRegional.rev_sms_m,
                    revSmSMom: summaryRevAllRegional.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllRegional.rev_sms_absolut,
                    revSmSYoy: summaryRevAllRegional.rev_sms_yoy,
                    revSmSYtd: summaryRevAllRegional.rev_sms_ytd,
                    revSmSQoq: summaryRevAllRegional.rev_sms_qoq,
                })
                .from(summaryRevAllRegional, { useIndex: index('summary_rev_all').on(summaryRevAllRegional.tgl, summaryRevAllRegional.area, summaryRevAllRegional.regional, summaryRevAllRegional.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllRegional.tgl, currDate),
                    eq(summaryRevAllRegional.regional, 'PUMA'),
                    eq(summaryRevAllRegional.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllRegional.regional)
                .as('b')

            const regionalTargetRevenue = db
                .select({
                    regional: territoryArea4.regional,
                    targetRevPrepaid: sum(feiTargetPuma.rev_byu).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.regional)
                .as('c')

            const revPrabayarRegional = db
                .select()
                .from(summaryRevPrabayarRegional)
                .where(and(
                    eq(summaryRevPrabayarRegional.tgl, currDate),
                    eq(summaryRevPrabayarRegional.regional, 'PUMA'),
                    eq(summaryRevPrabayarRegional.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevPrabayarRegional.regional)
                .as('d')

            const revenueRegional = db
                .select({
                    name: regionalSubquery.regional,
                    targetAll: sql<number>`ROUND(SUM(${regionalTargetRevenue.targetRevPrepaid}),2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevRegional.revAllM} - ${revPrabayarRegional.rev_all_m}), 2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revAllM} - ${revPrabayarRegional.rev_all_m})/SUM(${regionalTargetRevenue.targetRevPrepaid}))*100, 2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revAllM} - ${revPrabayarRegional.rev_all_m})/(${today}/${daysInMonth}*SUM(${regionalTargetRevenue.targetRevPrepaid})))*100, 2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevRegional.revAllM} - ${revPrabayarRegional.rev_all_m}) - SUM(${regionalTargetRevenue.targetRevPrepaid}), 0)), 2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevRegional.revAllMom} - ${revPrabayarRegional.rev_all_mom}), 2), '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revAllAbsolut} - ${revPrabayarRegional.rev_all_absolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevRegional.revAllYoy} - ${revPrabayarRegional.rev_all_yoy}), 2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevRegional.revAllYtd} - ${revPrabayarRegional.rev_all_ytd}), 2), '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevRegional.revBBM} - ${revPrabayarRegional.rev_bb_m}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revBBAbsolut} - ${revPrabayarRegional.rev_bb_absolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(SUM(${summaryRevRegional.revBBMom} - ${revPrabayarRegional.rev_bb_mom}) ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(SUM(${summaryRevRegional.revBBYoy} - ${revPrabayarRegional.rev_bb_yoy}) ,'%')`.as('bb_yoy'),
                    bbYtd: sql<string>`CONCAT(SUM(${summaryRevRegional.revBBYtd} - ${revPrabayarRegional.rev_bb_ytd}) ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revBBM} - ${revPrabayarRegional.rev_bb_m})/SUM(${summaryRevRegional.revAllM} - ${revPrabayarRegional.rev_all_m}))*100, 2), '%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevRegional.revDigitalM} - ${revPrabayarRegional.rev_digital_m}), 2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revDigitalAbsol} - ${revPrabayarRegional.rev_digital_absol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(SUM(${summaryRevRegional.revDigitalMom} - ${revPrabayarRegional.rev_digital_mom}) ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(SUM(${summaryRevRegional.revDigitalYoy} - ${revPrabayarRegional.rev_digital_yoy}) ,'%')`.as('digital_yoy'),
                    digitalYtd: sql<string>`CONCAT(SUM(${summaryRevRegional.revDigitalYtd} - ${revPrabayarRegional.rev_digital_ytd}) ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revDigitalM} - ${revPrabayarRegional.rev_digital_m})/SUM(${summaryRevRegional.revAllM} - ${revPrabayarRegional.rev_all_m}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevRegional.revVoiceM} - ${revPrabayarRegional.rev_voice_m}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revVoiceAbsol} - ${revPrabayarRegional.rev_voice_absol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(SUM(${summaryRevRegional.revVoiceMom} - ${revPrabayarRegional.rev_voice_mom}) ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(SUM(${summaryRevRegional.revVoiceYoy} - ${revPrabayarRegional.rev_voice_yoy}) ,'%')`.as('voice_yoy'),
                    voiceYtd: sql<string>`CONCAT(SUM(${summaryRevRegional.revVoiceYtd} - ${revPrabayarRegional.rev_voice_ytd}) ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revVoiceM} - ${revPrabayarRegional.rev_voice_m})/SUM(${summaryRevRegional.revAllM} - ${revPrabayarRegional.rev_all_m}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevRegional.revSmSM} - ${revPrabayarRegional.rev_sms_m}),2)`.as('rev_sms'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revSmSAbsolut} - ${revPrabayarRegional.rev_sms_absolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(SUM(${summaryRevRegional.revSmSMom} - ${revPrabayarRegional.rev_sms_mom}) ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(SUM(${summaryRevRegional.revSmSYoy} - ${revPrabayarRegional.rev_sms_yoy}) ,'%')`.as('sms_yoy'),
                    smsYtd: sql<string>`CONCAT(SUM(${summaryRevRegional.revSmSYtd} - ${revPrabayarRegional.rev_sms_ytd}) ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revSmSM} - ${revPrabayarRegional.rev_sms_m})/SUM(${summaryRevRegional.revAllM} - ${revPrabayarRegional.rev_all_m}))*100,2),'%')`.as('contr_sms')
                })
                .from(regionalSubquery)
                .leftJoin(summaryRevRegional, eq(regionalSubquery.regional, summaryRevRegional.regional))
                .leftJoin(regionalTargetRevenue, eq(regionalSubquery.regional, regionalTargetRevenue.regional))
                .leftJoin(revPrabayarRegional, eq(regionalSubquery.regional, revPrabayarRegional.regional))
                .groupBy(regionalSubquery.regional)

            const branchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'BRANCH'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    revAllAbsolut: sql<number>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revBB: sql<number>`''`,
                    revBBAbsolut: sql<number>`''`,
                    bbMom: sql<string>`''`,
                    bbYoy: sql<string>`''`,
                    bbYtd: sql<string>`''`,
                    contrBB: sql<string>`''`,
                    revDigital: sql<number>`''`,
                    revDigitalAbsolut: sql<number>`''`,
                    digitalMom: sql<string>`''`,
                    digitalYoy: sql<string>`''`,
                    digitalYtd: sql<string>`''`,
                    contrDigital: sql<string>`''`,
                    revVoice: sql<number>`''`,
                    revVoiceAbsolut: sql<number>`''`,
                    voiceMom: sql<string>`''`,
                    voiceYoy: sql<string>`''`,
                    voiceYtd: sql<string>`''`,
                    contrVoice: sql<string>`''`,
                    revSms: sql<number>`''`,
                    revSmsAbsolut: sql<number>`''`,
                    smsMom: sql<string>`''`,
                    smsYoy: sql<string>`''`,
                    smsYtd: sql<string>`''`,
                    contrSms: sql<string>`''`
                })
                .from(feiTargetPuma)

            const branchSubquery = db
                .select({ branch: territoryArea4.branch })
                .from(territoryArea4)
                .where(and(
                    eq(territoryArea4.regional, 'PUMA'),
                    branch ? eq(territoryArea4.branch, branch) : undefined
                ))
                .groupBy(territoryArea4.branch)
                .as('a')

            const summaryRevBranch = db
                .select({
                    branch: summaryRevAllBranch.branch,
                    revAllM: summaryRevAllBranch.rev_all_m,
                    revAllMom: summaryRevAllBranch.rev_all_mom,
                    revAllAbsolut: summaryRevAllBranch.rev_all_absolut,
                    revAllYoy: summaryRevAllBranch.rev_all_yoy,
                    revAllYtd: summaryRevAllBranch.rev_all_ytd,
                    revAllQoq: summaryRevAllBranch.rev_all_qoq,
                    revBBM: summaryRevAllBranch.rev_bb_m,
                    revBBMom: summaryRevAllBranch.rev_bb_mom,
                    revBBAbsolut: summaryRevAllBranch.rev_bb_absolut,
                    revBBYoy: summaryRevAllBranch.rev_bb_yoy,
                    revBBYtd: summaryRevAllBranch.rev_bb_ytd,
                    revBBQoq: summaryRevAllBranch.rev_bb_qoq,
                    revVoiceM: summaryRevAllBranch.rev_voice_m,
                    revVoiceMom: summaryRevAllBranch.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllBranch.rev_voice_absol,
                    revVoiceYoy: summaryRevAllBranch.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllBranch.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllBranch.rev_voice_qoq,
                    revDigitalM: summaryRevAllBranch.rev_digital_m,
                    revDigitalMom: summaryRevAllBranch.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllBranch.rev_digital_absol,
                    revDigitalYoy: summaryRevAllBranch.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllBranch.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllBranch.rev_digital_qoq,
                    revSmSM: summaryRevAllBranch.rev_sms_m,
                    revSmSMom: summaryRevAllBranch.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllBranch.rev_sms_absolut,
                    revSmSYoy: summaryRevAllBranch.rev_sms_yoy,
                    revSmSYtd: summaryRevAllBranch.rev_sms_ytd,
                    revSmSQoq: summaryRevAllBranch.rev_sms_qoq,
                })
                .from(summaryRevAllBranch, { useIndex: index('summary_rev_all').on(summaryRevAllBranch.tgl, summaryRevAllBranch.area, summaryRevAllBranch.regional, summaryRevAllBranch.branch, summaryRevAllBranch.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllBranch.tgl, currDate),
                    eq(summaryRevAllBranch.regional, 'PUMA'),
                    eq(summaryRevAllBranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllBranch.branch)
                .as('b')

            const branchTargetRevenue = db
                .select({
                    branch: territoryArea4.branch,
                    targetRevPrepaid: sum(feiTargetPuma.rev_byu).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.branch)
                .as('c')

            const revPrabayarBranch = db
                .select()
                .from(summaryRevPrabayarBranch)
                .where(and(
                    eq(summaryRevPrabayarBranch.tgl, currDate),
                    eq(summaryRevPrabayarBranch.regional, 'PUMA'),
                    eq(summaryRevPrabayarBranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevPrabayarBranch.branch)
                .as('d')

            const revenueBranch = db
                .select({
                    name: branchSubquery.branch,
                    targetAll: sql<number>`ROUND(SUM(${branchTargetRevenue.targetRevPrepaid}),2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevBranch.revAllM} - ${revPrabayarBranch.rev_all_m}), 2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revAllM} - ${revPrabayarBranch.rev_all_m})/SUM(${branchTargetRevenue.targetRevPrepaid}))*100, 2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revAllM} - ${revPrabayarBranch.rev_all_m})/(${today}/${daysInMonth}*SUM(${branchTargetRevenue.targetRevPrepaid})))*100, 2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevBranch.revAllM} - ${revPrabayarBranch.rev_all_m}) - SUM(${branchTargetRevenue.targetRevPrepaid}), 0)), 2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevBranch.revAllMom} - ${revPrabayarBranch.rev_all_mom}), 2), '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revAllAbsolut} - ${revPrabayarBranch.rev_all_absolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevBranch.revAllYoy} - ${revPrabayarBranch.rev_all_yoy}), 2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevBranch.revAllYtd} - ${revPrabayarBranch.rev_all_ytd}), 2), '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevBranch.revBBM} - ${revPrabayarBranch.rev_bb_m}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revBBAbsolut} - ${revPrabayarBranch.rev_bb_absolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(SUM(${summaryRevBranch.revBBMom} - ${revPrabayarBranch.rev_bb_mom}) ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(SUM(${summaryRevBranch.revBBYoy} - ${revPrabayarBranch.rev_bb_yoy}) ,'%')`.as('bb_yoy'),
                    bbYtd: sql<string>`CONCAT(SUM(${summaryRevBranch.revBBYtd} - ${revPrabayarBranch.rev_bb_ytd}) ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revBBM} - ${revPrabayarBranch.rev_bb_m})/SUM(${summaryRevBranch.revAllM} - ${revPrabayarBranch.rev_all_m}))*100, 2), '%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevBranch.revDigitalM} - ${revPrabayarBranch.rev_digital_m}), 2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revDigitalAbsol} - ${revPrabayarBranch.rev_digital_absol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(SUM(${summaryRevBranch.revDigitalMom} - ${revPrabayarBranch.rev_digital_mom}) ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(SUM(${summaryRevBranch.revDigitalYoy} - ${revPrabayarBranch.rev_digital_yoy}) ,'%')`.as('digital_yoy'),
                    digitalYtd: sql<string>`CONCAT(SUM(${summaryRevBranch.revDigitalYtd} - ${revPrabayarBranch.rev_digital_ytd}) ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revDigitalM})/SUM(${summaryRevBranch.revAllM} - ${revPrabayarBranch.rev_all_m}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevBranch.revVoiceM} - ${revPrabayarBranch.rev_voice_m}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revVoiceAbsol} - ${revPrabayarBranch.rev_voice_absol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(SUM(${summaryRevBranch.revVoiceMom} - ${revPrabayarBranch.rev_voice_mom}) ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(SUM(${summaryRevBranch.revVoiceYoy} - ${revPrabayarBranch.rev_voice_yoy}) ,'%')`.as('voice_yoy'),
                    voiceYtd: sql<string>`CONCAT(SUM(${summaryRevBranch.revVoiceYtd} - ${revPrabayarBranch.rev_voice_ytd}) ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revVoiceM} - ${revPrabayarBranch.rev_voice_m})/SUM(${summaryRevBranch.revAllM} - ${revPrabayarBranch.rev_all_m}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevBranch.revSmSM} - ${revPrabayarBranch.rev_sms_m}),2)`.as('rev_sms'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revSmSAbsolut} - ${revPrabayarBranch.rev_sms_absolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(SUM(${summaryRevBranch.revSmSMom} - ${revPrabayarBranch.rev_sms_mom}) ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(SUM(${summaryRevBranch.revSmSYoy} - ${revPrabayarBranch.rev_sms_yoy}) ,'%')`.as('sms_yoy'),
                    smsYtd: sql<string>`CONCAT(SUM(${summaryRevBranch.revSmSYtd} - ${revPrabayarBranch.rev_sms_ytd}) ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revSmSM} - ${revPrabayarBranch.rev_sms_m})/SUM(${summaryRevBranch.revAllM} - ${revPrabayarBranch.rev_all_m}))*100,2),'%')`.as('contr_sms')
                })
                .from(branchSubquery)
                .leftJoin(summaryRevBranch, eq(branchSubquery.branch, summaryRevBranch.branch))
                .leftJoin(branchTargetRevenue, eq(branchSubquery.branch, branchTargetRevenue.branch))
                .leftJoin(revPrabayarBranch, eq(branchSubquery.branch, revPrabayarBranch.branch))
                .groupBy(branchSubquery.branch)

            const subbranchHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'SUBBRANCH'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    revAllAbsolut: sql<number>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revBB: sql<number>`''`,
                    revBBAbsolut: sql<number>`''`,
                    bbMom: sql<string>`''`,
                    bbYoy: sql<string>`''`,
                    bbYtd: sql<string>`''`,
                    contrBB: sql<string>`''`,
                    revDigital: sql<number>`''`,
                    revDigitalAbsolut: sql<number>`''`,
                    digitalMom: sql<string>`''`,
                    digitalYoy: sql<string>`''`,
                    digitalYtd: sql<string>`''`,
                    contrDigital: sql<string>`''`,
                    revVoice: sql<number>`''`,
                    revVoiceAbsolut: sql<number>`''`,
                    voiceMom: sql<string>`''`,
                    voiceYoy: sql<string>`''`,
                    voiceYtd: sql<string>`''`,
                    contrVoice: sql<string>`''`,
                    revSms: sql<number>`''`,
                    revSmsAbsolut: sql<number>`''`,
                    smsMom: sql<string>`''`,
                    smsYoy: sql<string>`''`,
                    smsYtd: sql<string>`''`,
                    contrSms: sql<string>`''`
                })
                .from(feiTargetPuma)

            const subbranchSubquery = db
                .select({ subbranch: territoryArea4.subbranch })
                .from(territoryArea4)
                .where(branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch)
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch)
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.subbranch)
                .as('a')

            const summaryRevSubbranch = db
                .select({
                    subbranch: summaryRevAllSubbranch.subbranch,
                    revAllM: summaryRevAllSubbranch.rev_all_m,
                    revAllMom: summaryRevAllSubbranch.rev_all_mom,
                    revAllAbsolut: summaryRevAllSubbranch.rev_all_absolut,
                    revAllYoy: summaryRevAllSubbranch.rev_all_yoy,
                    revAllYtd: summaryRevAllSubbranch.rev_all_ytd,
                    revAllQoq: summaryRevAllSubbranch.rev_all_qoq,
                    revBBM: summaryRevAllSubbranch.rev_bb_m,
                    revBBMom: summaryRevAllSubbranch.rev_bb_mom,
                    revBBAbsolut: summaryRevAllSubbranch.rev_bb_absolut,
                    revBBYoy: summaryRevAllSubbranch.rev_bb_yoy,
                    revBBYtd: summaryRevAllSubbranch.rev_bb_ytd,
                    revBBQoq: summaryRevAllSubbranch.rev_bb_qoq,
                    revVoiceM: summaryRevAllSubbranch.rev_voice_m,
                    revVoiceMom: summaryRevAllSubbranch.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllSubbranch.rev_voice_absol,
                    revVoiceYoy: summaryRevAllSubbranch.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllSubbranch.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllSubbranch.rev_voice_qoq,
                    revDigitalM: summaryRevAllSubbranch.rev_digital_m,
                    revDigitalMom: summaryRevAllSubbranch.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllSubbranch.rev_digital_absol,
                    revDigitalYoy: summaryRevAllSubbranch.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllSubbranch.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllSubbranch.rev_digital_qoq,
                    revSmSM: summaryRevAllSubbranch.rev_sms_m,
                    revSmSMom: summaryRevAllSubbranch.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllSubbranch.rev_sms_absolut,
                    revSmSYoy: summaryRevAllSubbranch.rev_sms_yoy,
                    revSmSYtd: summaryRevAllSubbranch.rev_sms_ytd,
                    revSmSQoq: summaryRevAllSubbranch.rev_sms_qoq,
                })
                .from(summaryRevAllSubbranch, { useIndex: index('summary_rev_all').on(summaryRevAllSubbranch.tgl, summaryRevAllSubbranch.area, summaryRevAllSubbranch.regional, summaryRevAllSubbranch.branch, summaryRevAllSubbranch.subbranch, summaryRevAllSubbranch.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllSubbranch.tgl, currDate),
                    eq(summaryRevAllSubbranch.regional, 'PUMA'),
                    eq(summaryRevAllSubbranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllSubbranch.subbranch)
                .as('b')

            const subbranchTargetRevenue = db
                .select({
                    subbranch: territoryArea4.subbranch,
                    targetRevPrepaid: sum(feiTargetPuma.rev_byu).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.subbranch)
                .as('c')

            const revPrabayarSubbranch = db
                .select()
                .from(summaryRevPrabayarSubbranch)
                .where(and(
                    eq(summaryRevPrabayarSubbranch.tgl, currDate),
                    eq(summaryRevPrabayarSubbranch.regional, 'PUMA'),
                    eq(summaryRevPrabayarSubbranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevPrabayarSubbranch.subbranch)
                .as('d')

            const revenueSubbranch = db
                .select({
                    name: subbranchSubquery.subbranch,
                    targetAll: sql<number>`ROUND(SUM(${subbranchTargetRevenue.targetRevPrepaid}),2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevSubbranch.revAllM} - ${revPrabayarSubbranch.rev_all_m}), 2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revAllM} - ${revPrabayarSubbranch.rev_all_m})/SUM(${subbranchTargetRevenue.targetRevPrepaid}))*100, 2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revAllM} - ${revPrabayarSubbranch.rev_all_m})/(${today}/${daysInMonth}*SUM(${subbranchTargetRevenue.targetRevPrepaid})))*100, 2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevSubbranch.revAllM} - ${revPrabayarSubbranch.rev_all_m}) - SUM(${subbranchTargetRevenue.targetRevPrepaid}), 0)), 2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevSubbranch.revAllMom} - ${revPrabayarSubbranch.rev_all_mom}), 2), '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revAllAbsolut} - ${revPrabayarSubbranch.rev_all_absolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevSubbranch.revAllYoy} - ${revPrabayarSubbranch.rev_all_yoy}), 2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevSubbranch.revAllYtd} - ${revPrabayarSubbranch.rev_all_ytd}), 2), '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevSubbranch.revBBM} - ${revPrabayarSubbranch.rev_bb_m}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revBBAbsolut} - ${revPrabayarSubbranch.rev_bb_absolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revBBMom} - ${revPrabayarSubbranch.rev_bb_mom}) ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revBBYoy} - ${revPrabayarSubbranch.rev_bb_yoy}) ,'%')`.as('bb_yoy'),
                    bbYtd: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revBBYtd} - ${revPrabayarSubbranch.rev_bb_ytd}) ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revBBM} - ${revPrabayarSubbranch.rev_bb_m})/SUM(${summaryRevSubbranch.revAllM} - ${revPrabayarSubbranch.rev_all_m}))*100, 2), '%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevSubbranch.revDigitalM} - ${revPrabayarSubbranch.rev_digital_m}), 2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revDigitalAbsol} - ${revPrabayarSubbranch.rev_digital_absol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revDigitalMom} - ${revPrabayarSubbranch.rev_digital_mom}) ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revDigitalYoy} - ${revPrabayarSubbranch.rev_digital_yoy}) ,'%')`.as('digital_yoy'),
                    digitalYtd: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revDigitalYtd} - ${revPrabayarSubbranch.rev_digital_ytd}) ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revDigitalM})/SUM(${summaryRevSubbranch.revAllM} - ${revPrabayarSubbranch.rev_all_m}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevSubbranch.revVoiceM} - ${revPrabayarSubbranch.rev_voice_m}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revVoiceAbsol} - ${revPrabayarSubbranch.rev_voice_absol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revVoiceMom} - ${revPrabayarSubbranch.rev_voice_mom}) ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revVoiceYoy} - ${revPrabayarSubbranch.rev_voice_yoy}) ,'%')`.as('voice_yoy'),
                    voiceYtd: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revVoiceYtd} - ${revPrabayarSubbranch.rev_voice_ytd}) ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revVoiceM} - ${revPrabayarSubbranch.rev_voice_m})/SUM(${summaryRevSubbranch.revAllM} - ${revPrabayarSubbranch.rev_all_m}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevSubbranch.revSmSM} - ${revPrabayarSubbranch.rev_sms_m}),2)`.as('rev_sms'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revSmSAbsolut} - ${revPrabayarSubbranch.rev_sms_absolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revSmSMom} - ${revPrabayarSubbranch.rev_sms_mom}) ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revSmSYoy} - ${revPrabayarSubbranch.rev_sms_yoy}) ,'%')`.as('sms_yoy'),
                    smsYtd: sql<string>`CONCAT(SUM(${summaryRevSubbranch.revSmSYtd} - ${revPrabayarSubbranch.rev_sms_ytd}) ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revSmSM} - ${revPrabayarSubbranch.rev_sms_m})/SUM(${summaryRevSubbranch.revAllM} - ${revPrabayarSubbranch.rev_all_m}))*100,2),'%')`.as('contr_sms')
                })
                .from(subbranchSubquery)
                .leftJoin(summaryRevSubbranch, eq(subbranchSubquery.subbranch, summaryRevSubbranch.subbranch))
                .leftJoin(subbranchTargetRevenue, eq(subbranchSubquery.subbranch, subbranchTargetRevenue.subbranch))
                .leftJoin(revPrabayarSubbranch, eq(subbranchSubquery.subbranch, revPrabayarSubbranch.subbranch))
                .groupBy(subbranchSubquery.subbranch)

            const clusterHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'CLUSTER'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    revAllAbsolut: sql<number>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revBB: sql<number>`''`,
                    revBBAbsolut: sql<number>`''`,
                    bbMom: sql<string>`''`,
                    bbYoy: sql<string>`''`,
                    bbYtd: sql<string>`''`,
                    contrBB: sql<string>`''`,
                    revDigital: sql<number>`''`,
                    revDigitalAbsolut: sql<number>`''`,
                    digitalMom: sql<string>`''`,
                    digitalYoy: sql<string>`''`,
                    digitalYtd: sql<string>`''`,
                    contrDigital: sql<string>`''`,
                    revVoice: sql<number>`''`,
                    revVoiceAbsolut: sql<number>`''`,
                    voiceMom: sql<string>`''`,
                    voiceYoy: sql<string>`''`,
                    voiceYtd: sql<string>`''`,
                    contrVoice: sql<string>`''`,
                    revSms: sql<number>`''`,
                    revSmsAbsolut: sql<number>`''`,
                    smsMom: sql<string>`''`,
                    smsYoy: sql<string>`''`,
                    smsYtd: sql<string>`''`,
                    contrSms: sql<string>`''`
                })
                .from(feiTargetPuma)

            const clusterSubquery = db
                .select({ cluster: territoryArea4.cluster })
                .from(territoryArea4)
                .where(branch && subbranch && cluster ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                ) : branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.cluster)
                .as('a')

            const summaryRevCluster = db
                .select({
                    cluster: summaryRevAllCluster.cluster,
                    revAllM: summaryRevAllCluster.rev_all_m,
                    revAllMom: summaryRevAllCluster.rev_all_mom,
                    revAllAbsolut: summaryRevAllCluster.rev_all_absolut,
                    revAllYoy: summaryRevAllCluster.rev_all_yoy,
                    revAllYtd: summaryRevAllCluster.rev_all_ytd,
                    revAllQoq: summaryRevAllCluster.rev_all_qoq,
                    revBBM: summaryRevAllCluster.rev_bb_m,
                    revBBMom: summaryRevAllCluster.rev_bb_mom,
                    revBBAbsolut: summaryRevAllCluster.rev_bb_absolut,
                    revBBYoy: summaryRevAllCluster.rev_bb_yoy,
                    revBBYtd: summaryRevAllCluster.rev_bb_ytd,
                    revBBQoq: summaryRevAllCluster.rev_bb_qoq,
                    revVoiceM: summaryRevAllCluster.rev_voice_m,
                    revVoiceMom: summaryRevAllCluster.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllCluster.rev_voice_absol,
                    revVoiceYoy: summaryRevAllCluster.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllCluster.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllCluster.rev_voice_qoq,
                    revDigitalM: summaryRevAllCluster.rev_digital_m,
                    revDigitalMom: summaryRevAllCluster.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllCluster.rev_digital_absol,
                    revDigitalYoy: summaryRevAllCluster.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllCluster.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllCluster.rev_digital_qoq,
                    revSmSM: summaryRevAllCluster.rev_sms_m,
                    revSmSMom: summaryRevAllCluster.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllCluster.rev_sms_absolut,
                    revSmSYoy: summaryRevAllCluster.rev_sms_yoy,
                    revSmSYtd: summaryRevAllCluster.rev_sms_ytd,
                    revSmSQoq: summaryRevAllCluster.rev_sms_qoq,
                })
                .from(summaryRevAllCluster, { useIndex: index('summary_rev_all').on(summaryRevAllCluster.tgl, summaryRevAllCluster.area, summaryRevAllCluster.regional, summaryRevAllCluster.branch, summaryRevAllCluster.subbranch, summaryRevAllCluster.cluster, summaryRevAllCluster.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllCluster.tgl, currDate),
                    eq(summaryRevAllCluster.regional, 'PUMA'),
                    eq(summaryRevAllCluster.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllCluster.cluster)
                .as('b')

            const clusterTargetRevenue = db
                .select({
                    cluster: territoryArea4.cluster,
                    targetRevPrepaid: sum(feiTargetPuma.rev_byu).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.cluster)
                .as('c')

            const revPrabayarCluster = db
                .select()
                .from(summaryRevPrabayarCluster)
                .where(and(
                    eq(summaryRevPrabayarCluster.tgl, currDate),
                    eq(summaryRevPrabayarCluster.regional, 'PUMA'),
                    // eq(summaryRevPrabayarCluster.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevPrabayarCluster.cluster)
                .as('d')

            const revenueCluster = db
                .select({
                    name: clusterSubquery.cluster,
                    targetAll: sql<number>`ROUND(SUM(${clusterTargetRevenue.targetRevPrepaid}),2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevCluster.revAllM} - ${revPrabayarCluster.rev_all_m}), 2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revAllM} - ${revPrabayarCluster.rev_all_m})/SUM(${clusterTargetRevenue.targetRevPrepaid}))*100, 2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revAllM} - ${revPrabayarCluster.rev_all_m})/(${today}/${daysInMonth}*SUM(${clusterTargetRevenue.targetRevPrepaid})))*100, 2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevCluster.revAllM} - ${revPrabayarCluster.rev_all_m}) - SUM(${clusterTargetRevenue.targetRevPrepaid}), 0)), 2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevCluster.revAllMom} - ${revPrabayarCluster.rev_all_mom}), 2), '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revAllAbsolut} - ${revPrabayarCluster.rev_all_absolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevCluster.revAllYoy} - ${revPrabayarCluster.rev_all_yoy}), 2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevCluster.revAllYtd} - ${revPrabayarCluster.rev_all_ytd}), 2), '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevCluster.revBBM} - ${revPrabayarCluster.rev_bb_m}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revBBAbsolut} - ${revPrabayarCluster.rev_bb_absolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(SUM(${summaryRevCluster.revBBMom} - ${revPrabayarCluster.rev_bb_mom}) ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(SUM(${summaryRevCluster.revBBYoy} - ${revPrabayarCluster.rev_bb_yoy}) ,'%')`.as('bb_yoy'),
                    bbYtd: sql<string>`CONCAT(SUM(${summaryRevCluster.revBBYtd} - ${revPrabayarCluster.rev_bb_ytd}) ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revBBM} - ${revPrabayarCluster.rev_bb_m})/SUM(${summaryRevCluster.revAllM} - ${revPrabayarCluster.rev_all_m}))*100, 2), '%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevCluster.revDigitalM} - ${revPrabayarCluster.rev_digital_m}), 2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revDigitalAbsol} - ${revPrabayarCluster.rev_digital_absol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(SUM(${summaryRevCluster.revDigitalMom} - ${revPrabayarCluster.rev_digital_mom}) ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(SUM(${summaryRevCluster.revDigitalYoy} - ${revPrabayarCluster.rev_digital_yoy}) ,'%')`.as('digital_yoy'),
                    digitalYtd: sql<string>`CONCAT(SUM(${summaryRevCluster.revDigitalYtd} - ${revPrabayarCluster.rev_digital_ytd}) ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revDigitalM})/SUM(${summaryRevCluster.revAllM} - ${revPrabayarCluster.rev_all_m}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevCluster.revVoiceM} - ${revPrabayarCluster.rev_voice_m}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revVoiceAbsol} - ${revPrabayarCluster.rev_voice_absol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(SUM(${summaryRevCluster.revVoiceMom} - ${revPrabayarCluster.rev_voice_mom}) ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(SUM(${summaryRevCluster.revVoiceYoy} - ${revPrabayarCluster.rev_voice_yoy}) ,'%')`.as('voice_yoy'),
                    voiceYtd: sql<string>`CONCAT(SUM(${summaryRevCluster.revVoiceYtd} - ${revPrabayarCluster.rev_voice_ytd}) ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revVoiceM} - ${revPrabayarCluster.rev_voice_m})/SUM(${summaryRevCluster.revAllM} - ${revPrabayarCluster.rev_all_m}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevCluster.revSmSM} - ${revPrabayarCluster.rev_sms_m}),2)`.as('rev_sms'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revSmSAbsolut} - ${revPrabayarCluster.rev_sms_absolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(SUM(${summaryRevCluster.revSmSMom} - ${revPrabayarCluster.rev_sms_mom}) ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(SUM(${summaryRevCluster.revSmSYoy} - ${revPrabayarCluster.rev_sms_yoy}) ,'%')`.as('sms_yoy'),
                    smsYtd: sql<string>`CONCAT(SUM(${summaryRevCluster.revSmSYtd} - ${revPrabayarCluster.rev_sms_ytd}) ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revSmSM} - ${revPrabayarCluster.rev_sms_m})/SUM(${summaryRevCluster.revAllM} - ${revPrabayarCluster.rev_all_m}))*100,2),'%')`.as('contr_sms')
                })
                .from(clusterSubquery)
                .leftJoin(summaryRevCluster, eq(clusterSubquery.cluster, summaryRevCluster.cluster))
                .leftJoin(clusterTargetRevenue, eq(clusterSubquery.cluster, clusterTargetRevenue.cluster))
                .leftJoin(revPrabayarCluster, eq(clusterSubquery.cluster, revPrabayarCluster.cluster))
                .groupBy(clusterSubquery.cluster)

            const kabupatenHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'KABUPATEN'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    revAllAbsolut: sql<number>`''`,
                    yoyAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revBB: sql<number>`''`,
                    revBBAbsolut: sql<number>`''`,
                    bbMom: sql<string>`''`,
                    bbYoy: sql<string>`''`,
                    bbYtd: sql<string>`''`,
                    contrBB: sql<string>`''`,
                    revDigital: sql<number>`''`,
                    revDigitalAbsolut: sql<number>`''`,
                    digitalMom: sql<string>`''`,
                    digitalYoy: sql<string>`''`,
                    digitalYtd: sql<string>`''`,
                    contrDigital: sql<string>`''`,
                    revVoice: sql<number>`''`,
                    revVoiceAbsolut: sql<number>`''`,
                    voiceMom: sql<string>`''`,
                    voiceYoy: sql<string>`''`,
                    voiceYtd: sql<string>`''`,
                    contrVoice: sql<string>`''`,
                    revSms: sql<number>`''`,
                    revSmsAbsolut: sql<number>`''`,
                    smsMom: sql<string>`''`,
                    smsYoy: sql<string>`''`,
                    smsYtd: sql<string>`''`,
                    contrSms: sql<string>`''`
                })
                .from(feiTargetPuma)

            const kabupatenSubquery = db
                .select({ kabupaten: territoryArea4.kabupaten })
                .from(territoryArea4)
                .where(branch && subbranch && cluster && kabupaten ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                    eq(territoryArea4.kabupaten, kabupaten),
                ) : branch && subbranch && cluster ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                ) : branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.kabupaten)
                .as('a')

            const summaryRevKabupaten = db
                .select({
                    kabupaten: summaryRevAllKabupaten.kabupaten,
                    revAllM: summaryRevAllKabupaten.rev_all_m,
                    revAllMom: summaryRevAllKabupaten.rev_all_mom,
                    revAllAbsolut: summaryRevAllKabupaten.rev_all_absolut,
                    revAllYoy: summaryRevAllKabupaten.rev_all_yoy,
                    revAllYtd: summaryRevAllKabupaten.rev_all_ytd,
                    revAllQoq: summaryRevAllKabupaten.rev_all_qoq,
                    revBBM: summaryRevAllKabupaten.rev_bb_m,
                    revBBMom: summaryRevAllKabupaten.rev_bb_mom,
                    revBBAbsolut: summaryRevAllKabupaten.rev_bb_absolut,
                    revBBYoy: summaryRevAllKabupaten.rev_bb_yoy,
                    revBBYtd: summaryRevAllKabupaten.rev_bb_ytd,
                    revBBQoq: summaryRevAllKabupaten.rev_bb_qoq,
                    revVoiceM: summaryRevAllKabupaten.rev_voice_m,
                    revVoiceMom: summaryRevAllKabupaten.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllKabupaten.rev_voice_absol,
                    revVoiceYoy: summaryRevAllKabupaten.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllKabupaten.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllKabupaten.rev_voice_qoq,
                    revDigitalM: summaryRevAllKabupaten.rev_digital_m,
                    revDigitalMom: summaryRevAllKabupaten.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllKabupaten.rev_digital_absol,
                    revDigitalYoy: summaryRevAllKabupaten.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllKabupaten.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllKabupaten.rev_digital_qoq,
                    revSmSM: summaryRevAllKabupaten.rev_sms_m,
                    revSmSMom: summaryRevAllKabupaten.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllKabupaten.rev_sms_absolut,
                    revSmSYoy: summaryRevAllKabupaten.rev_sms_yoy,
                    revSmSYtd: summaryRevAllKabupaten.rev_sms_ytd,
                    revSmSQoq: summaryRevAllKabupaten.rev_sms_qoq,
                })
                .from(summaryRevAllKabupaten, { useIndex: index('summary_rev_all').on(summaryRevAllKabupaten.tgl, summaryRevAllKabupaten.area, summaryRevAllKabupaten.regional, summaryRevAllKabupaten.branch, summaryRevAllKabupaten.subbranch, summaryRevAllKabupaten.cluster, summaryRevAllKabupaten.kabupaten, summaryRevAllKabupaten.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllKabupaten.tgl, currDate),
                    eq(summaryRevAllKabupaten.regional, 'PUMA'),
                    eq(summaryRevAllKabupaten.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllKabupaten.kabupaten)
                .as('b')

            const kabupatenTargetRevenue = db
                .select({
                    kabupaten: territoryArea4.kabupaten,
                    targetRevPrepaid: sum(feiTargetPuma.rev_byu).as('target_rev_prepaid')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.kabupaten)
                .as('c')

            const revPrabayarKabupaten = db
                .select()
                .from(summaryRevPrabayarKabupaten)
                .where(and(
                    eq(summaryRevPrabayarKabupaten.tgl, currDate),
                    eq(summaryRevPrabayarKabupaten.regional, 'PUMA'),
                    // eq(summaryRevPrabayarKabupaten.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevPrabayarKabupaten.kabupaten)
                .as('d')

            const revenueKabupaten = db
                .select({
                    name: kabupatenSubquery.kabupaten,
                    targetAll: sql<number>`ROUND(SUM(${kabupatenTargetRevenue.targetRevPrepaid}),2)`.as('target_prepaid'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevKabupaten.revAllM} - ${revPrabayarKabupaten.rev_all_m}), 2)`.as('rev_prepaid'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revAllM} - ${revPrabayarKabupaten.rev_all_m})/SUM(${kabupatenTargetRevenue.targetRevPrepaid}))*100, 2), '%')`.as('ach_target_fm_prepaid'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revAllM} - ${revPrabayarKabupaten.rev_all_m})/(${today}/${daysInMonth}*SUM(${kabupatenTargetRevenue.targetRevPrepaid})))*100, 2), '%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevKabupaten.revAllM} - ${revPrabayarKabupaten.rev_all_m}) - SUM(${kabupatenTargetRevenue.targetRevPrepaid}), 0)), 2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevKabupaten.revAllMom} - ${revPrabayarKabupaten.rev_all_mom}), 2), '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revAllAbsolut} - ${revPrabayarKabupaten.rev_all_absolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevKabupaten.revAllYoy} - ${revPrabayarKabupaten.rev_all_yoy}), 2), '%')`.as('yoy_all'),
                    ytdAll: sql<string>`CONCAT(ROUND(SUM(${summaryRevKabupaten.revAllYtd} - ${revPrabayarKabupaten.rev_all_ytd}), 2), '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevKabupaten.revBBM} - ${revPrabayarKabupaten.rev_bb_m}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revBBAbsolut} - ${revPrabayarKabupaten.rev_bb_absolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revBBMom} - ${revPrabayarKabupaten.rev_bb_mom}) ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revBBYoy} - ${revPrabayarKabupaten.rev_bb_yoy}) ,'%')`.as('bb_yoy'),
                    bbYtd: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revBBYtd} - ${revPrabayarKabupaten.rev_bb_ytd}) ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revBBM} - ${revPrabayarKabupaten.rev_bb_m})/SUM(${summaryRevKabupaten.revAllM} - ${revPrabayarKabupaten.rev_all_m}))*100, 2), '%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevKabupaten.revDigitalM} - ${revPrabayarKabupaten.rev_digital_m}), 2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revDigitalAbsol} - ${revPrabayarKabupaten.rev_digital_absol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revDigitalMom} - ${revPrabayarKabupaten.rev_digital_mom}) ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revDigitalYoy} - ${revPrabayarKabupaten.rev_digital_yoy}) ,'%')`.as('digital_yoy'),
                    digitalYtd: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revDigitalYtd} - ${revPrabayarKabupaten.rev_digital_ytd}) ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revDigitalM})/SUM(${summaryRevKabupaten.revAllM} - ${revPrabayarKabupaten.rev_all_m}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevKabupaten.revVoiceM} - ${revPrabayarKabupaten.rev_voice_m}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revVoiceAbsol} - ${revPrabayarKabupaten.rev_voice_absol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revVoiceMom} - ${revPrabayarKabupaten.rev_voice_mom}) ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revVoiceYoy} - ${revPrabayarKabupaten.rev_voice_yoy}) ,'%')`.as('voice_yoy'),
                    voiceYtd: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revVoiceYtd} - ${revPrabayarKabupaten.rev_voice_ytd}) ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revVoiceM} - ${revPrabayarKabupaten.rev_voice_m})/SUM(${summaryRevKabupaten.revAllM} - ${revPrabayarKabupaten.rev_all_m}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevKabupaten.revSmSM} - ${revPrabayarKabupaten.rev_sms_m}),2)`.as('rev_sms'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revSmSAbsolut} - ${revPrabayarKabupaten.rev_sms_absolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revSmSMom} - ${revPrabayarKabupaten.rev_sms_mom}) ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revSmSYoy} - ${revPrabayarKabupaten.rev_sms_yoy}) ,'%')`.as('sms_yoy'),
                    smsYtd: sql<string>`CONCAT(SUM(${summaryRevKabupaten.revSmSYtd} - ${revPrabayarKabupaten.rev_sms_ytd}) ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revSmSM} - ${revPrabayarKabupaten.rev_sms_m})/SUM(${summaryRevKabupaten.revAllM} - ${revPrabayarKabupaten.rev_all_m}))*100,2),'%')`.as('contr_sms')
                })
                .from(kabupatenSubquery)
                .leftJoin(summaryRevKabupaten, eq(kabupatenSubquery.kabupaten, summaryRevKabupaten.kabupaten))
                .leftJoin(kabupatenTargetRevenue, eq(kabupatenSubquery.kabupaten, kabupatenTargetRevenue.kabupaten))
                .leftJoin(revPrabayarKabupaten, eq(kabupatenSubquery.kabupaten, revPrabayarKabupaten.kabupaten))
                .groupBy(kabupatenSubquery.kabupaten)

            const [finalDataRevenue] = await Promise.all([
                unionAll(revenueRegional, branchHeaderQuery, revenueBranch, subbranchHeaderQuery, revenueSubbranch, clusterHeaderQuery, revenueCluster, kabupatenHeaderQuery, revenueKabupaten)
            ])

            return c.json({ data: finalDataRevenue }, 200)
        })
    .get('/revenue-gross-all', zValidator('query', z.object({ date: z.coerce.date().optional(), branch: z.string().optional(), subbranch: z.string().optional(), cluster: z.string().optional(), kabupaten: z.string().optional() })),
        async c => {
            const { date, branch, subbranch, cluster, kabupaten } = c.req.valid('query')
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
                .select({
                    regional: summaryRevAllRegional.regional,
                    revAllM: summaryRevAllRegional.rev_all_m,
                    revAllMom: summaryRevAllRegional.rev_all_mom,
                    revAllAbsolut: summaryRevAllRegional.rev_all_absolut,
                    revAllYoy: summaryRevAllRegional.rev_all_yoy,
                    revAllYtd: summaryRevAllRegional.rev_all_ytd,
                    revAllQoq: summaryRevAllRegional.rev_all_qoq,
                    revBBM: summaryRevAllRegional.rev_bb_m,
                    revBBMom: summaryRevAllRegional.rev_bb_mom,
                    revBBAbsolut: summaryRevAllRegional.rev_bb_absolut,
                    revBBYoy: summaryRevAllRegional.rev_bb_yoy,
                    revBBYtd: summaryRevAllRegional.rev_bb_ytd,
                    revBBQoq: summaryRevAllRegional.rev_bb_qoq,
                    revVoiceM: summaryRevAllRegional.rev_voice_m,
                    revVoiceMom: summaryRevAllRegional.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllRegional.rev_voice_absol,
                    revVoiceYoy: summaryRevAllRegional.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllRegional.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllRegional.rev_voice_qoq,
                    revDigitalM: summaryRevAllRegional.rev_digital_m,
                    revDigitalMom: summaryRevAllRegional.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllRegional.rev_digital_absol,
                    revDigitalYoy: summaryRevAllRegional.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllRegional.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllRegional.rev_digital_qoq,
                    revSmSM: summaryRevAllRegional.rev_sms_m,
                    revSmSMom: summaryRevAllRegional.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllRegional.rev_sms_absolut,
                    revSmSYoy: summaryRevAllRegional.rev_sms_yoy,
                    revSmSYtd: summaryRevAllRegional.rev_sms_ytd,
                    revSmSQoq: summaryRevAllRegional.rev_sms_qoq,
                })
                .from(summaryRevAllRegional, { useIndex: index('summary_rev_all').on(summaryRevAllRegional.tgl, summaryRevAllRegional.area, summaryRevAllRegional.regional, summaryRevAllRegional.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllRegional.tgl, currDate),
                    eq(summaryRevAllRegional.regional, 'PUMA'),
                    eq(summaryRevAllRegional.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllRegional.regional)
                .as('b')

            const regionalTargetRevenue = db
                .select({
                    regional: territoryArea4.regional,
                    targetRevAll: sum(feiTargetPuma.rev_all).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.regional)
                .as('c')

            const revenueRegional = db
                .select({
                    name: regionalSubquery.regional,
                    targetAll: sql<number>`ROUND(SUM(${regionalTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevRegional.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revAllM})/SUM(${regionalTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revAllM})/(${today}/${daysInMonth}*(SUM(${regionalTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevRegional.revAllM}) - SUM(${regionalTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevRegional.revAllMom}, '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revAllAbsolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(${summaryRevRegional.revAllYoy}, '%')`.as('yoy_all'),
                    qoqAll: sql<string>`CONCAT(${summaryRevRegional.revAllQoq}, '%')`.as('qoq_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevRegional.revAllYtd}, '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevRegional.revBBM}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revBBAbsolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(${summaryRevRegional.revBBMom} ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(${summaryRevRegional.revBBYoy} ,'%')`.as('bb_yoy'),
                    bbQoq: sql<string>`CONCAT(${summaryRevRegional.revBBQoq} ,'%')`.as('bb_qoq'),
                    bbYtd: sql<string>`CONCAT(${summaryRevRegional.revBBYtd} ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revBBM})/SUM(${summaryRevRegional.revAllM}))*100,2),'%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevRegional.revDigitalM}),2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revDigitalAbsol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(${summaryRevRegional.revDigitalMom} ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(${summaryRevRegional.revDigitalYoy} ,'%')`.as('digital_yoy'),
                    digitalQoq: sql<string>`CONCAT(${summaryRevRegional.revDigitalQoq} ,'%')`.as('digital_qoq'),
                    digitalYtd: sql<string>`CONCAT(${summaryRevRegional.revDigitalYtd} ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revDigitalM})/SUM(${summaryRevRegional.revAllM}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevRegional.revDigitalM}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revVoiceAbsol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(${summaryRevRegional.revDigitalMom} ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(${summaryRevRegional.revDigitalYoy} ,'%')`.as('voice_yoy'),
                    voiceQoq: sql<string>`CONCAT(${summaryRevRegional.revDigitalQoq} ,'%')`.as('voice_qoq'),
                    voiceYtd: sql<string>`CONCAT(${summaryRevRegional.revDigitalYtd} ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revVoiceM})/SUM(${summaryRevRegional.revAllM}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevRegional.revSmSM}),2)`.as('rev_voice'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevRegional.revSmSAbsolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(${summaryRevRegional.revSmSMom} ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(${summaryRevRegional.revSmSYoy} ,'%')`.as('sms_yoy'),
                    smsQoq: sql<string>`CONCAT(${summaryRevRegional.revSmSQoq} ,'%')`.as('sms_qoq'),
                    smsYtd: sql<string>`CONCAT(${summaryRevRegional.revSmSYtd} ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.revSmSM})/SUM(${summaryRevRegional.revAllM}))*100,2),'%')`.as('contr_sms')
                })
                .from(regionalSubquery)
                .leftJoin(summaryRevRegional, eq(regionalSubquery.regional, summaryRevRegional.regional))
                .leftJoin(regionalTargetRevenue, eq(regionalSubquery.regional, regionalTargetRevenue.regional))
                .groupBy(regionalSubquery.regional)

            const branchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'BRANCH'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    revAllAbsolut: sql<number>`''`,
                    yoyAll: sql<string>`''`,
                    qoqAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revBB: sql<number>`''`,
                    revBBAbsolut: sql<number>`''`,
                    bbMom: sql<string>`''`,
                    bbYoy: sql<string>`''`,
                    bbQoq: sql<string>`''`,
                    bbYtd: sql<string>`''`,
                    contrBB: sql<string>`''`,
                    revDigital: sql<number>`''`,
                    revDigitalAbsolut: sql<number>`''`,
                    digitalMom: sql<string>`''`,
                    digitalYoy: sql<string>`''`,
                    digitalQoq: sql<string>`''`,
                    digitalYtd: sql<string>`''`,
                    contrDigital: sql<string>`''`,
                    revVoice: sql<number>`''`,
                    revVoiceAbsolut: sql<number>`''`,
                    voiceMom: sql<string>`''`,
                    voiceYoy: sql<string>`''`,
                    voiceQoq: sql<string>`''`,
                    voiceYtd: sql<string>`''`,
                    contrVoice: sql<string>`''`,
                    revSms: sql<number>`''`,
                    revSmsAbsolut: sql<number>`''`,
                    smsMom: sql<string>`''`,
                    smsYoy: sql<string>`''`,
                    smsQoq: sql<string>`''`,
                    smsYtd: sql<string>`''`,
                    contrSms: sql<string>`''`
                })
                .from(feiTargetPuma)

            const branchSubquery = db
                .select({ branch: territoryArea4.branch })
                .from(territoryArea4)
                .where(and(
                    eq(territoryArea4.regional, 'PUMA'),
                    branch ? eq(territoryArea4.branch, branch) : undefined
                ))
                .groupBy(territoryArea4.branch)
                .as('a')

            const summaryRevBranch = db
                .select({
                    branch: summaryRevAllBranch.branch,
                    revAllM: summaryRevAllBranch.rev_all_m,
                    revAllMom: summaryRevAllBranch.rev_all_mom,
                    revAllAbsolut: summaryRevAllBranch.rev_all_absolut,
                    revAllYoy: summaryRevAllBranch.rev_all_yoy,
                    revAllYtd: summaryRevAllBranch.rev_all_ytd,
                    revAllQoq: summaryRevAllBranch.rev_all_qoq,
                    revBBM: summaryRevAllBranch.rev_bb_m,
                    revBBMom: summaryRevAllBranch.rev_bb_mom,
                    revBBAbsolut: summaryRevAllBranch.rev_bb_absolut,
                    revBBYoy: summaryRevAllBranch.rev_bb_yoy,
                    revBBYtd: summaryRevAllBranch.rev_bb_ytd,
                    revBBQoq: summaryRevAllBranch.rev_bb_qoq,
                    revVoiceM: summaryRevAllBranch.rev_voice_m,
                    revVoiceMom: summaryRevAllBranch.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllBranch.rev_voice_absol,
                    revVoiceYoy: summaryRevAllBranch.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllBranch.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllBranch.rev_voice_qoq,
                    revDigitalM: summaryRevAllBranch.rev_digital_m,
                    revDigitalMom: summaryRevAllBranch.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllBranch.rev_digital_absol,
                    revDigitalYoy: summaryRevAllBranch.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllBranch.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllBranch.rev_digital_qoq,
                    revSmSM: summaryRevAllBranch.rev_sms_m,
                    revSmSMom: summaryRevAllBranch.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllBranch.rev_sms_absolut,
                    revSmSYoy: summaryRevAllBranch.rev_sms_yoy,
                    revSmSYtd: summaryRevAllBranch.rev_sms_ytd,
                    revSmSQoq: summaryRevAllBranch.rev_sms_qoq,
                })
                .from(summaryRevAllBranch, { useIndex: index('summary_rev_all').on(summaryRevAllBranch.tgl, summaryRevAllBranch.area, summaryRevAllBranch.regional, summaryRevAllBranch.branch, summaryRevAllBranch.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllBranch.tgl, currDate),
                    eq(summaryRevAllBranch.regional, 'PUMA'),
                    eq(summaryRevAllBranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllBranch.branch)
                .as('b')

            const branchTargetRevenue = db
                .select({
                    branch: territoryArea4.branch,
                    targetRevAll: sum(feiTargetPuma.rev_all).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.branch)
                .as('c')

            const revenueBranch = db
                .select({
                    name: branchSubquery.branch,
                    targetAll: sql<number>`ROUND(ROUND(SUM(${branchTargetRevenue.targetRevAll}),2),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(ROUND(SUM(${summaryRevBranch.revAllM}),2),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revAllM})/SUM(${branchTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revAllM})/(${today}/${daysInMonth}*(SUM(${branchTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevBranch.revAllM}) - SUM(${branchTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevBranch.revAllMom}, '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revAllAbsolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(${summaryRevBranch.revAllYoy}, '%')`.as('yoy_all'),
                    qoqAll: sql<string>`CONCAT(${summaryRevBranch.revAllQoq}, '%')`.as('qoq_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevBranch.revAllYtd}, '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevBranch.revBBM}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revBBAbsolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(${summaryRevBranch.revBBMom} ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(${summaryRevBranch.revBBYoy} ,'%')`.as('bb_yoy'),
                    bbQoq: sql<string>`CONCAT(${summaryRevBranch.revBBQoq} ,'%')`.as('bb_qoq'),
                    bbYtd: sql<string>`CONCAT(${summaryRevBranch.revBBYtd} ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revBBM})/SUM(${summaryRevBranch.revAllM}))*100,2),'%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevBranch.revDigitalM}),2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revDigitalAbsol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(${summaryRevBranch.revDigitalMom} ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(${summaryRevBranch.revDigitalYoy} ,'%')`.as('digital_yoy'),
                    digitalQoq: sql<string>`CONCAT(${summaryRevBranch.revDigitalQoq} ,'%')`.as('digital_qoq'),
                    digitalYtd: sql<string>`CONCAT(${summaryRevBranch.revDigitalYtd} ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revDigitalM})/SUM(${summaryRevBranch.revAllM}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevBranch.revDigitalM}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revVoiceAbsol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(${summaryRevBranch.revDigitalMom} ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(${summaryRevBranch.revDigitalYoy} ,'%')`.as('voice_yoy'),
                    voiceQoq: sql<string>`CONCAT(${summaryRevBranch.revDigitalQoq} ,'%')`.as('voice_qoq'),
                    voiceYtd: sql<string>`CONCAT(${summaryRevBranch.revDigitalYtd} ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revVoiceM})/SUM(${summaryRevBranch.revAllM}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevBranch.revSmSM}),2)`.as('rev_voice'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevBranch.revSmSAbsolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(${summaryRevBranch.revSmSMom} ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(${summaryRevBranch.revSmSYoy} ,'%')`.as('sms_yoy'),
                    smsQoq: sql<string>`CONCAT(${summaryRevBranch.revSmSQoq} ,'%')`.as('sms_qoq'),
                    smsYtd: sql<string>`CONCAT(${summaryRevBranch.revSmSYtd} ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.revSmSM})/SUM(${summaryRevBranch.revAllM}))*100,2),'%')`.as('contr_sms')

                })
                .from(branchSubquery)
                .leftJoin(summaryRevBranch, eq(branchSubquery.branch, summaryRevBranch.branch))
                .leftJoin(branchTargetRevenue, eq(branchSubquery.branch, branchTargetRevenue.branch))
                .groupBy(branchSubquery.branch)

            const subbranchHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'SUBBRANCH'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    revAllAbsolut: sql<number>`''`,
                    yoyAll: sql<string>`''`,
                    qoqAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revBB: sql<number>`''`,
                    revBBAbsolut: sql<number>`''`,
                    bbMom: sql<string>`''`,
                    bbYoy: sql<string>`''`,
                    bbQoq: sql<string>`''`,
                    bbYtd: sql<string>`''`,
                    contrBB: sql<string>`''`,
                    revDigital: sql<number>`''`,
                    revDigitalAbsolut: sql<number>`''`,
                    digitalMom: sql<string>`''`,
                    digitalYoy: sql<string>`''`,
                    digitalQoq: sql<string>`''`,
                    digitalYtd: sql<string>`''`,
                    contrDigital: sql<string>`''`,
                    revVoice: sql<number>`''`,
                    revVoiceAbsolut: sql<number>`''`,
                    voiceMom: sql<string>`''`,
                    voiceYoy: sql<string>`''`,
                    voiceQoq: sql<string>`''`,
                    voiceYtd: sql<string>`''`,
                    contrVoice: sql<string>`''`,
                    revSms: sql<number>`''`,
                    revSmsAbsolut: sql<number>`''`,
                    smsMom: sql<string>`''`,
                    smsYoy: sql<string>`''`,
                    smsQoq: sql<string>`''`,
                    smsYtd: sql<string>`''`,
                    contrSms: sql<string>`''`
                })
                .from(feiTargetPuma)

            const subbranchSubquery = db
                .select({ subbranch: territoryArea4.subbranch })
                .from(territoryArea4)
                .where(branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch)
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch)
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.subbranch)
                .as('a')

            const summaryRevSubbranch = db
                .select({
                    subbranch: summaryRevAllSubbranch.subbranch,
                    revAllM: summaryRevAllSubbranch.rev_all_m,
                    revAllMom: summaryRevAllSubbranch.rev_all_mom,
                    revAllAbsolut: summaryRevAllSubbranch.rev_all_absolut,
                    revAllYoy: summaryRevAllSubbranch.rev_all_yoy,
                    revAllYtd: summaryRevAllSubbranch.rev_all_ytd,
                    revAllQoq: summaryRevAllSubbranch.rev_all_qoq,
                    revBBM: summaryRevAllSubbranch.rev_bb_m,
                    revBBMom: summaryRevAllSubbranch.rev_bb_mom,
                    revBBAbsolut: summaryRevAllSubbranch.rev_bb_absolut,
                    revBBYoy: summaryRevAllSubbranch.rev_bb_yoy,
                    revBBYtd: summaryRevAllSubbranch.rev_bb_ytd,
                    revBBQoq: summaryRevAllSubbranch.rev_bb_qoq,
                    revVoiceM: summaryRevAllSubbranch.rev_voice_m,
                    revVoiceMom: summaryRevAllSubbranch.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllSubbranch.rev_voice_absol,
                    revVoiceYoy: summaryRevAllSubbranch.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllSubbranch.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllSubbranch.rev_voice_qoq,
                    revDigitalM: summaryRevAllSubbranch.rev_digital_m,
                    revDigitalMom: summaryRevAllSubbranch.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllSubbranch.rev_digital_absol,
                    revDigitalYoy: summaryRevAllSubbranch.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllSubbranch.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllSubbranch.rev_digital_qoq,
                    revSmSM: summaryRevAllSubbranch.rev_sms_m,
                    revSmSMom: summaryRevAllSubbranch.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllSubbranch.rev_sms_absolut,
                    revSmSYoy: summaryRevAllSubbranch.rev_sms_yoy,
                    revSmSYtd: summaryRevAllSubbranch.rev_sms_ytd,
                    revSmSQoq: summaryRevAllSubbranch.rev_sms_qoq,
                })
                .from(summaryRevAllSubbranch, { useIndex: index('summary_rev_all').on(summaryRevAllSubbranch.tgl, summaryRevAllSubbranch.area, summaryRevAllSubbranch.regional, summaryRevAllSubbranch.branch, summaryRevAllSubbranch.subbranch, summaryRevAllSubbranch.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllSubbranch.tgl, currDate),
                    eq(summaryRevAllSubbranch.regional, 'PUMA'),
                    eq(summaryRevAllSubbranch.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllSubbranch.subbranch)
                .as('b')

            const subbranchTargetRevenue = db
                .select({
                    subbranch: territoryArea4.subbranch,
                    targetRevAll: sum(feiTargetPuma.rev_all).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.subbranch)
                .as('c')

            const revenueSubbranch = db
                .select({
                    name: subbranchSubquery.subbranch,
                    targetAll: sql<number>`ROUND(SUM(${subbranchTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevSubbranch.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revAllM})/SUM(${subbranchTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revAllM})/(${today}/${daysInMonth}*(SUM(${subbranchTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevSubbranch.revAllM}) - SUM(${subbranchTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevSubbranch.revAllMom}, '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revAllAbsolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(${summaryRevSubbranch.revAllYoy}, '%')`.as('yoy_all'),
                    qoqAll: sql<string>`CONCAT(${summaryRevSubbranch.revAllQoq}, '%')`.as('qoq_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevSubbranch.revAllYtd}, '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevSubbranch.revBBM}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revBBAbsolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(${summaryRevSubbranch.revBBMom} ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(${summaryRevSubbranch.revBBYoy} ,'%')`.as('bb_yoy'),
                    bbQoq: sql<string>`CONCAT(${summaryRevSubbranch.revBBQoq} ,'%')`.as('bb_qoq'),
                    bbYtd: sql<string>`CONCAT(${summaryRevSubbranch.revBBYtd} ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revBBM})/SUM(${summaryRevSubbranch.revAllM}))*100,2),'%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevSubbranch.revDigitalM}),2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revDigitalAbsol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(${summaryRevSubbranch.revDigitalMom} ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(${summaryRevSubbranch.revDigitalYoy} ,'%')`.as('digital_yoy'),
                    digitalQoq: sql<string>`CONCAT(${summaryRevSubbranch.revDigitalQoq} ,'%')`.as('digital_qoq'),
                    digitalYtd: sql<string>`CONCAT(${summaryRevSubbranch.revDigitalYtd} ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revDigitalM})/SUM(${summaryRevSubbranch.revAllM}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevSubbranch.revDigitalM}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revVoiceAbsol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(${summaryRevSubbranch.revDigitalMom} ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(${summaryRevSubbranch.revDigitalYoy} ,'%')`.as('voice_yoy'),
                    voiceQoq: sql<string>`CONCAT(${summaryRevSubbranch.revDigitalQoq} ,'%')`.as('voice_qoq'),
                    voiceYtd: sql<string>`CONCAT(${summaryRevSubbranch.revDigitalYtd} ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revVoiceM})/SUM(${summaryRevSubbranch.revAllM}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevSubbranch.revSmSM}),2)`.as('rev_voice'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.revSmSAbsolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(${summaryRevSubbranch.revSmSMom} ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(${summaryRevSubbranch.revSmSYoy} ,'%')`.as('sms_yoy'),
                    smsQoq: sql<string>`CONCAT(${summaryRevSubbranch.revSmSQoq} ,'%')`.as('sms_qoq'),
                    smsYtd: sql<string>`CONCAT(${summaryRevSubbranch.revSmSYtd} ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.revSmSM})/SUM(${summaryRevSubbranch.revAllM}))*100,2),'%')`.as('contr_sms')
                })
                .from(subbranchSubquery)
                .leftJoin(summaryRevSubbranch, eq(subbranchSubquery.subbranch, summaryRevSubbranch.subbranch))
                .leftJoin(subbranchTargetRevenue, eq(subbranchSubquery.subbranch, subbranchTargetRevenue.subbranch))
                .groupBy(subbranchSubquery.subbranch)

            const clusterHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'CLUSTER'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    revAllAbsolut: sql<number>`''`,
                    yoyAll: sql<string>`''`,
                    qoqAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revBB: sql<number>`''`,
                    revBBAbsolut: sql<number>`''`,
                    bbMom: sql<string>`''`,
                    bbYoy: sql<string>`''`,
                    bbQoq: sql<string>`''`,
                    bbYtd: sql<string>`''`,
                    contrBB: sql<string>`''`,
                    revDigital: sql<number>`''`,
                    revDigitalAbsolut: sql<number>`''`,
                    digitalMom: sql<string>`''`,
                    digitalYoy: sql<string>`''`,
                    digitalQoq: sql<string>`''`,
                    digitalYtd: sql<string>`''`,
                    contrDigital: sql<string>`''`,
                    revVoice: sql<number>`''`,
                    revVoiceAbsolut: sql<number>`''`,
                    voiceMom: sql<string>`''`,
                    voiceYoy: sql<string>`''`,
                    voiceQoq: sql<string>`''`,
                    voiceYtd: sql<string>`''`,
                    contrVoice: sql<string>`''`,
                    revSms: sql<number>`''`,
                    revSmsAbsolut: sql<number>`''`,
                    smsMom: sql<string>`''`,
                    smsYoy: sql<string>`''`,
                    smsQoq: sql<string>`''`,
                    smsYtd: sql<string>`''`,
                    contrSms: sql<string>`''`
                })
                .from(feiTargetPuma)

            const clusterSubquery = db
                .select({ cluster: territoryArea4.cluster })
                .from(territoryArea4)
                .where(branch && subbranch && cluster ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                ) : branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.cluster)
                .as('a')

            const summaryRevCluster = db
                .select({
                    cluster: summaryRevAllCluster.cluster,
                    revAllM: summaryRevAllCluster.rev_all_m,
                    revAllMom: summaryRevAllCluster.rev_all_mom,
                    revAllAbsolut: summaryRevAllCluster.rev_all_absolut,
                    revAllYoy: summaryRevAllCluster.rev_all_yoy,
                    revAllYtd: summaryRevAllCluster.rev_all_ytd,
                    revAllQoq: summaryRevAllCluster.rev_all_qoq,
                    revBBM: summaryRevAllCluster.rev_bb_m,
                    revBBMom: summaryRevAllCluster.rev_bb_mom,
                    revBBAbsolut: summaryRevAllCluster.rev_bb_absolut,
                    revBBYoy: summaryRevAllCluster.rev_bb_yoy,
                    revBBYtd: summaryRevAllCluster.rev_bb_ytd,
                    revBBQoq: summaryRevAllCluster.rev_bb_qoq,
                    revVoiceM: summaryRevAllCluster.rev_voice_m,
                    revVoiceMom: summaryRevAllCluster.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllCluster.rev_voice_absol,
                    revVoiceYoy: summaryRevAllCluster.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllCluster.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllCluster.rev_voice_qoq,
                    revDigitalM: summaryRevAllCluster.rev_digital_m,
                    revDigitalMom: summaryRevAllCluster.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllCluster.rev_digital_absol,
                    revDigitalYoy: summaryRevAllCluster.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllCluster.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllCluster.rev_digital_qoq,
                    revSmSM: summaryRevAllCluster.rev_sms_m,
                    revSmSMom: summaryRevAllCluster.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllCluster.rev_sms_absolut,
                    revSmSYoy: summaryRevAllCluster.rev_sms_yoy,
                    revSmSYtd: summaryRevAllCluster.rev_sms_ytd,
                    revSmSQoq: summaryRevAllCluster.rev_sms_qoq,
                })
                .from(summaryRevAllCluster, { useIndex: index('summary_rev_all').on(summaryRevAllCluster.tgl, summaryRevAllCluster.area, summaryRevAllCluster.regional, summaryRevAllCluster.branch, summaryRevAllCluster.subbranch, summaryRevAllCluster.cluster, summaryRevAllCluster.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllCluster.tgl, currDate),
                    eq(summaryRevAllCluster.regional, 'PUMA'),
                    eq(summaryRevAllCluster.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllCluster.cluster)
                .as('b')

            const clusterTargetRevenue = db
                .select({
                    cluster: territoryArea4.cluster,
                    targetRevAll: sum(feiTargetPuma.rev_all).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.cluster)
                .as('c')

            const revenueCluster = db
                .select({
                    name: clusterSubquery.cluster,
                    targetAll: sql<number>`ROUND(SUM(${clusterTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevCluster.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revAllM})/SUM(${clusterTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revAllM})/(${today}/${daysInMonth}*(SUM(${clusterTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevCluster.revAllM}) - SUM(${clusterTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevCluster.revAllMom}, '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revAllAbsolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(${summaryRevCluster.revAllYoy}, '%')`.as('yoy_all'),
                    qoqAll: sql<string>`CONCAT(${summaryRevCluster.revAllQoq}, '%')`.as('qoq_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevCluster.revAllYtd}, '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevCluster.revBBM}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revBBAbsolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(${summaryRevCluster.revBBMom} ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(${summaryRevCluster.revBBYoy} ,'%')`.as('bb_yoy'),
                    bbQoq: sql<string>`CONCAT(${summaryRevCluster.revBBQoq} ,'%')`.as('bb_qoq'),
                    bbYtd: sql<string>`CONCAT(${summaryRevCluster.revBBYtd} ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revBBM})/SUM(${summaryRevCluster.revAllM}))*100,2),'%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevCluster.revDigitalM}),2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revDigitalAbsol}),2)`.as('rev_digital_absol'),
                    digitalMom: sql<string>`CONCAT(${summaryRevCluster.revDigitalMom} ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(${summaryRevCluster.revDigitalYoy} ,'%')`.as('digital_yoy'),
                    digitalQoq: sql<string>`CONCAT(${summaryRevCluster.revDigitalQoq} ,'%')`.as('digital_qoq'),
                    digitalYtd: sql<string>`CONCAT(${summaryRevCluster.revDigitalYtd} ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revDigitalM})/SUM(${summaryRevCluster.revAllM}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevCluster.revDigitalM}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revVoiceAbsol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(${summaryRevCluster.revDigitalMom} ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(${summaryRevCluster.revDigitalYoy} ,'%')`.as('voice_yoy'),
                    voiceQoq: sql<string>`CONCAT(${summaryRevCluster.revDigitalQoq} ,'%')`.as('voice_qoq'),
                    voiceYtd: sql<string>`CONCAT(${summaryRevCluster.revDigitalYtd} ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revVoiceM})/SUM(${summaryRevCluster.revAllM}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevCluster.revSmSM}),2)`.as('rev_voice'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevCluster.revSmSAbsolut}),2)`.as('rev_sms_absolut'),
                    smsMom: sql<string>`CONCAT(${summaryRevCluster.revSmSMom} ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(${summaryRevCluster.revSmSYoy} ,'%')`.as('sms_yoy'),
                    smsQoq: sql<string>`CONCAT(${summaryRevCluster.revSmSQoq} ,'%')`.as('sms_qoq'),
                    smsYtd: sql<string>`CONCAT(${summaryRevCluster.revSmSYtd} ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.revSmSM})/SUM(${summaryRevCluster.revAllM}))*100,2),'%')`.as('contr_sms')

                })
                .from(clusterSubquery)
                .leftJoin(summaryRevCluster, eq(clusterSubquery.cluster, summaryRevCluster.cluster))
                .leftJoin(clusterTargetRevenue, eq(clusterSubquery.cluster, clusterTargetRevenue.cluster))
                .groupBy(clusterSubquery.cluster)

            const kabupatenHeaderQuery = db
                .selectDistinct({
                    name: sql<string>`'KABUPATEN'`,
                    targetAll: sql<number>`''`,
                    revAll: sql<number>`''`,
                    achTargetFmAll: sql<string>`''`,
                    drrAll: sql<string>`''`,
                    gapToTargetAll: sql<number>`''`,
                    momAll: sql<string>`''`,
                    revAllAbsolut: sql<number>`''`,
                    yoyAll: sql<string>`''`,
                    qoqAll: sql<string>`''`,
                    ytdAll: sql<string>`''`,
                    revBB: sql<number>`''`,
                    revBBAbsolut: sql<number>`''`,
                    bbMom: sql<string>`''`,
                    bbYoy: sql<string>`''`,
                    bbQoq: sql<string>`''`,
                    bbYtd: sql<string>`''`,
                    contrBB: sql<string>`''`,
                    revDigital: sql<number>`''`,
                    revDigitalAbsolut: sql<number>`''`,
                    digitalMom: sql<string>`''`,
                    digitalYoy: sql<string>`''`,
                    digitalQoq: sql<string>`''`,
                    digitalYtd: sql<string>`''`,
                    contrDigital: sql<string>`''`,
                    revVoice: sql<number>`''`,
                    revVoiceAbsolut: sql<number>`''`,
                    voiceMom: sql<string>`''`,
                    voiceYoy: sql<string>`''`,
                    voiceQoq: sql<string>`''`,
                    voiceYtd: sql<string>`''`,
                    contrVoice: sql<string>`''`,
                    revSms: sql<number>`''`,
                    revSmsAbsolut: sql<number>`''`,
                    smsMom: sql<string>`''`,
                    smsYoy: sql<string>`''`,
                    smsQoq: sql<string>`''`,
                    smsYtd: sql<string>`''`,
                    contrSms: sql<string>`''`
                })
                .from(feiTargetPuma)

            const kabupatenSubquery = db
                .select({ kabupaten: territoryArea4.kabupaten })
                .from(territoryArea4)
                .where(branch && subbranch && cluster && kabupaten ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                    eq(territoryArea4.kabupaten, kabupaten),
                ) : branch && subbranch && cluster ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                    eq(territoryArea4.cluster, cluster),
                ) : branch && subbranch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                    eq(territoryArea4.subbranch, subbranch),
                ) : branch ? and(
                    eq(territoryArea4.regional, 'PUMA'),
                    eq(territoryArea4.branch, branch),
                ) : eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.kabupaten)
                .as('a')

            const summaryRevKabupaten = db
                .select({
                    kabupaten: summaryRevAllKabupaten.kabupaten,
                    revAllM: summaryRevAllKabupaten.rev_all_m,
                    revAllMom: summaryRevAllKabupaten.rev_all_mom,
                    revAllAbsolut: summaryRevAllKabupaten.rev_all_absolut,
                    revAllYoy: summaryRevAllKabupaten.rev_all_yoy,
                    revAllYtd: summaryRevAllKabupaten.rev_all_ytd,
                    revAllQoq: summaryRevAllKabupaten.rev_all_qoq,
                    revBBM: summaryRevAllKabupaten.rev_bb_m,
                    revBBMom: summaryRevAllKabupaten.rev_bb_mom,
                    revBBAbsolut: summaryRevAllKabupaten.rev_bb_absolut,
                    revBBYoy: summaryRevAllKabupaten.rev_bb_yoy,
                    revBBYtd: summaryRevAllKabupaten.rev_bb_ytd,
                    revBBQoq: summaryRevAllKabupaten.rev_bb_qoq,
                    revVoiceM: summaryRevAllKabupaten.rev_voice_m,
                    revVoiceMom: summaryRevAllKabupaten.rev_voice_mom,
                    revVoiceAbsol: summaryRevAllKabupaten.rev_voice_absol,
                    revVoiceYoy: summaryRevAllKabupaten.rev_voice_yoy,
                    revVoiceYtd: summaryRevAllKabupaten.rev_voice_ytd,
                    revVoiceQoq: summaryRevAllKabupaten.rev_voice_qoq,
                    revDigitalM: summaryRevAllKabupaten.rev_digital_m,
                    revDigitalMom: summaryRevAllKabupaten.rev_digital_mom,
                    revDigitalAbsol: summaryRevAllKabupaten.rev_digital_absol,
                    revDigitalYoy: summaryRevAllKabupaten.rev_digital_yoy,
                    revDigitalYtd: summaryRevAllKabupaten.rev_digital_ytd,
                    revDigitalQoq: summaryRevAllKabupaten.rev_digital_qoq,
                    revSmSM: summaryRevAllKabupaten.rev_sms_m,
                    revSmSMom: summaryRevAllKabupaten.rev_sms_mom,
                    revSmSAbsolut: summaryRevAllKabupaten.rev_sms_absolut,
                    revSmSYoy: summaryRevAllKabupaten.rev_sms_yoy,
                    revSmSYtd: summaryRevAllKabupaten.rev_sms_ytd,
                    revSmSQoq: summaryRevAllKabupaten.rev_sms_qoq,
                })
                .from(summaryRevAllKabupaten, { useIndex: index('summary_rev_all').on(summaryRevAllKabupaten.tgl, summaryRevAllKabupaten.area, summaryRevAllKabupaten.regional, summaryRevAllKabupaten.branch, summaryRevAllKabupaten.subbranch, summaryRevAllKabupaten.cluster, summaryRevAllKabupaten.kabupaten, summaryRevAllKabupaten.newAbcStrate) })
                .where(and(
                    eq(summaryRevAllKabupaten.tgl, currDate),
                    eq(summaryRevAllKabupaten.regional, 'PUMA'),
                    eq(summaryRevAllKabupaten.newAbcStrate, 'all')
                ))
                .groupBy(summaryRevAllKabupaten.kabupaten)
                .as('b')

            const kabupatenTargetRevenue = db
                .select({
                    kabupaten: territoryArea4.kabupaten,
                    targetRevAll: sum(feiTargetPuma.rev_all).as('target_rev_all')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.kabupaten)
                .as('c')

            const revenueKabupaten = db
                .select({
                    name: kabupatenSubquery.kabupaten,
                    targetAll: sql<number>`ROUND(SUM(${kabupatenTargetRevenue.targetRevAll}),2)`.as('target_all'),
                    revAll: sql<number>`ROUND(SUM(${summaryRevKabupaten.revAllM}),2)`.as('rev_all'),
                    achTargetFmAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revAllM})/SUM(${kabupatenTargetRevenue.targetRevAll}))*100,2),'%')`.as('ach_target_fm_all'),
                    drrAll: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revAllM})/(${today}/${daysInMonth}*(SUM(${kabupatenTargetRevenue.targetRevAll}))))*100,2),'%')`.as('drr_all'),
                    gapToTargetAll: sql<number>`ROUND((COALESCE(SUM(${summaryRevKabupaten.revAllM}) - SUM(${kabupatenTargetRevenue.targetRevAll}),0)),2)`.as('gap_to_target_all'),
                    momAll: sql<string>`CONCAT(${summaryRevKabupaten.revAllMom}, '%')`.as('mom_all'),
                    revAllAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revAllAbsolut}),2)`.as('rev_all_absolut'),
                    yoyAll: sql<string>`CONCAT(${summaryRevKabupaten.revAllYoy}, '%')`.as('yoy_all'),
                    qoqAll: sql<string>`CONCAT(${summaryRevKabupaten.revAllQoq}, '%')`.as('qoq_all'),
                    ytdAll: sql<string>`CONCAT(${summaryRevKabupaten.revAllYtd}, '%')`.as('ytd_all'),
                    revBB: sql<number>`ROUND(SUM(${summaryRevKabupaten.revBBM}),2)`.as('rev_bb'),
                    revBBAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revBBAbsolut}),2)`.as('rev_bb_absolut'),
                    bbMom: sql<string>`CONCAT(${summaryRevKabupaten.revBBMom} ,'%')`.as('bb_mom'),
                    bbYoy: sql<string>`CONCAT(${summaryRevKabupaten.revBBYoy} ,'%')`.as('bb_yoy'),
                    bbQoq: sql<string>`CONCAT(${summaryRevKabupaten.revBBQoq} ,'%')`.as('bb_qoq'),
                    bbYtd: sql<string>`CONCAT(${summaryRevKabupaten.revBBYtd} ,'%')`.as('bb_ytd'),
                    contrBB: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revBBM})/SUM(${summaryRevKabupaten.revAllM}))*100,2),'%')`.as('contr_bb'),
                    revDigital: sql<number>`ROUND(SUM(${summaryRevKabupaten.revDigitalM}),2)`.as('rev_digital'),
                    revDigitalAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revDigitalAbsol}),2)`.as('rev_digital_absolut'),
                    digitalMom: sql<string>`CONCAT(${summaryRevKabupaten.revDigitalMom} ,'%')`.as('digital_mom'),
                    digitalYoy: sql<string>`CONCAT(${summaryRevKabupaten.revDigitalYoy} ,'%')`.as('digital_yoy'),
                    digitalQoq: sql<string>`CONCAT(${summaryRevKabupaten.revDigitalQoq} ,'%')`.as('digital_qoq'),
                    digitalYtd: sql<string>`CONCAT(${summaryRevKabupaten.revDigitalYtd} ,'%')`.as('digital_ytd'),
                    contrDigital: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revDigitalM})/SUM(${summaryRevKabupaten.revAllM}))*100,2),'%')`.as('contr_digital'),
                    revVoice: sql<number>`ROUND(SUM(${summaryRevKabupaten.revDigitalM}),2)`.as('rev_voice'),
                    revVoiceAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revVoiceAbsol}),2)`.as('rev_voice_absol'),
                    voiceMom: sql<string>`CONCAT(${summaryRevKabupaten.revDigitalMom} ,'%')`.as('voice_mom'),
                    voiceYoy: sql<string>`CONCAT(${summaryRevKabupaten.revDigitalYoy} ,'%')`.as('voice_yoy'),
                    voiceQoq: sql<string>`CONCAT(${summaryRevKabupaten.revDigitalQoq} ,'%')`.as('voice_qoq'),
                    voiceYtd: sql<string>`CONCAT(${summaryRevKabupaten.revDigitalYtd} ,'%')`.as('voice_ytd'),
                    contrVoice: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revVoiceM})/SUM(${summaryRevKabupaten.revAllM}))*100,2),'%')`.as('contr_voice'),
                    revSms: sql<number>`ROUND(SUM(${summaryRevKabupaten.revSmSM}),2)`.as('rev_voice'),
                    revSmsAbsolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.revSmSAbsolut}),2)`.as('rev_sms_absol'),
                    smsMom: sql<string>`CONCAT(${summaryRevKabupaten.revSmSMom} ,'%')`.as('sms_mom'),
                    smsYoy: sql<string>`CONCAT(${summaryRevKabupaten.revSmSYoy} ,'%')`.as('sms_yoy'),
                    smsQoq: sql<string>`CONCAT(${summaryRevKabupaten.revSmSQoq} ,'%')`.as('sms_qoq'),
                    smsYtd: sql<string>`CONCAT(${summaryRevKabupaten.revSmSYtd} ,'%')`.as('sms_ytd'),
                    contrSms: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.revSmSM})/SUM(${summaryRevKabupaten.revAllM}))*100,2),'%')`.as('contr_sms')
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


export default app