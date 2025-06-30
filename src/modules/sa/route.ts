import { Hono } from "hono";
import { z } from 'zod'
import { and, asc, between, eq, inArray, not, notInArray, sql, sum } from "drizzle-orm";
import { subMonths, subDays, format, subYears, endOfMonth, startOfMonth, getDaysInMonth } from 'date-fns'
import { index, unionAll } from "drizzle-orm/mysql-core";

import { db, db6 } from "@/db";
import {
    branches,
    regionals,
    clusters,
    kabupatens,
    subbranches,
    territoryArea4,
} from "@/db/schema/puma_2025";
import { zValidator } from "@/lib/validator-wrapper";
import { dynamicRevenueSATable } from "@/db/schema/digipos_revamp";
import { summarySaAllRegional, summarySaAllBranch, summarySaAllSubbranch, summarySaAllCluster, summarySaAllKabupaten, feiTargetPuma } from '@/db/schema/v_honai_puma'
import type { CurrYtDRevenue, PrevYtDRevenue, Regional } from "@/types";

const app = new Hono()
    .get('/revenue-sa', zValidator('query', z.object({ date: z.coerce.date().optional(), branch: z.string().optional(), subbranch: z.string().optional(), cluster: z.string().optional(), kabupaten: z.string().optional() })),
        async c => {
            const { date, branch, subbranch, cluster, kabupaten } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 3)

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const latestMonth = parseInt(format(selectedDate, 'M'), 10)
            const isPrevMonthLastYear = currMonth === '01'
            const prevMonth = isPrevMonthLastYear ? '12' : format(subMonths(selectedDate, 1), 'MM')
            const prevMonthYear = isPrevMonthLastYear ? format(subYears(selectedDate, 1), 'yyyy') : format(selectedDate, 'yyyy')
            const prevYear = format(subYears(selectedDate, 1), 'yyyy')

            // VARIABLE TANGGAL
            // Get the last day of the selected month
            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            const daysInMonth = getDaysInMonth(selectedDate)
            const today = Number(format(selectedDate, 'd'))

            const currDate = format(endOfCurrMonth, 'yyyy-MM-dd');
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');
            const yyyyMM = format(selectedDate, 'yyyyMM')

            const currJanuaryFirst = `${currYear}-01-01`
            const prevJanuaryFirst = `${prevYear}-01-01`

            const regionalSubquery = db
                .select({ regional: territoryArea4.regional })
                .from(territoryArea4)
                .where(eq(territoryArea4.regional, 'PUMA'))
                .groupBy(territoryArea4.regional)
                .as('a')

            const summaryRevRegional = db
                .select({
                    regional: summarySaAllRegional.regional,
                    rev_mom_all: summarySaAllRegional.rev_mom_all,
                    rev_total_cur: summarySaAllRegional.rev_total_cur,
                    rev_all_m: sql<number>`SUM(CASE WHEN ${summarySaAllRegional.tgl} = ${currDate} THEN ${summarySaAllRegional.rev_total_cur} ELSE 0 END)`.as('rev_all_m'),
                    rev_all_m1: sql<number>`SUM(CASE WHEN ${summarySaAllRegional.tgl} = ${prevDate} THEN ${summarySaAllRegional.rev_total_cur} ELSE 0 END)`.as('rev_all_m1'),
                    rev_all_m12: sql<number>`SUM(CASE WHEN ${summarySaAllRegional.tgl} = ${prevYearCurrDate} THEN ${summarySaAllRegional.rev_total_cur} ELSE 0 END)`.as('rev_all_m12'),
                    rev_all_ytd: sql<number>`SUM(CASE WHEN ${summarySaAllRegional.tgl} BETWEEN ${currJanuaryFirst} AND ${currDate} THEN ${summarySaAllRegional.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd'),
                    rev_all_ytd1: sql<number>`SUM(CASE WHEN ${summarySaAllRegional.tgl} BETWEEN ${prevJanuaryFirst} AND ${prevYearCurrDate} THEN ${summarySaAllRegional.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd1'),
                })
                .from(summarySaAllRegional, {
                    useIndex: [
                        index('tgl').on(summarySaAllRegional.tgl),
                        index('regional').on(summarySaAllRegional.regional)
                    ]
                })
                .where(eq(summarySaAllRegional.regional, 'PUMA'))
                .groupBy(summarySaAllRegional.regional)
                .as('b')

            const regionalTargetRevenue = db
                .select({
                    regional: territoryArea4.regional,
                    target_rev_sa: sum(feiTargetPuma.rev_sa).as('target_rev_sa')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.regional)
                .as('c')

            const revenueRegional = db
                .select({
                    name: regionalSubquery.regional,
                    target_rev_sa: sql<number>`ROUND(SUM(${regionalTargetRevenue.target_rev_sa}),2)`.as('target_sa'),
                    rev_sa: sql<number>`ROUND(SUM(${summaryRevRegional.rev_all_m}),2)`.as('rev_sa'),
                    ach_target_fm_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.rev_all_m})/SUM(${regionalTargetRevenue.target_rev_sa}))*100,2),'%')`.as('ach_target_fm_sa'),
                    drr_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevRegional.rev_all_m})/(${today}/${daysInMonth}*(SUM(${regionalTargetRevenue.target_rev_sa}))))*100,2),'%')`.as('drr_sa'),
                    gap_to_target_sa: sql<number>`ROUND((COALESCE(SUM(${summaryRevRegional.rev_all_m}) - SUM(${regionalTargetRevenue.target_rev_sa}),0)),2)`.as('gap_to_target_sa'),
                    mom_sa: sql<string>`CONCAT(${summaryRevRegional.rev_mom_all}, '%')`.as('mom_sa'),
                    rev_sa_absolut: sql<number>`ROUND(SUM(${summaryRevRegional.rev_all_m} - ${summaryRevRegional.rev_all_m1}),2)`.as('rev_sa_absolut'),
                    yoy_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevRegional.rev_all_m}) - SUM(${summaryRevRegional.rev_all_m12})) / ${summaryRevRegional.rev_all_m12} * 100, 0), 2), '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevRegional.rev_all_ytd}) - SUM(${summaryRevRegional.rev_all_ytd1})) / ${summaryRevRegional.rev_all_ytd1} * 100, 0), 2), '%')`.as('ytd_sa'),
                })
                .from(regionalSubquery)
                .leftJoin(summaryRevRegional, eq(regionalSubquery.regional, summaryRevRegional.regional))
                .leftJoin(regionalTargetRevenue, eq(regionalSubquery.regional, regionalTargetRevenue.regional))
                .groupBy(regionalSubquery.regional)

            const branchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'BRANCH'`,
                    target_rev_sa: sql<number>`''`,
                    rev_sa: sql<number>`''`,
                    ach_target_fm_sa: sql<string>`''`,
                    drr_sa: sql<string>`''`,
                    gap_to_target_sa: sql<number>`''`,
                    mom_sa: sql<string>`''`,
                    rev_sa_absolut: sql<number>`''`,
                    yoy_sa: sql<string>`''`,
                    ytd_sa: sql<string>`''`,
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
                    branch: summarySaAllBranch.branch,
                    rev_mom_all: summarySaAllBranch.rev_mom_all,
                    rev_total_cur: summarySaAllBranch.rev_total_cur,
                    rev_all_m: sql<number>`SUM(CASE WHEN ${summarySaAllBranch.tgl} = ${currDate} THEN ${summarySaAllBranch.rev_total_cur} ELSE 0 END)`.as('rev_all_m'),
                    rev_all_m1: sql<number>`SUM(CASE WHEN ${summarySaAllBranch.tgl} = ${prevDate} THEN ${summarySaAllBranch.rev_total_cur} ELSE 0 END)`.as('rev_all_m1'),
                    rev_all_m12: sql<number>`SUM(CASE WHEN ${summarySaAllBranch.tgl} = ${prevYearCurrDate} THEN ${summarySaAllBranch.rev_total_cur} ELSE 0 END)`.as('rev_all_m12'),
                    rev_all_ytd: sql<number>`SUM(CASE WHEN ${summarySaAllBranch.tgl} BETWEEN ${currJanuaryFirst} AND ${currDate} THEN ${summarySaAllBranch.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd'),
                    rev_all_ytd1: sql<number>`SUM(CASE WHEN ${summarySaAllBranch.tgl} BETWEEN ${prevJanuaryFirst} AND ${prevYearCurrDate} THEN ${summarySaAllBranch.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd1'),
                })
                .from(summarySaAllBranch, {
                    useIndex: [
                        index('tgl').on(summarySaAllBranch.tgl),
                        index('regional').on(summarySaAllBranch.regional),
                        index('branch').on(summarySaAllBranch.branch),
                    ]
                })
                .where(eq(summarySaAllBranch.regional, 'PUMA'))
                .groupBy(summarySaAllBranch.branch)
                .as('b')

            const branchTargetRevenue = db
                .select({
                    branch: territoryArea4.branch,
                    target_rev_sa: sum(feiTargetPuma.rev_sa).as('target_rev_sa')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.branch)
                .as('c')

            const revenueBranch = db
                .select({
                    name: branchSubquery.branch,
                    target_rev_sa: sql<number>`ROUND(SUM(${branchTargetRevenue.target_rev_sa}),2)`.as('target_sa'),
                    rev_sa: sql<number>`ROUND(SUM(${summaryRevBranch.rev_all_m}),2)`.as('rev_sa'),
                    ach_target_fm_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.rev_all_m})/SUM(${branchTargetRevenue.target_rev_sa}))*100,2),'%')`.as('ach_target_fm_sa'),
                    drr_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevBranch.rev_all_m})/(${today}/${daysInMonth}*(SUM(${branchTargetRevenue.target_rev_sa}))))*100,2),'%')`.as('drr_sa'),
                    gap_to_target_sa: sql<number>`ROUND((COALESCE(SUM(${summaryRevBranch.rev_all_m}) - SUM(${branchTargetRevenue.target_rev_sa}),0)),2)`.as('gap_to_target_sa'),
                    mom_sa: sql<string>`CONCAT(${summaryRevBranch.rev_mom_all}, '%')`.as('mom_sa'),
                    rev_sa_absolut: sql<number>`ROUND(SUM(${summaryRevBranch.rev_all_m} - ${summaryRevBranch.rev_all_m1}),2)`.as('rev_sa_absolut'),
                    yoy_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevBranch.rev_all_m}) - SUM(${summaryRevBranch.rev_all_m12})) / ${summaryRevBranch.rev_all_m12} * 100, 0), 2), '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevBranch.rev_all_ytd}) - SUM(${summaryRevBranch.rev_all_ytd1})) / ${summaryRevBranch.rev_all_ytd1} * 100, 0), 2), '%')`.as('ytd_sa'),
                })
                .from(branchSubquery)
                .leftJoin(summaryRevBranch, eq(branchSubquery.branch, summaryRevBranch.branch))
                .leftJoin(branchTargetRevenue, eq(branchSubquery.branch, branchTargetRevenue.branch))
                .groupBy(branchSubquery.branch)

            const subbranchHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'SUBBRANCH'`,
                    target_rev_sa: sql<number>`''`,
                    rev_sa: sql<number>`''`,
                    ach_target_fm_sa: sql<string>`''`,
                    drr_sa: sql<string>`''`,
                    gap_to_target_sa: sql<number>`''`,
                    mom_sa: sql<string>`''`,
                    rev_sa_absolut: sql<number>`''`,
                    yoy_sa: sql<string>`''`,
                    ytd_sa: sql<string>`''`,
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
                    subbranch: summarySaAllSubbranch.subbranch,
                    rev_mom_all: summarySaAllSubbranch.rev_mom_all,
                    rev_total_cur: summarySaAllSubbranch.rev_total_cur,
                    rev_all_m: sql<number>`SUM(CASE WHEN ${summarySaAllSubbranch.tgl} = ${currDate} THEN ${summarySaAllSubbranch.rev_total_cur} ELSE 0 END)`.as('rev_all_m'),
                    rev_all_m1: sql<number>`SUM(CASE WHEN ${summarySaAllSubbranch.tgl} = ${prevDate} THEN ${summarySaAllSubbranch.rev_total_cur} ELSE 0 END)`.as('rev_all_m1'),
                    rev_all_m12: sql<number>`SUM(CASE WHEN ${summarySaAllSubbranch.tgl} = ${prevYearCurrDate} THEN ${summarySaAllSubbranch.rev_total_cur} ELSE 0 END)`.as('rev_all_m12'),
                    rev_all_ytd: sql<number>`SUM(CASE WHEN ${summarySaAllSubbranch.tgl} BETWEEN ${currJanuaryFirst} AND ${currDate} THEN ${summarySaAllSubbranch.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd'),
                    rev_all_ytd1: sql<number>`SUM(CASE WHEN ${summarySaAllSubbranch.tgl} BETWEEN ${prevJanuaryFirst} AND ${prevYearCurrDate} THEN ${summarySaAllSubbranch.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd1'),
                })
                .from(summarySaAllSubbranch, {
                    useIndex: [
                        index('tgl').on(summarySaAllSubbranch.tgl),
                        index('regional').on(summarySaAllSubbranch.regional),
                        index('branch').on(summarySaAllSubbranch.branch),
                        index('subbranch').on(summarySaAllSubbranch.subbranch),
                    ]
                })
                .where(eq(summarySaAllSubbranch.regional, 'PUMA'))
                .groupBy(summarySaAllSubbranch.subbranch)
                .as('b')

            const subbranchTargetRevenue = db
                .select({
                    subbranch: territoryArea4.subbranch,
                    target_rev_sa: sum(feiTargetPuma.rev_sa).as('target_rev_sa')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.subbranch)
                .as('c')

            const revenueSubbranch = db
                .select({
                    name: subbranchSubquery.subbranch,
                    target_rev_sa: sql<number>`ROUND(SUM(${subbranchTargetRevenue.target_rev_sa}),2)`.as('target_sa'),
                    rev_sa: sql<number>`ROUND(SUM(${summaryRevSubbranch.rev_all_m}),2)`.as('rev_sa'),
                    ach_target_fm_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.rev_all_m})/SUM(${subbranchTargetRevenue.target_rev_sa}))*100,2),'%')`.as('ach_target_fm_sa'),
                    drr_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevSubbranch.rev_all_m})/(${today}/${daysInMonth}*(SUM(${subbranchTargetRevenue.target_rev_sa}))))*100,2),'%')`.as('drr_sa'),
                    gap_to_target_sa: sql<number>`ROUND((COALESCE(SUM(${summaryRevSubbranch.rev_all_m}) - SUM(${subbranchTargetRevenue.target_rev_sa}),0)),2)`.as('gap_to_target_sa'),
                    mom_sa: sql<string>`CONCAT(${summaryRevSubbranch.rev_mom_all}, '%')`.as('mom_sa'),
                    rev_sa_absolut: sql<number>`ROUND(SUM(${summaryRevSubbranch.rev_all_m} - ${summaryRevSubbranch.rev_all_m1}),2)`.as('rev_sa_absolut'),
                    yoy_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevSubbranch.rev_all_m}) - SUM(${summaryRevSubbranch.rev_all_m12})) / ${summaryRevSubbranch.rev_all_m12} * 100, 0), 2), '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevSubbranch.rev_all_ytd}) - SUM(${summaryRevSubbranch.rev_all_ytd1})) / ${summaryRevSubbranch.rev_all_ytd1} * 100, 0), 2), '%')`.as('ytd_sa'),
                })
                .from(subbranchSubquery)
                .leftJoin(summaryRevSubbranch, eq(subbranchSubquery.subbranch, summaryRevSubbranch.subbranch))
                .leftJoin(subbranchTargetRevenue, eq(subbranchSubquery.subbranch, subbranchTargetRevenue.subbranch))
                .groupBy(subbranchSubquery.subbranch)

            const clusterHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'CLUSTER'`,
                    target_rev_sa: sql<number>`''`,
                    rev_sa: sql<number>`''`,
                    ach_target_fm_sa: sql<string>`''`,
                    drr_sa: sql<string>`''`,
                    gap_to_target_sa: sql<number>`''`,
                    mom_sa: sql<string>`''`,
                    rev_sa_absolut: sql<number>`''`,
                    yoy_sa: sql<string>`''`,
                    ytd_sa: sql<string>`''`,
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
                    cluster: summarySaAllCluster.cluster,
                    rev_mom_all: summarySaAllCluster.rev_mom_all,
                    rev_total_cur: summarySaAllCluster.rev_total_cur,
                    rev_all_m: sql<number>`SUM(CASE WHEN ${summarySaAllCluster.tgl} = ${currDate} THEN ${summarySaAllCluster.rev_total_cur} ELSE 0 END)`.as('rev_all_m'),
                    rev_all_m1: sql<number>`SUM(CASE WHEN ${summarySaAllCluster.tgl} = ${prevDate} THEN ${summarySaAllCluster.rev_total_cur} ELSE 0 END)`.as('rev_all_m1'),
                    rev_all_m12: sql<number>`SUM(CASE WHEN ${summarySaAllCluster.tgl} = ${prevYearCurrDate} THEN ${summarySaAllCluster.rev_total_cur} ELSE 0 END)`.as('rev_all_m12'),
                    rev_all_ytd: sql<number>`SUM(CASE WHEN ${summarySaAllCluster.tgl} BETWEEN ${currJanuaryFirst} AND ${currDate} THEN ${summarySaAllCluster.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd'),
                    rev_all_ytd1: sql<number>`SUM(CASE WHEN ${summarySaAllCluster.tgl} BETWEEN ${prevJanuaryFirst} AND ${prevYearCurrDate} THEN ${summarySaAllCluster.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd1'),
                })
                .from(summarySaAllCluster, {
                    useIndex: [
                        index('tgl').on(summarySaAllCluster.tgl),
                        index('regional').on(summarySaAllCluster.regional),
                        index('branch').on(summarySaAllCluster.branch),
                        index('subbranch').on(summarySaAllCluster.subbranch),
                        index('cluster').on(summarySaAllCluster.cluster),
                    ]
                })
                .where(eq(summarySaAllCluster.regional, 'PUMA'))
                .groupBy(summarySaAllCluster.cluster)
                .as('b')

            const clusterTargetRevenue = db
                .select({
                    cluster: territoryArea4.cluster,
                    target_rev_sa: sum(feiTargetPuma.rev_sa).as('target_rev_sa')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.cluster)
                .as('c')

            const revenueCluster = db
                .select({
                    name: clusterSubquery.cluster,
                    target_rev_sa: sql<number>`ROUND(SUM(${clusterTargetRevenue.target_rev_sa}),2)`.as('target_sa'),
                    rev_sa: sql<number>`ROUND(SUM(${summaryRevCluster.rev_all_m}),2)`.as('rev_sa'),
                    ach_target_fm_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.rev_all_m})/SUM(${clusterTargetRevenue.target_rev_sa}))*100,2),'%')`.as('ach_target_fm_sa'),
                    drr_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevCluster.rev_all_m})/(${today}/${daysInMonth}*(SUM(${clusterTargetRevenue.target_rev_sa}))))*100,2),'%')`.as('drr_sa'),
                    gap_to_target_sa: sql<number>`ROUND((COALESCE(SUM(${summaryRevCluster.rev_all_m}) - SUM(${clusterTargetRevenue.target_rev_sa}),0)),2)`.as('gap_to_target_sa'),
                    mom_sa: sql<string>`CONCAT(${summaryRevCluster.rev_mom_all}, '%')`.as('mom_sa'),
                    rev_sa_absolut: sql<number>`ROUND(SUM(${summaryRevCluster.rev_all_m} - ${summaryRevCluster.rev_all_m1}),2)`.as('rev_sa_absolut'),
                    yoy_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevCluster.rev_all_m}) - SUM(${summaryRevCluster.rev_all_m12})) / ${summaryRevCluster.rev_all_m12} * 100, 0), 2), '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevCluster.rev_all_ytd}) - SUM(${summaryRevCluster.rev_all_ytd1})) / ${summaryRevCluster.rev_all_ytd1} * 100, 0), 2), '%')`.as('ytd_sa'),
                })
                .from(clusterSubquery)
                .leftJoin(summaryRevCluster, eq(clusterSubquery.cluster, summaryRevCluster.cluster))
                .leftJoin(clusterTargetRevenue, eq(clusterSubquery.cluster, clusterTargetRevenue.cluster))
                .groupBy(clusterSubquery.cluster)

            const kabupatenHeaderQuery = db
                .selectDistinct({
                    name: sql<string | null>`'KABUPATEN'`,
                    target_rev_sa: sql<number>`''`,
                    rev_sa: sql<number>`''`,
                    ach_target_fm_sa: sql<string>`''`,
                    drr_sa: sql<string>`''`,
                    gap_to_target_sa: sql<number>`''`,
                    mom_sa: sql<string>`''`,
                    rev_sa_absolut: sql<number>`''`,
                    yoy_sa: sql<string>`''`,
                    ytd_sa: sql<string>`''`,
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
                    kabupaten: summarySaAllKabupaten.kabupaten,
                    rev_mom_all: summarySaAllKabupaten.rev_mom_all,
                    rev_total_cur: summarySaAllKabupaten.rev_total_cur,
                    rev_all_m: sql<number>`SUM(CASE WHEN ${summarySaAllKabupaten.tgl} = ${currDate} THEN ${summarySaAllKabupaten.rev_total_cur} ELSE 0 END)`.as('rev_all_m'),
                    rev_all_m1: sql<number>`SUM(CASE WHEN ${summarySaAllKabupaten.tgl} = ${prevDate} THEN ${summarySaAllKabupaten.rev_total_cur} ELSE 0 END)`.as('rev_all_m1'),
                    rev_all_m12: sql<number>`SUM(CASE WHEN ${summarySaAllKabupaten.tgl} = ${prevYearCurrDate} THEN ${summarySaAllKabupaten.rev_total_cur} ELSE 0 END)`.as('rev_all_m12'),
                    rev_all_ytd: sql<number>`SUM(CASE WHEN ${summarySaAllKabupaten.tgl} BETWEEN ${currJanuaryFirst} AND ${currDate} THEN ${summarySaAllKabupaten.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd'),
                    rev_all_ytd1: sql<number>`SUM(CASE WHEN ${summarySaAllKabupaten.tgl} BETWEEN ${prevJanuaryFirst} AND ${prevYearCurrDate} THEN ${summarySaAllKabupaten.rev_total_cur} ELSE 0 END)`.as('rev_all_ytd1'),
                })
                .from(summarySaAllKabupaten, {
                    useIndex: [
                        index('tgl').on(summarySaAllKabupaten.tgl),
                        index('regional').on(summarySaAllKabupaten.regional),
                        index('branch').on(summarySaAllKabupaten.branch),
                        index('subbranch').on(summarySaAllKabupaten.subbranch),
                        index('kabupaten').on(summarySaAllKabupaten.kabupaten),
                    ]
                })
                .where(eq(summarySaAllKabupaten.regional, 'PUMA'))
                .groupBy(summarySaAllKabupaten.kabupaten)
                .as('b')

            const kabupatenTargetRevenue = db
                .select({
                    kabupaten: territoryArea4.kabupaten,
                    target_rev_sa: sum(feiTargetPuma.rev_sa).as('target_rev_sa')
                })
                .from(feiTargetPuma)
                .rightJoin(territoryArea4, eq(feiTargetPuma.territory, territoryArea4.kabupaten))
                .where(eq(feiTargetPuma.periode, yyyyMM))
                .groupBy(territoryArea4.kabupaten)
                .as('c')

            const revenueKabupaten = db
                .select({
                    name: kabupatenSubquery.kabupaten,
                    target_rev_sa: sql<number>`ROUND(SUM(${kabupatenTargetRevenue.target_rev_sa}),2)`.as('target_sa'),
                    rev_sa: sql<number>`ROUND(SUM(${summaryRevKabupaten.rev_all_m}),2)`.as('rev_sa'),
                    ach_target_fm_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.rev_all_m})/SUM(${kabupatenTargetRevenue.target_rev_sa}))*100,2),'%')`.as('ach_target_fm_sa'),
                    drr_sa: sql<string>`CONCAT(ROUND((SUM(${summaryRevKabupaten.rev_all_m})/(${today}/${daysInMonth}*(SUM(${kabupatenTargetRevenue.target_rev_sa}))))*100,2),'%')`.as('drr_sa'),
                    gap_to_target_sa: sql<number>`ROUND((COALESCE(SUM(${summaryRevKabupaten.rev_all_m}) - SUM(${kabupatenTargetRevenue.target_rev_sa}),0)),2)`.as('gap_to_target_sa'),
                    mom_sa: sql<string>`CONCAT(${summaryRevKabupaten.rev_mom_all}, '%')`.as('mom_sa'),
                    rev_sa_absolut: sql<number>`ROUND(SUM(${summaryRevKabupaten.rev_all_m} - ${summaryRevKabupaten.rev_all_m1}),2)`.as('rev_sa_absolut'),
                    yoy_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevKabupaten.rev_all_m}) - SUM(${summaryRevKabupaten.rev_all_m12})) / ${summaryRevKabupaten.rev_all_m12} * 100, 0), 2), '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(ROUND(COALESCE((SUM(${summaryRevKabupaten.rev_all_ytd}) - SUM(${summaryRevKabupaten.rev_all_ytd1})) / ${summaryRevKabupaten.rev_all_ytd1} * 100, 0), 2), '%')`.as('ytd_sa'),
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