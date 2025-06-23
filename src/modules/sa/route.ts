import { Hono } from "hono";
import { z } from 'zod'
import { and, asc, between, eq, inArray, not, notInArray, sql, sum } from "drizzle-orm";
import { subMonths, subDays, format, subYears, endOfMonth, startOfMonth, getDaysInMonth } from 'date-fns'
import { index, unionAll } from "drizzle-orm/mysql-core";
import { MySqlRawQueryResult } from "drizzle-orm/mysql2";

import { db, db6 } from "@/db";
import {
    branches,
    regionals,
    clusters,
    kabupatens,
    subbranches,
    revenueSA,
    revenueSAByu,
    revenueSAPrabayar,
    trxSA,
    trxSAPrabayar,
    trxSAByu,
    territoryArea4,
} from "@/db/schema/puma_2025";
import { zValidator } from "@/lib/validator-wrapper";
import { dynamicRevenueSATable } from "@/db/schema/digipos_revamp";
import { summarySaAllRegional, summarySaAllBranch, summarySaAllSubbranch, summarySaAllCluster, summarySaAllKabupaten, feiTargetPuma } from '@/db/schema/v_honai_puma'
import type { CurrYtDRevenue, PrevYtDRevenue, Regional } from "@/types";

const app = new Hono()
    .get('/revenue-sa', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
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
                    yoy_sa: sql<string>`CONCAT(SUM(${summaryRevRegional.rev_all_m} - ${summaryRevRegional.rev_all_m12})/${summaryRevRegional.rev_all_m12}*100, '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(SUM(${summaryRevRegional.rev_all_ytd} - ${summaryRevRegional.rev_all_ytd1})/${summaryRevRegional.rev_all_ytd1}*100, '%')`.as('ytd_sa'),
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
                .where(eq(territoryArea4.regional, 'PUMA'))
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
                    yoy_sa: sql<string>`CONCAT(SUM(${summaryRevBranch.rev_all_m} - ${summaryRevBranch.rev_all_m12})/${summaryRevBranch.rev_all_m12}*100, '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(SUM(${summaryRevBranch.rev_all_ytd} - ${summaryRevBranch.rev_all_ytd1})/${summaryRevBranch.rev_all_ytd1}*100, '%')`.as('ytd_sa'),
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
                .where(eq(territoryArea4.regional, 'PUMA'))
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
                    yoy_sa: sql<string>`CONCAT(SUM(${summaryRevSubbranch.rev_all_m} - ${summaryRevSubbranch.rev_all_m12})/${summaryRevSubbranch.rev_all_m12}*100, '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(SUM(${summaryRevSubbranch.rev_all_ytd} - ${summaryRevSubbranch.rev_all_ytd1})/${summaryRevSubbranch.rev_all_ytd1}*100, '%')`.as('ytd_sa'),
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
                .where(eq(territoryArea4.regional, 'PUMA'))
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
                    yoy_sa: sql<string>`CONCAT(SUM(${summaryRevCluster.rev_all_m} - ${summaryRevCluster.rev_all_m12})/${summaryRevCluster.rev_all_m12}*100, '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(SUM(${summaryRevCluster.rev_all_ytd} - ${summaryRevCluster.rev_all_ytd1})/${summaryRevCluster.rev_all_ytd1}*100, '%')`.as('ytd_sa'),
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
                .where(eq(territoryArea4.regional, 'PUMA'))
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
                    yoy_sa: sql<string>`CONCAT(SUM(${summaryRevKabupaten.rev_all_m} - ${summaryRevKabupaten.rev_all_m12})/${summaryRevKabupaten.rev_all_m12}*100, '%')`.as('yoy_sa'),
                    ytd_sa: sql<string>`CONCAT(SUM(${summaryRevKabupaten.rev_all_ytd} - ${summaryRevKabupaten.rev_all_ytd1})/${summaryRevKabupaten.rev_all_ytd1}*100, '%')`.as('ytd_sa'),
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
    .get('/revenue-sa-prabayar',
        zValidator('query', z.object({ date: z.string().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 3)
            const month = (selectedDate.getMonth() + 1).toString()

            // KOLOM DINAMIS UNTUK MEMILIH ANTARA KOLOM `m1-m12`
            const monthColumn = `m${month}` as keyof typeof revenueSAPrabayar.$inferSelect

            // VARIABLE TANGGAL UNTUK IMPORT TABEL SECARA DINAMIS
            const latestDataDate = subDays(selectedDate, 5); // - 3 days

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const latestMonth = parseInt(format(selectedDate, 'M'), 10)
            const isPrevMonthLastYear = currMonth === '01'
            const prevMonth = isPrevMonthLastYear ? '12' : format(subMonths(selectedDate, 1), 'MM')
            const prevMonthYear = isPrevMonthLastYear ? format(subYears(selectedDate, 1), 'yyyy') : format(selectedDate, 'yyyy')
            const prevYear = format(subYears(selectedDate, 1), 'yyyy')

            // TABEL `sa_detil_`
            const currRevSA = dynamicRevenueSATable(currYear, currMonth)
            const prevMonthRevSA = dynamicRevenueSATable(prevMonthYear, prevMonth)
            const prevYearCurrMonthRevSA = dynamicRevenueSATable(prevYear, currMonth)
            const currYtdRevNewSales = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                currYtdRevNewSales.push(`sa_detil_${currYear}${monthStr}`)
            }
            const prevYtdRevNewSales = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                prevYtdRevNewSales.push(`sa_detil_${prevYear}${monthStr}`)
            }

            // VARIABLE TANGGAL
            // Get the last day of the selected month
            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            // get the first day and last day of the selected month dynamically
            const firstDayOfCurrMonth = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const firstDayOfPrevMonth = format(startOfMonth(subMonths(selectedDate, 1)), 'yyyy-MM-dd')
            const firstDayOfPrevYearCurrMonth = format(startOfMonth(subYears(selectedDate, 1)), 'yyyy-MM-dd')

            const currDate = format(endOfCurrMonth, 'yyyy-MM-dd');
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');

            const currJanuaryFirst = `${currYear}-01-01`
            const prevJanuaryFirst = `${prevYear}-01-01`

            const queryCurrYtd = currYtdRevNewSales.map(table => `
                SELECT
                    CASE WHEN regional IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END as region,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR',
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'BURU',
                            'BURU SELATAN',
                            'SERAM BAGIAN BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KOTA JAYAPURA',
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'MANOKWARI',
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA',
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG'
                        WHEN upper(kabupaten) IN (
                            'ASMAT',
                            'BOVEN DIGOEL',
                            'MAPPI',
                            'MERAUKE',
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA',
                            'DEIYAI',
                            'DOGIYAI',
                            'NABIRE',
                            'PANIAI'
                        ) THEN 'TIMIKA'
                        ELSE NULL
                    END as branch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN AMBON'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'SENTANI'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        ELSE NULL
                    END as subbranch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN TUAL'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                        WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                        WHEN upper(kabupaten) IN (
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN'
                        ) THEN 'NEW BIAK NUMFOR'
                        WHEN upper(kabupaten) IN (
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'PAPUA PEGUNUNGAN'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'NEW SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA PUNCAK'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                        ELSE NULL
                    END as cluster,
                    kabupaten,
                    price,
                    trx_date,
                    COUNT(msisdn) as trx
                FROM ${table}
                WHERE NOT kabupaten = 'TMP' AND regional IN ('MALUKU DAN PAPUA', 'PUMA') AND brand NOT IN ('byu', 'ByU') 
                GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const queryPrevYtd = prevYtdRevNewSales.map(table => `
                SELECT
                    CASE WHEN regional IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END as region,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR',
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'BURU',
                            'BURU SELATAN',
                            'SERAM BAGIAN BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KOTA JAYAPURA',
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'MANOKWARI',
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA',
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG'
                        WHEN upper(kabupaten) IN (
                            'ASMAT',
                            'BOVEN DIGOEL',
                            'MAPPI',
                            'MERAUKE',
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA',
                            'DEIYAI',
                            'DOGIYAI',
                            'NABIRE',
                            'PANIAI'
                        ) THEN 'TIMIKA'
                        ELSE NULL
                    END as branch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN AMBON'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'SENTANI'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        ELSE NULL
                    END as subbranch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN TUAL'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                        WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                        WHEN upper(kabupaten) IN (
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN'
                        ) THEN 'NEW BIAK NUMFOR'
                        WHEN upper(kabupaten) IN (
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'PAPUA PEGUNUNGAN'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'NEW SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA PUNCAK'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                        ELSE NULL
                    END as cluster,
                    kabupaten,
                    price,
                    trx_date,
                    COUNT(msisdn) as trx
                FROM ${table}
                WHERE kabupaten NOT IN ('TMP') AND regional IN ('MALUKU DAN PAPUA', 'PUMA') AND brand NOT IN ('byu', 'ByU')
                GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const sq = `
                WITH aa AS (
                    ${queryCurrYtd}
                ),
                bb AS(
                    SELECT
                        region,
                        branch,
                        subbranch,
                        cluster,
                        kabupaten,
                        SUM(price * trx) AS rev
                    FROM aa
                    WHERE trx_date BETWEEN '${currJanuaryFirst}' AND '${currDate}' AND kabupaten <> 'TMP'
                    GROUP BY 1,2,3,4,5
                )
                SELECT
                    region,
                    branch,
                    subbranch,
                    cluster,
                    kabupaten,
                    SUM(rev) AS currYtdKabupatenRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch, subbranch, cluster) AS currYtdClusterRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch, subbranch) AS currYtdSubbranchRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch) AS currYtdBranchRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region) AS currYtdRegionalRev
                FROM bb
                GROUP BY 1, 2, 3, 4, 5
                    `

            const sq5 = `
                WITH aa AS (
                    ${queryPrevYtd}
                ),
                bb AS(
                    SELECT
                        region,
                        branch,
                        subbranch,
                        cluster,
                        kabupaten,
                        SUM(price * trx) AS rev
                    FROM aa
                    WHERE trx_date BETWEEN '${prevJanuaryFirst}' AND '${prevYearCurrDate}' AND kabupaten <> 'TMP'
                    GROUP BY 1,2,3,4,5
                )
                SELECT
                    region,
                    branch,
                    subbranch,
                    cluster,
                    kabupaten,
                    SUM(rev) AS prevYtdKabupatenRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch, subbranch, cluster) AS prevYtdClusterRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch, subbranch) AS prevYtdSubbranchRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch) AS prevYtdBranchRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region) AS prevYtdRegionalRev
                FROM bb
                GROUP BY 1, 2, 3, 4, 5
                    `

            const sq2 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${currRevSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${currRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${currRevSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${currRevSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${currRevSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
            `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${currRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${currRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${currRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${currRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${currRevSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${currRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${currRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${currRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${currRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${currRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${currRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
            `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${currRevSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${currRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${currRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${currRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${currRevSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${currRevSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${currRevSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${currRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${currRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${currRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${currRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${currRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${currRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
            `.as('clusterName'),
                    kabupaten: currRevSA.kabupaten,
                    price: currRevSA.price,
                    trx: sql<number>`COUNT(${currRevSA.msisdn})`.as('trx')
                })
                .from(currRevSA)
                .where(and(
                    and(
                        not(eq(currRevSA.kabupaten, 'TMP')),
                        notInArray(currRevSA.brand, ['ByU', 'byu'])
                    ),
                    and(
                        inArray(currRevSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(currRevSA.trxDate, firstDayOfCurrMonth, currDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const regClassP2 = db6.select({
                regionName: sq2.regionName,
                branchName: sq2.branchName,
                subbranchName: sq2.subbranchName,
                clusterName: sq2.clusterName,
                cityName: sq2.kabupaten,
                revenue: sql<number>`SUM(${sq2.price} * ${sq2.trx})`.as('revenue')
            })
                .from(sq2)
                .groupBy(sql`1,2,3,4,5`)
                .as('regionClassififcation')

            const sq3 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevMonthRevSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
            `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${prevMonthRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${prevMonthRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${prevMonthRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${prevMonthRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${prevMonthRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
            `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${prevMonthRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${prevMonthRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${prevMonthRevSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${prevMonthRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${prevMonthRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${prevMonthRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
            `.as('clusterName'),
                    kabupaten: prevMonthRevSA.kabupaten,
                    price: prevMonthRevSA.price,
                    trx: sql<number>`COUNT(${prevMonthRevSA.msisdn})`.as('trx')
                })
                .from(prevMonthRevSA)
                .where(and(
                    and(
                        not(eq(prevMonthRevSA.kabupaten, 'TMP')),
                        notInArray(prevMonthRevSA.brand, ['ByU', 'byu'])
                    ),
                    and(
                        inArray(prevMonthRevSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevMonthRevSA.trxDate, firstDayOfPrevMonth, prevDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const regClassP3 = db6.select({
                regionName: sq3.regionName,
                branchName: sq3.branchName,
                subbranchName: sq3.subbranchName,
                clusterName: sq3.clusterName,
                cityName: sq3.kabupaten,
                revenue: sql<number>`SUM(${sq3.price} * ${sq3.trx})`.as('revenue')
            })
                .from(sq3)
                .groupBy(sql`1,2,3,4,5`)
                .as('regionClassififcation')

            const sq4 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevYearCurrMonthRevSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
            `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
            `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
            `.as('clusterName'),
                    kabupaten: prevYearCurrMonthRevSA.kabupaten,
                    price: prevYearCurrMonthRevSA.price,
                    trx: sql<number>`COUNT(${prevYearCurrMonthRevSA.msisdn})`.as('trx')
                })
                .from(prevYearCurrMonthRevSA)
                .where(and(
                    and(
                        not(eq(prevYearCurrMonthRevSA.kabupaten, 'TMP')),
                        notInArray(prevYearCurrMonthRevSA.brand, ['ByU', 'byu'])
                    ),
                    and(
                        inArray(prevYearCurrMonthRevSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevYearCurrMonthRevSA.trxDate, firstDayOfPrevYearCurrMonth, prevYearCurrDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const regClassP4 = db6.select({
                regionName: sq4.regionName,
                branchName: sq4.branchName,
                subbranchName: sq4.subbranchName,
                clusterName: sq4.clusterName,
                cityName: sq4.kabupaten,
                revenue: sql<number>`SUM(${sq4.price} * ${sq4.trx})`.as('revenue')
            })
                .from(sq4)
                .groupBy(sql`1,2,3,4,5`)
                .as('regionClassififcation')

            // QUERY UNTUK TARGET BULAN INI
            const p1 = db
                .select({
                    id: regionals.id,
                    region: regionals.regional,
                    branch: branches.branchNew,
                    subbranch: subbranches.subbranchNew,
                    cluster: clusters.cluster,
                    kabupaten: kabupatens.kabupaten,
                    currMonthTargetRev: sql<number>`SUM(${revenueSAPrabayar[monthColumn]})`.as('currMonthTargetRev')
                })
                .from(regionals)
                .leftJoin(branches, eq(regionals.id, branches.regionalId))
                .leftJoin(subbranches, eq(branches.id, subbranches.branchId))
                .leftJoin(clusters, eq(subbranches.id, clusters.subbranchId))
                .leftJoin(kabupatens, eq(clusters.id, kabupatens.clusterId))
                .leftJoin(revenueSAPrabayar, eq(kabupatens.id, revenueSAPrabayar.kabupatenId))
                .groupBy(
                    regionals.regional,
                    branches.branchNew,
                    subbranches.subbranchNew,
                    clusters.cluster,
                    kabupatens.kabupaten
                )
                .orderBy(asc(regionals.regional))
                .prepare()

            //  QUERY UNTUK MENDAPAT CURRENT MONTH REVENUE (Mtd)
            const p2 = db6
                .select({
                    region: sql<string>`${regClassP2.regionName}`.as('region'),
                    branch: sql<string>`${regClassP2.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${regClassP2.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${regClassP2.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${regClassP2.cityName}`.as('kabupaten'),
                    currMonthKabupatenRev: sql<number>`SUM(${regClassP2.revenue})`.as('currMonthKabupatenRev'),
                    currMonthClusterRev: sql<number>`SUM(SUM(${regClassP2.revenue})) OVER (PARTITION BY ${regClassP2.regionName}, ${regClassP2.branchName}, ${regClassP2.subbranchName}, ${regClassP2.clusterName})`.as('currMonthClusterRev'),
                    currMonthSubbranchRev: sql<number>`SUM(SUM(${regClassP2.revenue})) OVER (PARTITION BY ${regClassP2.regionName}, ${regClassP2.branchName}, ${regClassP2.subbranchName})`.as('currMonthSubbranchRev'),
                    currMonthBranchRev: sql<number>`SUM(SUM(${regClassP2.revenue})) OVER (PARTITION BY ${regClassP2.regionName}, ${regClassP2.branchName})`.as('currMonthBranchRev'),
                    currMonthRegionalRev: sql<number>`SUM(SUM(${regClassP2.revenue})) OVER (PARTITION BY ${regClassP2.regionName})`.as('currMonthRegionalRev')
                })
                .from(regClassP2)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK MENDAPAT PREV MONTH REVENUE
            const p3 = db6
                .select({
                    region: sql<string>`${regClassP3.regionName}`.as('region'),
                    branch: sql<string>`${regClassP3.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${regClassP3.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${regClassP3.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${regClassP3.cityName}`.as('kabupaten'),
                    prevMonthKabupatenRev: sql<number>`SUM(${regClassP3.revenue})`.as('currMonthKabupatenRev'),
                    prevMonthClusterRev: sql<number>`SUM(SUM(${regClassP3.revenue})) OVER (PARTITION BY ${regClassP3.regionName}, ${regClassP3.branchName}, ${regClassP3.subbranchName}, ${regClassP3.clusterName})`.as('currMonthClusterRev'),
                    prevMonthSubbranchRev: sql<number>`SUM(SUM(${regClassP3.revenue})) OVER (PARTITION BY ${regClassP3.regionName}, ${regClassP3.branchName}, ${regClassP3.subbranchName})`.as('currMonthSubbranchRev'),
                    prevMonthBranchRev: sql<number>`SUM(SUM(${regClassP3.revenue})) OVER (PARTITION BY ${regClassP3.regionName}, ${regClassP3.branchName})`.as('currMonthBranchRev'),
                    prevMonthRegionalRev: sql<number>`SUM(SUM(${regClassP3.revenue})) OVER (PARTITION BY ${regClassP3.regionName})`.as('currMonthRegionalRev')
                })
                .from(regClassP3)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK MENDAPAT PREV YEAR CURR MONTH REVENUE
            const p4 = db6
                .select({
                    region: sql<string>`${regClassP4.regionName}`.as('region'),
                    branch: sql<string>`${regClassP4.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${regClassP4.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${regClassP4.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${regClassP4.cityName}`.as('kabupaten'),
                    prevYearCurrMonthKabupatenRev: sql<number>`SUM(${regClassP4.revenue})`.as('currMonthKabupatenRev'),
                    prevYearCurrMonthClusterRev: sql<number>`SUM(SUM(${regClassP4.revenue})) OVER (PARTITION BY ${regClassP4.regionName}, ${regClassP4.branchName}, ${regClassP4.subbranchName}, ${regClassP4.clusterName})`.as('currMonthClusterRev'),
                    prevYearCurrMonthSubbranchRev: sql<number>`SUM(SUM(${regClassP4.revenue})) OVER (PARTITION BY ${regClassP4.regionName}, ${regClassP4.branchName}, ${regClassP4.subbranchName})`.as('currMonthSubbranchRev'),
                    prevYearCurrMonthBranchRev: sql<number>`SUM(SUM(${regClassP4.revenue})) OVER (PARTITION BY ${regClassP4.regionName}, ${regClassP4.branchName})`.as('currMonthBranchRev'),
                    prevYearCurrMonthRegionalRev: sql<number>`SUM(SUM(${regClassP4.revenue})) OVER (PARTITION BY ${regClassP4.regionName})`.as('currMonthRegionalRev')
                })
                .from(regClassP4)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK YtD 2025

            const [targetRevenue, currMonthRevenue, prevMonthRevenue, prevYearCurrMonthRevenue, currYtdRev, prevYtdRev] = await Promise.all([
                p1.execute(),
                p2.execute(),
                p3.execute(),
                p4.execute(),
                db6.execute(sql.raw(sq)),
                db6.execute(sql.raw(sq5)),
            ])

            // /var/lib/backup_mysql_2025/
            const regionalsMap = new Map();
            const [currYtdRevenue] = currYtdRev as MySqlRawQueryResult as unknown as [CurrYtDRevenue[], any]
            const [prevYtdRevenue] = prevYtdRev as MySqlRawQueryResult as unknown as [PrevYtDRevenue[], any]

            targetRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthTarget += Number(row.currMonthTargetRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));
                branch.currMonthTarget += Number(row.currMonthTargetRev)

                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthTarget += Number(row.currMonthTargetRev)

                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthTarget += Number(row.currMonthTargetRev)

                cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: Number(row.currMonthTargetRev),
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
            })

            currMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthRevenue = Number(row.currMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currMonthRevenue = Number(row.currMonthBranchRev)

                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthRevenue = Number(row.currMonthSubbranchRev)

                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthRevenue = Number(row.currMonthClusterRev)

                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));

                kabupaten.currMonthRevenue = Number(row.currMonthKabupatenRev)
            })

            prevMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevMonthRevenue = Number(row.prevMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevMonthRevenue = Number(row.prevMonthBranchRev)

                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevMonthRevenue = Number(row.prevMonthSubbranchRev)

                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevMonthRevenue = Number(row.prevMonthClusterRev)

                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevMonthRevenue = Number(row.prevMonthKabupatenRev)
            })

            prevYearCurrMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthBranchRev)

                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthSubbranchRev)

                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthClusterRev)

                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthKabupatenRev)
            })

            currYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currYtdRevenue = Number(row.currYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currYtdRevenue = Number(row.currYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currYtdRevenue = Number(row.currYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currYtdRevenue = Number(row.currYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.currYtdRevenue = Number(row.currYtdKabupatenRev)
            })

            prevYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYtdRevenue = Number(row.prevYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYtdRevenue = Number(row.prevYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYtdRevenue = Number(row.prevYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYtdRevenue = Number(row.prevYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYtdRevenue = Number(row.prevYtdKabupatenRev)
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

            return c.json({ data: finalDataRevenue }, 200)
        })
    .get('/revenue-sa-byu', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 3)
            const month = (selectedDate.getMonth() + 1).toString()

            // KOLOM DINAMIS UNTUK MEMILIH ANTARA KOLOM `m1-m12`
            const monthColumn = `m${month}` as keyof typeof revenueSAByu.$inferSelect

            // VARIABLE TANGGAL UNTUK IMPORT TABEL SECARA DINAMIS
            const latestDataDate = subDays(selectedDate, 3); // - 3 days

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const latestMonth = parseInt(format(selectedDate, 'M'), 10)
            const isPrevMonthLastYear = currMonth === '01'
            const prevMonth = isPrevMonthLastYear ? '12' : format(subMonths(selectedDate, 1), 'MM')
            const prevMonthYear = isPrevMonthLastYear ? format(subYears(selectedDate, 1), 'yyyy') : format(selectedDate, 'yyyy')
            const prevYear = format(subYears(selectedDate, 1), 'yyyy')

            // TABEL `sa_detil_`
            const currRevSA = dynamicRevenueSATable(currYear, currMonth)
            const prevMonthRevSA = dynamicRevenueSATable(prevMonthYear, prevMonth)
            const prevYearCurrMonthRevSA = dynamicRevenueSATable(prevYear, currMonth)
            const currYtdRevNewSales = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                currYtdRevNewSales.push(`sa_detil_${currYear}${monthStr}`)
            }
            const prevYtdRevNewSales = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                prevYtdRevNewSales.push(`sa_detil_${prevYear}${monthStr}`)
            }

            // VARIABLE TANGGAL
            // Get the last day of the selected month
            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            // get the first day and last day of the selected month dynamically
            const firstDayOfCurrMonth = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const firstDayOfPrevMonth = format(startOfMonth(subMonths(selectedDate, 1)), 'yyyy-MM-dd')
            const firstDayOfPrevYearCurrMonth = format(startOfMonth(subYears(selectedDate, 1)), 'yyyy-MM-dd')

            const currDate = format(endOfCurrMonth, 'yyyy-MM-dd');
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');

            const currJanuaryFirst = `${currYear}-01-01`
            const prevJanuaryFirst = `${prevYear}-01-01`

            const queryCurrYtd = currYtdRevNewSales.map(table => `
                SELECT
                    CASE WHEN regional IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END as region,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR',
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'BURU',
                            'BURU SELATAN',
                            'SERAM BAGIAN BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KOTA JAYAPURA',
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'MANOKWARI',
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA',
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG'
                        WHEN upper(kabupaten) IN (
                            'ASMAT',
                            'BOVEN DIGOEL',
                            'MAPPI',
                            'MERAUKE',
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA',
                            'DEIYAI',
                            'DOGIYAI',
                            'NABIRE',
                            'PANIAI'
                        ) THEN 'TIMIKA'
                        ELSE NULL
                    END as branch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN AMBON'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'SENTANI'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        ELSE NULL
                    END as subbranch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN TUAL'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                        WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                        WHEN upper(kabupaten) IN (
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN'
                        ) THEN 'NEW BIAK NUMFOR'
                        WHEN upper(kabupaten) IN (
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'PAPUA PEGUNUNGAN'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'NEW SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA PUNCAK'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                        ELSE NULL
                    END as cluster,
                    kabupaten,
                    price,
                    trx_date,
                    COUNT(msisdn) as trx
                FROM ${table}
                WHERE kabupaten NOT IN ('TMP') AND regional IN ('MALUKU DAN PAPUA', 'PUMA') AND brand IN ('byu', 'ByU')
                GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const queryPrevYtd = prevYtdRevNewSales.map(table => `
                SELECT
                    CASE WHEN regional IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END as region,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR',
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'BURU',
                            'BURU SELATAN',
                            'SERAM BAGIAN BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KOTA JAYAPURA',
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'MANOKWARI',
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA',
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG'
                        WHEN upper(kabupaten) IN (
                            'ASMAT',
                            'BOVEN DIGOEL',
                            'MAPPI',
                            'MERAUKE',
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA',
                            'DEIYAI',
                            'DOGIYAI',
                            'NABIRE',
                            'PANIAI'
                        ) THEN 'TIMIKA'
                        ELSE NULL
                    END as branch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN AMBON'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'SENTANI'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        ELSE NULL
                    END as subbranch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN TUAL'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                        WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                        WHEN upper(kabupaten) IN (
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN'
                        ) THEN 'NEW BIAK NUMFOR'
                        WHEN upper(kabupaten) IN (
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'PAPUA PEGUNUNGAN'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'NEW SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA PUNCAK'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                        ELSE NULL
                    END as cluster,
                    kabupaten,
                    price,
                    trx_date,
                    COUNT(msisdn) as trx
                FROM ${table}
                WHERE kabupaten NOT IN ('TMP') AND regional IN ('MALUKU DAN PAPUA', 'PUMA') AND brand IN ('byu', 'ByU')
                GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const sq = `
                WITH aa AS (
                    ${queryCurrYtd}
                ),
                bb AS(
                    SELECT
                        region,
                        branch,
                        subbranch,
                        cluster,
                        kabupaten,
                        SUM(price * trx) AS rev
                    FROM aa
                    WHERE trx_date BETWEEN '${currJanuaryFirst}' AND '${currDate}'
                    GROUP BY 1,2,3,4,5
                )
                SELECT
                    region,
                    branch,
                    subbranch,
                    cluster,
                    kabupaten,
                    SUM(rev) AS currYtdKabupatenRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch, subbranch, cluster) AS currYtdClusterRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch, subbranch) AS currYtdSubbranchRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch) AS currYtdBranchRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region) AS currYtdRegionalRev
                FROM bb
                GROUP BY 1, 2, 3, 4, 5
                    `

            const sq5 = `
                WITH aa AS (
                    ${queryPrevYtd}
                ),
                bb AS(
                    SELECT
                        region,
                        branch,
                        subbranch,
                        cluster,
                        kabupaten,
                        SUM(price * trx) AS rev
                    FROM aa
                    WHERE trx_date BETWEEN '${prevJanuaryFirst}' AND '${prevYearCurrDate}'
                    GROUP BY 1,2,3,4,5
                )
                SELECT
                    region,
                    branch,
                    subbranch,
                    cluster,
                    kabupaten,
                    SUM(rev) AS prevYtdKabupatenRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch, subbranch, cluster) AS prevYtdClusterRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch, subbranch) AS prevYtdSubbranchRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region, branch) AS prevYtdBranchRev,
                    SUM(SUM(rev)) OVER (PARTITION BY region) AS prevYtdRegionalRev
                FROM bb
                GROUP BY 1, 2, 3, 4, 5
                    `

            const sq2 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${currRevSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${currRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${currRevSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${currRevSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${currRevSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
            `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${currRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${currRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${currRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${currRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${currRevSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${currRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${currRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${currRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${currRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${currRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${currRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
            `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${currRevSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${currRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${currRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${currRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${currRevSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${currRevSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${currRevSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${currRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${currRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${currRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${currRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${currRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${currRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
            `.as('clusterName'),
                    kabupaten: currRevSA.kabupaten,
                    price: currRevSA.price,
                    trx: sql<number>`COUNT(${currRevSA.msisdn})`.as('trx')
                })
                .from(currRevSA)
                .where(and(
                    and(
                        notInArray(currRevSA.kabupaten, ['TMP']),
                        inArray(currRevSA.brand, ['byu', 'ByU'])
                    ),
                    and(
                        inArray(currRevSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(currRevSA.trxDate, firstDayOfCurrMonth, currDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const regClassP2 = db6.select({
                regionName: sq2.regionName,
                branchName: sq2.branchName,
                subbranchName: sq2.subbranchName,
                clusterName: sq2.clusterName,
                cityName: sq2.kabupaten,
                revenue: sql<number>`SUM(${sq2.price} * ${sq2.trx})`.as('revenue')
            })
                .from(sq2)
                .groupBy(sql`1,2,3,4,5`)
                .as('regionClassififcation')

            const sq3 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevMonthRevSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
            `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${prevMonthRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${prevMonthRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${prevMonthRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${prevMonthRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${prevMonthRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
            `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${prevMonthRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${prevMonthRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${prevMonthRevSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${prevMonthRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${prevMonthRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${prevMonthRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${prevMonthRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
            `.as('clusterName'),
                    kabupaten: prevMonthRevSA.kabupaten,
                    price: prevMonthRevSA.price,
                    trx: sql<number>`COUNT(${prevMonthRevSA.msisdn})`.as('trx')
                })
                .from(prevMonthRevSA)
                .where(and(
                    and(
                        notInArray(prevMonthRevSA.kabupaten, ['TMP']),
                        inArray(prevMonthRevSA.brand, ['byu', 'ByU'])
                    ),
                    and(
                        inArray(prevMonthRevSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevMonthRevSA.trxDate, firstDayOfPrevMonth, prevDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const regClassP3 = db6.select({
                regionName: sq3.regionName,
                branchName: sq3.branchName,
                subbranchName: sq3.subbranchName,
                clusterName: sq3.clusterName,
                cityName: sq3.kabupaten,
                revenue: sql<number>`SUM(${sq3.price} * ${sq3.trx})`.as('revenue')
            })
                .from(sq3)
                .groupBy(sql`1,2,3,4,5`)
                .as('regionClassififcation')

            const sq4 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevYearCurrMonthRevSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
            `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
            `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${prevYearCurrMonthRevSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
            `.as('clusterName'),
                    kabupaten: prevYearCurrMonthRevSA.kabupaten,
                    price: prevYearCurrMonthRevSA.price,
                    trx: sql<number>`COUNT(${prevYearCurrMonthRevSA.msisdn})`.as('trx')
                })
                .from(prevYearCurrMonthRevSA)
                .where(and(
                    and(
                        notInArray(prevYearCurrMonthRevSA.kabupaten, ['TMP']),
                        inArray(prevYearCurrMonthRevSA.brand, ['byu', 'ByU'])
                    ),
                    and(
                        inArray(prevYearCurrMonthRevSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevYearCurrMonthRevSA.trxDate, firstDayOfPrevYearCurrMonth, prevYearCurrDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const regClassP4 = db6.select({
                regionName: sq4.regionName,
                branchName: sq4.branchName,
                subbranchName: sq4.subbranchName,
                clusterName: sq4.clusterName,
                cityName: sq4.kabupaten,
                revenue: sql<number>`SUM(${sq4.price} * ${sq4.trx})`.as('revenue')
            })
                .from(sq4)
                .groupBy(sql`1,2,3,4,5`)
                .as('regionClassififcation')

            // QUERY UNTUK TARGET BULAN INI
            const p1 = db
                .select({
                    id: regionals.id,
                    region: regionals.regional,
                    branch: branches.branchNew,
                    subbranch: subbranches.subbranchNew,
                    cluster: clusters.cluster,
                    kabupaten: kabupatens.kabupaten,
                    currMonthTargetRev: sql<number>`SUM(${revenueSAByu[monthColumn]})`.as('currMonthTargetRev')
                })
                .from(regionals)
                .leftJoin(branches, eq(regionals.id, branches.regionalId))
                .leftJoin(subbranches, eq(branches.id, subbranches.branchId))
                .leftJoin(clusters, eq(subbranches.id, clusters.subbranchId))
                .leftJoin(kabupatens, eq(clusters.id, kabupatens.clusterId))
                .leftJoin(revenueSAByu, eq(kabupatens.id, revenueSAByu.kabupatenId))
                .groupBy(
                    regionals.regional,
                    branches.branchNew,
                    subbranches.subbranchNew,
                    clusters.cluster,
                    kabupatens.kabupaten
                )
                .orderBy(asc(regionals.regional))
                .prepare()

            //  QUERY UNTUK MENDAPAT CURRENT MONTH REVENUE (Mtd)
            const p2 = db6
                .select({
                    region: sql<string>`${regClassP2.regionName}`.as('region'),
                    branch: sql<string>`${regClassP2.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${regClassP2.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${regClassP2.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${regClassP2.cityName}`.as('kabupaten'),
                    currMonthKabupatenRev: sql<number>`SUM(${regClassP2.revenue})`.as('currMonthKabupatenRev'),
                    currMonthClusterRev: sql<number>`SUM(SUM(${regClassP2.revenue})) OVER (PARTITION BY ${regClassP2.regionName}, ${regClassP2.branchName}, ${regClassP2.subbranchName}, ${regClassP2.clusterName})`.as('currMonthClusterRev'),
                    currMonthSubbranchRev: sql<number>`SUM(SUM(${regClassP2.revenue})) OVER (PARTITION BY ${regClassP2.regionName}, ${regClassP2.branchName}, ${regClassP2.subbranchName})`.as('currMonthSubbranchRev'),
                    currMonthBranchRev: sql<number>`SUM(SUM(${regClassP2.revenue})) OVER (PARTITION BY ${regClassP2.regionName}, ${regClassP2.branchName})`.as('currMonthBranchRev'),
                    currMonthRegionalRev: sql<number>`SUM(SUM(${regClassP2.revenue})) OVER (PARTITION BY ${regClassP2.regionName})`.as('currMonthRegionalRev')
                })
                .from(regClassP2)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK MENDAPAT PREV MONTH REVENUE
            const p3 = db6
                .select({
                    region: sql<string>`${regClassP3.regionName}`.as('region'),
                    branch: sql<string>`${regClassP3.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${regClassP3.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${regClassP3.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${regClassP3.cityName}`.as('kabupaten'),
                    prevMonthKabupatenRev: sql<number>`SUM(${regClassP3.revenue})`.as('currMonthKabupatenRev'),
                    prevMonthClusterRev: sql<number>`SUM(SUM(${regClassP3.revenue})) OVER (PARTITION BY ${regClassP3.regionName}, ${regClassP3.branchName}, ${regClassP3.subbranchName}, ${regClassP3.clusterName})`.as('currMonthClusterRev'),
                    prevMonthSubbranchRev: sql<number>`SUM(SUM(${regClassP3.revenue})) OVER (PARTITION BY ${regClassP3.regionName}, ${regClassP3.branchName}, ${regClassP3.subbranchName})`.as('currMonthSubbranchRev'),
                    prevMonthBranchRev: sql<number>`SUM(SUM(${regClassP3.revenue})) OVER (PARTITION BY ${regClassP3.regionName}, ${regClassP3.branchName})`.as('currMonthBranchRev'),
                    prevMonthRegionalRev: sql<number>`SUM(SUM(${regClassP3.revenue})) OVER (PARTITION BY ${regClassP3.regionName})`.as('currMonthRegionalRev')
                })
                .from(regClassP3)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK MENDAPAT PREV YEAR CURR MONTH REVENUE
            const p4 = db6
                .select({
                    region: sql<string>`${regClassP4.regionName}`.as('region'),
                    branch: sql<string>`${regClassP4.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${regClassP4.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${regClassP4.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${regClassP4.cityName}`.as('kabupaten'),
                    prevYearCurrMonthKabupatenRev: sql<number>`SUM(${regClassP4.revenue})`.as('currMonthKabupatenRev'),
                    prevYearCurrMonthClusterRev: sql<number>`SUM(SUM(${regClassP4.revenue})) OVER (PARTITION BY ${regClassP4.regionName}, ${regClassP4.branchName}, ${regClassP4.subbranchName}, ${regClassP4.clusterName})`.as('currMonthClusterRev'),
                    prevYearCurrMonthSubbranchRev: sql<number>`SUM(SUM(${regClassP4.revenue})) OVER (PARTITION BY ${regClassP4.regionName}, ${regClassP4.branchName}, ${regClassP4.subbranchName})`.as('currMonthSubbranchRev'),
                    prevYearCurrMonthBranchRev: sql<number>`SUM(SUM(${regClassP4.revenue})) OVER (PARTITION BY ${regClassP4.regionName}, ${regClassP4.branchName})`.as('currMonthBranchRev'),
                    prevYearCurrMonthRegionalRev: sql<number>`SUM(SUM(${regClassP4.revenue})) OVER (PARTITION BY ${regClassP4.regionName})`.as('currMonthRegionalRev')
                })
                .from(regClassP4)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK YtD 2025

            const [targetRevenue, currMonthRevenue, prevMonthRevenue, prevYearCurrMonthRevenue, currYtdRev, prevYtdRev] = await Promise.all([
                p1.execute(),
                p2.execute(),
                p3.execute(),
                p4.execute(),
                db6.execute(sql.raw(sq)),
                db6.execute(sql.raw(sq5)),
            ])

            const regionalsMap = new Map();
            const [currYtdRevenue] = currYtdRev as MySqlRawQueryResult as unknown as [CurrYtDRevenue[], any]
            const [prevYtdRevenue] = prevYtdRev as MySqlRawQueryResult as unknown as [PrevYtDRevenue[], any]

            targetRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthTarget += Number(row.currMonthTargetRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));
                branch.currMonthTarget += Number(row.currMonthTargetRev)

                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthTarget += Number(row.currMonthTargetRev)

                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthTarget += Number(row.currMonthTargetRev)

                cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: Number(row.currMonthTargetRev),
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
            })

            currMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthRevenue = Number(row.currMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currMonthRevenue = Number(row.currMonthBranchRev)

                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthRevenue = Number(row.currMonthSubbranchRev)

                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthRevenue = Number(row.currMonthClusterRev)

                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));

                kabupaten.currMonthRevenue = Number(row.currMonthKabupatenRev)
            })

            prevMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevMonthRevenue = Number(row.prevMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevMonthRevenue = Number(row.prevMonthBranchRev)

                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevMonthRevenue = Number(row.prevMonthSubbranchRev)

                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevMonthRevenue = Number(row.prevMonthClusterRev)

                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevMonthRevenue = Number(row.prevMonthKabupatenRev)
            })

            prevYearCurrMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthBranchRev)

                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthSubbranchRev)

                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthClusterRev)

                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthKabupatenRev)
            })

            currYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currYtdRevenue = Number(row.currYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currYtdRevenue = Number(row.currYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currYtdRevenue = Number(row.currYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currYtdRevenue = Number(row.currYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.currYtdRevenue = Number(row.currYtdKabupatenRev)
            })

            prevYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYtdRevenue = Number(row.prevYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYtdRevenue = Number(row.prevYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYtdRevenue = Number(row.prevYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYtdRevenue = Number(row.prevYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYtdRevenue = Number(row.prevYtdKabupatenRev)
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

            return c.json({ data: finalDataRevenue }, 200)
        })
    .get('/trx-sa', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 3)
            const month = (selectedDate.getMonth() + 1).toString()


            // KOLOM DINAMIS UNTUK MEMILIH ANTARA KOLOM `m1-m12`
            const monthColumn = `m${month}` as keyof typeof trxSA.$inferSelect

            // VARIABLE TANGGAL UNTUK IMPORT TABEL SECARA DINAMIS
            const latestDataDate = subDays(selectedDate, 3); // - 3 days

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const latestMonth = parseInt(format(selectedDate, 'M'), 10)
            const isPrevMonthLastYear = currMonth === '01'
            const prevMonth = isPrevMonthLastYear ? '12' : format(subMonths(selectedDate, 1), 'MM')
            const prevMonthYear = isPrevMonthLastYear ? format(subYears(selectedDate, 1), 'yyyy') : format(selectedDate, 'yyyy')
            const prevYear = format(subYears(selectedDate, 1), 'yyyy')

            // TABEL `sa_detil_`
            const currTrxSa = dynamicRevenueSATable(currYear, currMonth)
            const prevMonthTrxSA = dynamicRevenueSATable(prevMonthYear, prevMonth)
            const prevYearCurrMonthTrxSA = dynamicRevenueSATable(prevYear, currMonth)
            const currYtdTrxSARev: string[] = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                currYtdTrxSARev.push(`sa_detil_${currYear}${monthStr}`)
            }
            const prevYtdTrxSARev: string[] = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                prevYtdTrxSARev.push(`sa_detil_${prevYear}${monthStr}`)
            }

            // VARIABLE TANGGAL
            // Get the last day of the selected month
            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            // get the first day and last day of the selected month dynamically
            const firstDayOfCurrMonth = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const firstDayOfPrevMonth = format(startOfMonth(subMonths(selectedDate, 1)), 'yyyy-MM-dd')
            const firstDayOfPrevYearCurrMonth = format(startOfMonth(subYears(selectedDate, 1)), 'yyyy-MM-dd')

            const currDate = format(endOfCurrMonth, 'yyyy-MM-dd');
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');

            const currJanuaryFirst = `${currYear}-01-01`
            const prevJanuaryFirst = `${prevYear}-01-01`

            const sq2 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${currTrxSa.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${currTrxSa.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${currTrxSa.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${currTrxSa.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${currTrxSa.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
                    `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${currTrxSa.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${currTrxSa.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${currTrxSa.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${currTrxSa.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${currTrxSa.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${currTrxSa.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${currTrxSa.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${currTrxSa.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${currTrxSa.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${currTrxSa.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${currTrxSa.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
                    `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${currTrxSa.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${currTrxSa.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${currTrxSa.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${currTrxSa.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${currTrxSa.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${currTrxSa.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${currTrxSa.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${currTrxSa.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${currTrxSa.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${currTrxSa.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${currTrxSa.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${currTrxSa.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${currTrxSa.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
                    `.as('clusterName'),
                    kabupaten: currTrxSa.kabupaten,
                    trx: sql<number>`COUNT(${currTrxSa.msisdn})`.as('trx')
                })
                .from(currTrxSa)
                .where(and(
                    not(eq(currTrxSa.kabupaten, 'TMP')),
                    and(
                        inArray(currTrxSa.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(currTrxSa.trxDate, firstDayOfCurrMonth, currDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const sq3 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevMonthTrxSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
                    `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
                    `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
                    `.as('clusterName'),
                    kabupaten: prevMonthTrxSA.kabupaten,
                    trx: sql<number>`COUNT(${prevMonthTrxSA.msisdn})`.as('trx')
                })
                .from(prevMonthTrxSA)
                .where(and(
                    not(eq(prevMonthTrxSA.kabupaten, 'TMP')),
                    and(
                        inArray(prevMonthTrxSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevMonthTrxSA.trxDate, firstDayOfPrevMonth, prevDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq3')

            const sq4 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevYearCurrMonthTrxSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
                    `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
                    `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
                    `.as('clusterName'),
                    kabupaten: prevYearCurrMonthTrxSA.kabupaten,
                    trx: sql<number>`COUNT(${prevYearCurrMonthTrxSA.msisdn})`.as('trx')
                })
                .from(prevYearCurrMonthTrxSA)
                .where(and(
                    not(eq(prevYearCurrMonthTrxSA.kabupaten, 'TMP')),
                    and(
                        inArray(prevYearCurrMonthTrxSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevYearCurrMonthTrxSA.trxDate, firstDayOfPrevYearCurrMonth, prevYearCurrDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq4')

            // QUERY UNTUK TARGET BULAN INI
            const p1 = db
                .select({
                    id: regionals.id,
                    region: regionals.regional,
                    branch: branches.branchNew,
                    subbranch: subbranches.subbranchNew,
                    cluster: clusters.cluster,
                    kabupaten: kabupatens.kabupaten,
                    currMonthTargetRev: sql<number>`SUM(${trxSA[monthColumn]})`.as('currMonthTargetRev')
                })
                .from(regionals)
                .leftJoin(branches, eq(regionals.id, branches.regionalId))
                .leftJoin(subbranches, eq(branches.id, subbranches.branchId))
                .leftJoin(clusters, eq(subbranches.id, clusters.subbranchId))
                .leftJoin(kabupatens, eq(clusters.id, kabupatens.clusterId))
                .leftJoin(trxSA, eq(kabupatens.id, trxSA.kabupatenId))
                .groupBy(
                    regionals.regional,
                    branches.branchNew,
                    subbranches.subbranchNew,
                    clusters.cluster,
                    kabupatens.kabupaten
                )
                .orderBy(asc(regionals.regional))
                .prepare()

            const p2 = db6
                .select({
                    region: sql<string>`${sq2.regionName}`.as('region'),
                    branch: sql<string>`${sq2.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq2.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq2.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq2.kabupaten}`.as('kabupaten'),
                    currMonthKabupatenRev: sql<number>`SUM(${sq2.trx})`.as('currMonthKabupatenRev'),
                    currMonthClusterRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName}, ${sq2.subbranchName}, ${sq2.clusterName})`.as('currMonthClusterRev'),
                    currMonthSubbranchRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName}, ${sq2.subbranchName})`.as('currMonthSubbranchRev'),
                    currMonthBranchRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName})`.as('currMonthBranchRev'),
                    currMonthRegionalRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq2)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()


            // QUERY UNTUK MENDAPAT PREV MONTH REVENUE
            const p3 = db6
                .select({
                    region: sql<string>`${sq3.regionName}`.as('region'),
                    branch: sql<string>`${sq3.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq3.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq3.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq3.kabupaten}`.as('kabupaten'),
                    prevMonthKabupatenRev: sql<number>`SUM(${sq3.trx})`.as('currMonthKabupatenRev'),
                    prevMonthClusterRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName}, ${sq3.subbranchName}, ${sq3.clusterName})`.as('currMonthClusterRev'),
                    prevMonthSubbranchRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName}, ${sq3.subbranchName})`.as('currMonthSubbranchRev'),
                    prevMonthBranchRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName})`.as('currMonthBranchRev'),
                    prevMonthRegionalRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq3)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK MENDAPAT PREV YEAR CURR MONTH REVENUE
            const p4 = db6
                .select({
                    region: sql<string>`${sq4.regionName}`.as('region'),
                    branch: sql<string>`${sq4.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq4.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq4.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq4.kabupaten}`.as('kabupaten'),
                    prevYearCurrMonthKabupatenRev: sql<number>`SUM(${sq4.trx})`.as('currMonthKabupatenRev'),
                    prevYearCurrMonthClusterRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName}, ${sq4.subbranchName}, ${sq4.clusterName})`.as('currMonthClusterRev'),
                    prevYearCurrMonthSubbranchRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName}, ${sq4.subbranchName})`.as('currMonthSubbranchRev'),
                    prevYearCurrMonthBranchRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName})`.as('currMonthBranchRev'),
                    prevYearCurrMonthRegionalRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq4)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            const queryCurrYtd = currYtdTrxSARev.map(table => `
                    SELECT
                        CASE WHEN regional IN ('PUMA', 'MALUKU DAN PAPUA') THEN 'PUMA' END as region,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR',
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'BURU',
                                'BURU SELATAN',
                                'SERAM BAGIAN BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KOTA JAYAPURA',
                                'JAYAPURA',
                                'KEEROM',
                                'MAMBERAMO RAYA',
                                'SARMI',
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN',
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'JAYAPURA'
                            WHEN upper(kabupaten) IN (
                                'MANOKWARI',
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA',
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'SORONG'
                            WHEN upper(kabupaten) IN (
                                'ASMAT',
                                'BOVEN DIGOEL',
                                'MAPPI',
                                'MERAUKE',
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA',
                                'DEIYAI',
                                'DOGIYAI',
                                'NABIRE',
                                'PANIAI'
                            ) THEN 'TIMIKA'
                            ELSE NULL
                        END as branch,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'KEPULAUAN AMBON'
                            WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                            WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                            WHEN upper(kabupaten) IN (
                                'JAYAPURA',
                                'KEEROM',
                                'MAMBERAMO RAYA',
                                'SARMI',
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN',
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'SENTANI'
                            WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                            WHEN upper(kabupaten) IN (
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA'
                            ) THEN 'MANOKWARI OUTER'
                            WHEN upper(kabupaten) IN (
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'SORONG RAJA AMPAT'
                            WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                            WHEN upper(kabupaten) IN (
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA'
                            ) THEN 'MIMIKA'
                            WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                            ELSE NULL
                        END as subbranch,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'KEPULAUAN TUAL'
                            WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                            WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                            WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                            WHEN upper(kabupaten) IN (
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN'
                            ) THEN 'NEW BIAK NUMFOR'
                            WHEN upper(kabupaten) IN (
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'PAPUA PEGUNUNGAN'
                            WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                            WHEN upper(kabupaten) IN (
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA'
                            ) THEN 'MANOKWARI OUTER'
                            WHEN upper(kabupaten) IN (
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'NEW SORONG RAJA AMPAT'
                            WHEN upper(kabupaten) IN (
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA'
                            ) THEN 'MIMIKA PUNCAK'
                            WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                            WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                            ELSE NULL
                        END as cluster,
                        kabupaten,
                        trx_date,
                        COUNT(msisdn) as trx
                    FROM ${table} WHERE regional IN ('MALUKU DAN PAPUA', 'PUMA') GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const queryPrevYtd = prevYtdTrxSARev.map(table => `
                        SELECT
                            CASE WHEN regional IN ('PUMA', 'MALUKU DAN PAPUA') THEN 'PUMA' END as region,
                            CASE
                                WHEN upper(kabupaten) IN (
                                    'AMBON',
                                    'KOTA AMBON',
                                    'MALUKU TENGAH',
                                    'SERAM BAGIAN TIMUR',
                                    'KEPULAUAN ARU',
                                    'KOTA TUAL',
                                    'MALUKU BARAT DAYA',
                                    'MALUKU TENGGARA',
                                    'MALUKU TENGGARA BARAT',
                                    'BURU',
                                    'BURU SELATAN',
                                    'SERAM BAGIAN BARAT',
                                    'KEPULAUAN TANIMBAR'
                                ) THEN 'AMBON'
                                WHEN upper(kabupaten) IN (
                                    'KOTA JAYAPURA',
                                    'JAYAPURA',
                                    'KEEROM',
                                    'MAMBERAMO RAYA',
                                    'SARMI',
                                    'BIAK',
                                    'BIAK NUMFOR',
                                    'KEPULAUAN YAPEN',
                                    'SUPIORI',
                                    'WAROPEN',
                                    'JAYAWIJAYA',
                                    'LANNY JAYA',
                                    'MAMBERAMO TENGAH',
                                    'NDUGA',
                                    'PEGUNUNGAN BINTANG',
                                    'TOLIKARA',
                                    'YAHUKIMO',
                                    'YALIMO'
                                ) THEN 'JAYAPURA'
                                WHEN upper(kabupaten) IN (
                                    'MANOKWARI',
                                    'FAKFAK',
                                    'FAK FAK',
                                    'KAIMANA',
                                    'MANOKWARI SELATAN',
                                    'PEGUNUNGAN ARFAK',
                                    'TELUK BINTUNI',
                                    'TELUK WONDAMA',
                                    'KOTA SORONG',
                                    'MAYBRAT',
                                    'RAJA AMPAT',
                                    'SORONG',
                                    'SORONG SELATAN',
                                    'TAMBRAUW'
                                ) THEN 'SORONG'
                                WHEN upper(kabupaten) IN (
                                    'ASMAT',
                                    'BOVEN DIGOEL',
                                    'MAPPI',
                                    'MERAUKE',
                                    'INTAN JAYA',
                                    'MIMIKA',
                                    'PUNCAK',
                                    'PUNCAK JAYA',
                                    'TIMIKA',
                                    'DEIYAI',
                                    'DOGIYAI',
                                    'NABIRE',
                                    'PANIAI'
                                ) THEN 'TIMIKA'
                                ELSE NULL
                            END as branch,
                            CASE
                                WHEN upper(kabupaten) IN (
                                    'AMBON',
                                    'KOTA AMBON',
                                    'MALUKU TENGAH',
                                    'SERAM BAGIAN TIMUR'
                                ) THEN 'AMBON'
                                WHEN upper(kabupaten) IN (
                                    'KEPULAUAN ARU',
                                    'KOTA TUAL',
                                    'MALUKU BARAT DAYA',
                                    'MALUKU TENGGARA',
                                    'MALUKU TENGGARA BARAT',
                                    'KEPULAUAN TANIMBAR'
                                ) THEN 'KEPULAUAN AMBON'
                                WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                                WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                                WHEN upper(kabupaten) IN (
                                    'JAYAPURA',
                                    'KEEROM',
                                    'MAMBERAMO RAYA',
                                    'SARMI',
                                    'BIAK',
                                    'BIAK NUMFOR',
                                    'KEPULAUAN YAPEN',
                                    'SUPIORI',
                                    'WAROPEN',
                                    'JAYAWIJAYA',
                                    'LANNY JAYA',
                                    'MAMBERAMO TENGAH',
                                    'NDUGA',
                                    'PEGUNUNGAN BINTANG',
                                    'TOLIKARA',
                                    'YAHUKIMO',
                                    'YALIMO'
                                ) THEN 'SENTANI'
                                WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                                WHEN upper(kabupaten) IN (
                                    'FAKFAK',
                                    'FAK FAK',
                                    'KAIMANA',
                                    'MANOKWARI SELATAN',
                                    'PEGUNUNGAN ARFAK',
                                    'TELUK BINTUNI',
                                    'TELUK WONDAMA'
                                ) THEN 'MANOKWARI OUTER'
                                WHEN upper(kabupaten) IN (
                                    'KOTA SORONG',
                                    'MAYBRAT',
                                    'RAJA AMPAT',
                                    'SORONG',
                                    'SORONG SELATAN',
                                    'TAMBRAUW'
                                ) THEN 'SORONG RAJA AMPAT'
                                WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                                WHEN upper(kabupaten) IN (
                                    'INTAN JAYA',
                                    'MIMIKA',
                                    'PUNCAK',
                                    'PUNCAK JAYA',
                                    'TIMIKA'
                                ) THEN 'MIMIKA'
                                WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                                ELSE NULL
                            END as subbranch,
                            CASE
                                WHEN upper(kabupaten) IN (
                                    'AMBON',
                                    'KOTA AMBON',
                                    'MALUKU TENGAH',
                                    'SERAM BAGIAN TIMUR'
                                ) THEN 'AMBON'
                                WHEN upper(kabupaten) IN (
                                    'KEPULAUAN ARU',
                                    'KOTA TUAL',
                                    'MALUKU BARAT DAYA',
                                    'MALUKU TENGGARA',
                                    'MALUKU TENGGARA BARAT',
                                    'KEPULAUAN TANIMBAR'
                                ) THEN 'KEPULAUAN TUAL'
                                WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                                WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                                WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                                WHEN upper(kabupaten) IN (
                                    'BIAK',
                                    'BIAK NUMFOR',
                                    'KEPULAUAN YAPEN',
                                    'SUPIORI',
                                    'WAROPEN'
                                ) THEN 'NEW BIAK NUMFOR'
                                WHEN upper(kabupaten) IN (
                                    'JAYAWIJAYA',
                                    'LANNY JAYA',
                                    'MAMBERAMO TENGAH',
                                    'NDUGA',
                                    'PEGUNUNGAN BINTANG',
                                    'TOLIKARA',
                                    'YAHUKIMO',
                                    'YALIMO'
                                ) THEN 'PAPUA PEGUNUNGAN'
                                WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                                WHEN upper(kabupaten) IN (
                                    'FAKFAK',
                                    'FAK FAK',
                                    'KAIMANA',
                                    'MANOKWARI SELATAN',
                                    'PEGUNUNGAN ARFAK',
                                    'TELUK BINTUNI',
                                    'TELUK WONDAMA'
                                ) THEN 'MANOKWARI OUTER'
                                WHEN upper(kabupaten) IN (
                                    'KOTA SORONG',
                                    'MAYBRAT',
                                    'RAJA AMPAT',
                                    'SORONG',
                                    'SORONG SELATAN',
                                    'TAMBRAUW'
                                ) THEN 'NEW SORONG RAJA AMPAT'
                                WHEN upper(kabupaten) IN (
                                    'INTAN JAYA',
                                    'MIMIKA',
                                    'PUNCAK',
                                    'PUNCAK JAYA',
                                    'TIMIKA'
                                ) THEN 'MIMIKA PUNCAK'
                                WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                                WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                                ELSE NULL
                            END as cluster,
                            kabupaten,
                            trx_date,
                            COUNT(msisdn) as trx
                    FROM ${table} WHERE regional IN ('PUMA', 'MALUKU DAN PAPUA') GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const sq = `
                        WITH sq AS (
                            ${queryCurrYtd}
                        )
                        SELECT
                            region,
                            branch,
                            subbranch,
                            cluster,
                            kabupaten,
                            SUM(trx) AS currYtdKabupatenRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch, cluster) AS currYtdClusterRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch) AS currYtdSubbranchRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch) AS currYtdBranchRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region) AS currYtdRegionalRev
                        FROM sq
                        WHERE trx_date BETWEEN '${currJanuaryFirst}' AND '${currDate}' AND kabupaten <> 'TMP'
                        GROUP BY 1, 2, 3, 4, 5
                            `

            const sq5 = `
                        WITH sq5 AS (
                            ${queryPrevYtd}
                        )
                        SELECT
                            region,
                            branch,
                            subbranch,
                            cluster,
                            kabupaten,
                            SUM(trx) AS prevYtdKabupatenRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch, cluster) AS prevYtdClusterRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch) AS prevYtdSubbranchRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch) AS prevYtdBranchRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region) AS prevYtdRegionalRev
                        FROM sq5
                        WHERE trx_date BETWEEN '${prevJanuaryFirst}' AND '${prevYearCurrDate}' AND kabupaten <> 'TMP'
                        GROUP BY 1, 2, 3, 4, 5
                            `

            const [targetRevenue, currMonthRevenue, prevMonthRevenue, prevYearCurrMonthRevenue, currYtdRev, prevYtdRev] = await Promise.all([
                p1.execute(),
                p2.execute(),
                p3.execute(),
                p4.execute(),
                db6.execute(sql.raw(sq)),
                db6.execute(sql.raw(sq5))
            ])

            const regionalsMap = new Map();
            const [currYtdRevenue] = currYtdRev as MySqlRawQueryResult as unknown as [CurrYtDRevenue[], any]
            const [prevYtdRevenue] = prevYtdRev as MySqlRawQueryResult as unknown as [PrevYtDRevenue[], any]

            targetRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthTarget += Number(row.currMonthTargetRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize kabupaten if it doesn't exist
                cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: Number(row.currMonthTargetRev),
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
            })

            currMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthRevenue = Number(row.currMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currMonthRevenue = Number(row.currMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthRevenue = Number(row.currMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthRevenue = Number(row.currMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));

                kabupaten.currMonthRevenue = Number(row.currMonthKabupatenRev)
            })

            prevMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevMonthRevenue = Number(row.prevMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevMonthRevenue = Number(row.prevMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevMonthRevenue = Number(row.prevMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevMonthRevenue = Number(row.prevMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevMonthRevenue = Number(row.prevMonthKabupatenRev)
            })

            prevYearCurrMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthKabupatenRev)
            })

            currYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currYtdRevenue = Number(row.currYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currYtdRevenue = Number(row.currYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currYtdRevenue = Number(row.currYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currYtdRevenue = Number(row.currYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.currYtdRevenue = Number(row.currYtdKabupatenRev)
            })

            prevYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYtdRevenue = Number(row.prevYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYtdRevenue = Number(row.prevYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYtdRevenue = Number(row.prevYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYtdRevenue = Number(row.prevYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYtdRevenue = Number(row.prevYtdKabupatenRev)
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

            return c.json({ data: finalDataRevenue }, 200)
        })
    .get('/trx-sa-prabayar', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 3)
            const month = (selectedDate.getMonth() + 1).toString()

            // KOLOM DINAMIS UNTUK MEMILIH ANTARA KOLOM `m1-m12`
            const monthColumn = `m${month}` as keyof typeof trxSAPrabayar.$inferSelect

            // VARIABLE TANGGAL UNTUK IMPORT TABEL SECARA DINAMIS
            const latestDataDate = subDays(selectedDate, 2); // - 2 days

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const latestMonth = parseInt(format(selectedDate, 'M'), 10)
            const isPrevMonthLastYear = currMonth === '01'
            const prevMonth = isPrevMonthLastYear ? '12' : format(subMonths(selectedDate, 1), 'MM')
            const prevMonthYear = isPrevMonthLastYear ? format(subYears(selectedDate, 1), 'yyyy') : format(selectedDate, 'yyyy')
            const prevYear = format(subYears(selectedDate, 1), 'yyyy')

            // TABEL `sa_detil_`
            const currTrxSa = dynamicRevenueSATable(currYear, currMonth)
            const prevMonthTrxSA = dynamicRevenueSATable(prevMonthYear, prevMonth)
            const prevYearCurrMonthTrxSA = dynamicRevenueSATable(prevYear, currMonth)
            const currYtdTrxSARev: string[] = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                currYtdTrxSARev.push(`sa_detil_${currYear}${monthStr}`)
            }
            const prevYtdTrxSARev: string[] = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                prevYtdTrxSARev.push(`sa_detil_${prevYear}${monthStr}`)
            }

            // VARIABLE TANGGAL
            // Get the last day of the selected month
            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            // get the first day and last day of the selected month dynamically
            const firstDayOfCurrMonth = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const firstDayOfPrevMonth = format(startOfMonth(subMonths(selectedDate, 1)), 'yyyy-MM-dd')
            const firstDayOfPrevYearCurrMonth = format(startOfMonth(subYears(selectedDate, 1)), 'yyyy-MM-dd')

            const currDate = format(endOfCurrMonth, 'yyyy-MM-dd');
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');

            const currJanuaryFirst = `${currYear}-01-01`
            const prevJanuaryFirst = `${prevYear}-01-01`

            const sq2 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${currTrxSa.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${currTrxSa.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${currTrxSa.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${currTrxSa.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${currTrxSa.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
                    `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${currTrxSa.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${currTrxSa.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${currTrxSa.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${currTrxSa.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${currTrxSa.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${currTrxSa.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${currTrxSa.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${currTrxSa.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${currTrxSa.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${currTrxSa.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${currTrxSa.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
                    `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${currTrxSa.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${currTrxSa.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${currTrxSa.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${currTrxSa.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${currTrxSa.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${currTrxSa.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${currTrxSa.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${currTrxSa.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${currTrxSa.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${currTrxSa.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${currTrxSa.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${currTrxSa.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${currTrxSa.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
                    `.as('clusterName'),
                    kabupaten: currTrxSa.kabupaten,
                    trx: sql<number>`COUNT(${currTrxSa.msisdn})`.as('trx')
                })
                .from(currTrxSa)
                .where(and(
                    not(eq(currTrxSa.kabupaten, 'TMP')),
                    eq(currTrxSa.brand, 'prepaid'),
                    and(
                        inArray(currTrxSa.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(currTrxSa.trxDate, firstDayOfCurrMonth, currDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const sq3 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevMonthTrxSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
                    `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
                    `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${prevMonthTrxSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${prevMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
                    `.as('clusterName'),
                    kabupaten: prevMonthTrxSA.kabupaten,
                    trx: sql<number>`COUNT(${prevMonthTrxSA.msisdn})`.as('trx')
                })
                .from(prevMonthTrxSA)
                .where(and(
                    not(eq(prevMonthTrxSA.kabupaten, 'TMP')),
                    eq(prevMonthTrxSA.brand, 'prepaid'),
                    and(
                        inArray(prevMonthTrxSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevMonthTrxSA.trxDate, firstDayOfPrevMonth, prevDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq3')

            const sq4 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevYearCurrMonthTrxSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR',
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'BURU',
             'BURU SELATAN',
             'SERAM BAGIAN BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KOTA JAYAPURA',
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'JAYAPURA'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'MANOKWARI',
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA',
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'ASMAT',
             'BOVEN DIGOEL',
             'MAPPI',
             'MERAUKE',
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA',
             'DEIYAI',
             'DOGIYAI',
             'NABIRE',
             'PANIAI'
         ) THEN 'TIMIKA'
         ELSE NULL
     END
                    `.as('branchName'),
                    subbranchName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'AMBON',
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN AMBON'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'JAYAPURA',
             'KEEROM',
             'MAMBERAMO RAYA',
             'SARMI',
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN',
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'SENTANI'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'SORONG RAJA AMPAT'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         ELSE NULL
     END
                    `.as('subbranchName'),
                    clusterName: sql<string>`
     CASE
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KOTA AMBON',
             'MALUKU TENGAH',
             'SERAM BAGIAN TIMUR'
         ) THEN 'AMBON'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KEPULAUAN ARU',
             'KOTA TUAL',
             'MALUKU BARAT DAYA',
             'MALUKU TENGGARA',
             'MALUKU TENGGARA BARAT',
             'KEPULAUAN TANIMBAR'
         ) THEN 'KEPULAUAN TUAL'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'BIAK',
             'BIAK NUMFOR',
             'KEPULAUAN YAPEN',
             'SUPIORI',
             'WAROPEN'
         ) THEN 'NEW BIAK NUMFOR'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'JAYAWIJAYA',
             'LANNY JAYA',
             'MAMBERAMO TENGAH',
             'NDUGA',
             'PEGUNUNGAN BINTANG',
             'TOLIKARA',
             'YAHUKIMO',
             'YALIMO'
         ) THEN 'PAPUA PEGUNUNGAN'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'FAKFAK',
             'FAK FAK',
             'KAIMANA',
             'MANOKWARI SELATAN',
             'PEGUNUNGAN ARFAK',
             'TELUK BINTUNI',
             'TELUK WONDAMA'
         ) THEN 'MANOKWARI OUTER'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'KOTA SORONG',
             'MAYBRAT',
             'RAJA AMPAT',
             'SORONG',
             'SORONG SELATAN',
             'TAMBRAUW'
         ) THEN 'NEW SORONG RAJA AMPAT'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
             'INTAN JAYA',
             'MIMIKA',
             'PUNCAK',
             'PUNCAK JAYA',
             'TIMIKA'
         ) THEN 'MIMIKA PUNCAK'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
         WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
         ELSE NULL
     END
                    `.as('clusterName'),
                    kabupaten: prevYearCurrMonthTrxSA.kabupaten,
                    trx: sql<number>`COUNT(${prevYearCurrMonthTrxSA.msisdn})`.as('trx')
                })
                .from(prevYearCurrMonthTrxSA)
                .where(and(
                    not(eq(prevYearCurrMonthTrxSA.kabupaten, 'TMP')),
                    eq(prevYearCurrMonthTrxSA.brand, 'prepaid'),
                    and(
                        inArray(prevYearCurrMonthTrxSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevYearCurrMonthTrxSA.trxDate, firstDayOfPrevYearCurrMonth, prevYearCurrDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq4')

            // QUERY UNTUK TARGET BULAN INI
            const p1 = db
                .select({
                    id: regionals.id,
                    region: regionals.regional,
                    branch: branches.branchNew,
                    subbranch: subbranches.subbranchNew,
                    cluster: clusters.cluster,
                    kabupaten: kabupatens.kabupaten,
                    currMonthTargetRev: sql<number>`SUM(${trxSAPrabayar[monthColumn]})`.as('currMonthTargetRev')
                })
                .from(regionals)
                .leftJoin(branches, eq(regionals.id, branches.regionalId))
                .leftJoin(subbranches, eq(branches.id, subbranches.branchId))
                .leftJoin(clusters, eq(subbranches.id, clusters.subbranchId))
                .leftJoin(kabupatens, eq(clusters.id, kabupatens.clusterId))
                .leftJoin(trxSAPrabayar, eq(kabupatens.id, trxSAPrabayar.kabupatenId))
                .groupBy(
                    regionals.regional,
                    branches.branchNew,
                    subbranches.subbranchNew,
                    clusters.cluster,
                    kabupatens.kabupaten
                )
                .orderBy(asc(regionals.regional))
                .prepare()

            const p2 = db6
                .select({
                    region: sql<string>`${sq2.regionName}`.as('region'),
                    branch: sql<string>`${sq2.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq2.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq2.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq2.kabupaten}`.as('kabupaten'),
                    currMonthKabupatenRev: sql<number>`SUM(${sq2.trx})`.as('currMonthKabupatenRev'),
                    currMonthClusterRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName}, ${sq2.subbranchName}, ${sq2.clusterName})`.as('currMonthClusterRev'),
                    currMonthSubbranchRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName}, ${sq2.subbranchName})`.as('currMonthSubbranchRev'),
                    currMonthBranchRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName})`.as('currMonthBranchRev'),
                    currMonthRegionalRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq2)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()


            // QUERY UNTUK MENDAPAT PREV MONTH REVENUE
            const p3 = db6
                .select({
                    region: sql<string>`${sq3.regionName}`.as('region'),
                    branch: sql<string>`${sq3.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq3.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq3.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq3.kabupaten}`.as('kabupaten'),
                    prevMonthKabupatenRev: sql<number>`SUM(${sq3.trx})`.as('currMonthKabupatenRev'),
                    prevMonthClusterRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName}, ${sq3.subbranchName}, ${sq3.clusterName})`.as('currMonthClusterRev'),
                    prevMonthSubbranchRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName}, ${sq3.subbranchName})`.as('currMonthSubbranchRev'),
                    prevMonthBranchRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName})`.as('currMonthBranchRev'),
                    prevMonthRegionalRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq3)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK MENDAPAT PREV YEAR CURR MONTH REVENUE
            const p4 = db6
                .select({
                    region: sql<string>`${sq4.regionName}`.as('region'),
                    branch: sql<string>`${sq4.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq4.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq4.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq4.kabupaten}`.as('kabupaten'),
                    prevYearCurrMonthKabupatenRev: sql<number>`SUM(${sq4.trx})`.as('currMonthKabupatenRev'),
                    prevYearCurrMonthClusterRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName}, ${sq4.subbranchName}, ${sq4.clusterName})`.as('currMonthClusterRev'),
                    prevYearCurrMonthSubbranchRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName}, ${sq4.subbranchName})`.as('currMonthSubbranchRev'),
                    prevYearCurrMonthBranchRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName})`.as('currMonthBranchRev'),
                    prevYearCurrMonthRegionalRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq4)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            const queryCurrYtd = currYtdTrxSARev.map(table => `
                    SELECT
                        CASE WHEN regional IN ('PUMA', 'MALUKU DAN PAPUA') THEN 'PUMA' END as region,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR',
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'BURU',
                                'BURU SELATAN',
                                'SERAM BAGIAN BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KOTA JAYAPURA',
                                'JAYAPURA',
                                'KEEROM',
                                'MAMBERAMO RAYA',
                                'SARMI',
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN',
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'JAYAPURA'
                            WHEN upper(kabupaten) IN (
                                'MANOKWARI',
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA',
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'SORONG'
                            WHEN upper(kabupaten) IN (
                                'ASMAT',
                                'BOVEN DIGOEL',
                                'MAPPI',
                                'MERAUKE',
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA',
                                'DEIYAI',
                                'DOGIYAI',
                                'NABIRE',
                                'PANIAI'
                            ) THEN 'TIMIKA'
                            ELSE NULL
                        END as branch,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'KEPULAUAN AMBON'
                            WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                            WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                            WHEN upper(kabupaten) IN (
                                'JAYAPURA',
                                'KEEROM',
                                'MAMBERAMO RAYA',
                                'SARMI',
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN',
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'SENTANI'
                            WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                            WHEN upper(kabupaten) IN (
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA'
                            ) THEN 'MANOKWARI OUTER'
                            WHEN upper(kabupaten) IN (
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'SORONG RAJA AMPAT'
                            WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                            WHEN upper(kabupaten) IN (
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA'
                            ) THEN 'MIMIKA'
                            WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                            ELSE NULL
                        END as subbranch,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'KEPULAUAN TUAL'
                            WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                            WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                            WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                            WHEN upper(kabupaten) IN (
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN'
                            ) THEN 'NEW BIAK NUMFOR'
                            WHEN upper(kabupaten) IN (
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'PAPUA PEGUNUNGAN'
                            WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                            WHEN upper(kabupaten) IN (
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA'
                            ) THEN 'MANOKWARI OUTER'
                            WHEN upper(kabupaten) IN (
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'NEW SORONG RAJA AMPAT'
                            WHEN upper(kabupaten) IN (
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA'
                            ) THEN 'MIMIKA PUNCAK'
                            WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                            WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                            ELSE NULL
                        END as cluster,
                        kabupaten,
                        trx_date,
                        COUNT(msisdn) as trx
                    FROM ${table} WHERE regional IN ('MALUKU DAN PAPUA', 'PUMA') AND brand = 'prepaid' AND kabupaten <> 'TMP' GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const queryPrevYtd = prevYtdTrxSARev.map(table => `
                        SELECT
                            CASE WHEN regional IN ('PUMA', 'MALUKU DAN PAPUA') THEN 'PUMA' END as region,
                            CASE
                                WHEN upper(kabupaten) IN (
                                    'AMBON',
                                    'KOTA AMBON',
                                    'MALUKU TENGAH',
                                    'SERAM BAGIAN TIMUR',
                                    'KEPULAUAN ARU',
                                    'KOTA TUAL',
                                    'MALUKU BARAT DAYA',
                                    'MALUKU TENGGARA',
                                    'MALUKU TENGGARA BARAT',
                                    'BURU',
                                    'BURU SELATAN',
                                    'SERAM BAGIAN BARAT',
                                    'KEPULAUAN TANIMBAR'
                                ) THEN 'AMBON'
                                WHEN upper(kabupaten) IN (
                                    'KOTA JAYAPURA',
                                    'JAYAPURA',
                                    'KEEROM',
                                    'MAMBERAMO RAYA',
                                    'SARMI',
                                    'BIAK',
                                    'BIAK NUMFOR',
                                    'KEPULAUAN YAPEN',
                                    'SUPIORI',
                                    'WAROPEN',
                                    'JAYAWIJAYA',
                                    'LANNY JAYA',
                                    'MAMBERAMO TENGAH',
                                    'NDUGA',
                                    'PEGUNUNGAN BINTANG',
                                    'TOLIKARA',
                                    'YAHUKIMO',
                                    'YALIMO'
                                ) THEN 'JAYAPURA'
                                WHEN upper(kabupaten) IN (
                                    'MANOKWARI',
                                    'FAKFAK',
                                    'FAK FAK',
                                    'KAIMANA',
                                    'MANOKWARI SELATAN',
                                    'PEGUNUNGAN ARFAK',
                                    'TELUK BINTUNI',
                                    'TELUK WONDAMA',
                                    'KOTA SORONG',
                                    'MAYBRAT',
                                    'RAJA AMPAT',
                                    'SORONG',
                                    'SORONG SELATAN',
                                    'TAMBRAUW'
                                ) THEN 'SORONG'
                                WHEN upper(kabupaten) IN (
                                    'ASMAT',
                                    'BOVEN DIGOEL',
                                    'MAPPI',
                                    'MERAUKE',
                                    'INTAN JAYA',
                                    'MIMIKA',
                                    'PUNCAK',
                                    'PUNCAK JAYA',
                                    'TIMIKA',
                                    'DEIYAI',
                                    'DOGIYAI',
                                    'NABIRE',
                                    'PANIAI'
                                ) THEN 'TIMIKA'
                                ELSE NULL
                            END as branch,
                            CASE
                                WHEN upper(kabupaten) IN (
                                    'AMBON',
                                    'KOTA AMBON',
                                    'MALUKU TENGAH',
                                    'SERAM BAGIAN TIMUR'
                                ) THEN 'AMBON'
                                WHEN upper(kabupaten) IN (
                                    'KEPULAUAN ARU',
                                    'KOTA TUAL',
                                    'MALUKU BARAT DAYA',
                                    'MALUKU TENGGARA',
                                    'MALUKU TENGGARA BARAT',
                                    'KEPULAUAN TANIMBAR'
                                ) THEN 'KEPULAUAN AMBON'
                                WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                                WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                                WHEN upper(kabupaten) IN (
                                    'JAYAPURA',
                                    'KEEROM',
                                    'MAMBERAMO RAYA',
                                    'SARMI',
                                    'BIAK',
                                    'BIAK NUMFOR',
                                    'KEPULAUAN YAPEN',
                                    'SUPIORI',
                                    'WAROPEN',
                                    'JAYAWIJAYA',
                                    'LANNY JAYA',
                                    'MAMBERAMO TENGAH',
                                    'NDUGA',
                                    'PEGUNUNGAN BINTANG',
                                    'TOLIKARA',
                                    'YAHUKIMO',
                                    'YALIMO'
                                ) THEN 'SENTANI'
                                WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                                WHEN upper(kabupaten) IN (
                                    'FAKFAK',
                                    'FAK FAK',
                                    'KAIMANA',
                                    'MANOKWARI SELATAN',
                                    'PEGUNUNGAN ARFAK',
                                    'TELUK BINTUNI',
                                    'TELUK WONDAMA'
                                ) THEN 'MANOKWARI OUTER'
                                WHEN upper(kabupaten) IN (
                                    'KOTA SORONG',
                                    'MAYBRAT',
                                    'RAJA AMPAT',
                                    'SORONG',
                                    'SORONG SELATAN',
                                    'TAMBRAUW'
                                ) THEN 'SORONG RAJA AMPAT'
                                WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                                WHEN upper(kabupaten) IN (
                                    'INTAN JAYA',
                                    'MIMIKA',
                                    'PUNCAK',
                                    'PUNCAK JAYA',
                                    'TIMIKA'
                                ) THEN 'MIMIKA'
                                WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                                ELSE NULL
                            END as subbranch,
                            CASE
                                WHEN upper(kabupaten) IN (
                                    'AMBON',
                                    'KOTA AMBON',
                                    'MALUKU TENGAH',
                                    'SERAM BAGIAN TIMUR'
                                ) THEN 'AMBON'
                                WHEN upper(kabupaten) IN (
                                    'KEPULAUAN ARU',
                                    'KOTA TUAL',
                                    'MALUKU BARAT DAYA',
                                    'MALUKU TENGGARA',
                                    'MALUKU TENGGARA BARAT',
                                    'KEPULAUAN TANIMBAR'
                                ) THEN 'KEPULAUAN TUAL'
                                WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                                WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                                WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                                WHEN upper(kabupaten) IN (
                                    'BIAK',
                                    'BIAK NUMFOR',
                                    'KEPULAUAN YAPEN',
                                    'SUPIORI',
                                    'WAROPEN'
                                ) THEN 'NEW BIAK NUMFOR'
                                WHEN upper(kabupaten) IN (
                                    'JAYAWIJAYA',
                                    'LANNY JAYA',
                                    'MAMBERAMO TENGAH',
                                    'NDUGA',
                                    'PEGUNUNGAN BINTANG',
                                    'TOLIKARA',
                                    'YAHUKIMO',
                                    'YALIMO'
                                ) THEN 'PAPUA PEGUNUNGAN'
                                WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                                WHEN upper(kabupaten) IN (
                                    'FAKFAK',
                                    'FAK FAK',
                                    'KAIMANA',
                                    'MANOKWARI SELATAN',
                                    'PEGUNUNGAN ARFAK',
                                    'TELUK BINTUNI',
                                    'TELUK WONDAMA'
                                ) THEN 'MANOKWARI OUTER'
                                WHEN upper(kabupaten) IN (
                                    'KOTA SORONG',
                                    'MAYBRAT',
                                    'RAJA AMPAT',
                                    'SORONG',
                                    'SORONG SELATAN',
                                    'TAMBRAUW'
                                ) THEN 'NEW SORONG RAJA AMPAT'
                                WHEN upper(kabupaten) IN (
                                    'INTAN JAYA',
                                    'MIMIKA',
                                    'PUNCAK',
                                    'PUNCAK JAYA',
                                    'TIMIKA'
                                ) THEN 'MIMIKA PUNCAK'
                                WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                                WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                                ELSE NULL
                            END as cluster,
                            kabupaten,
                            trx_date,
                            COUNT(msisdn) as trx
                    FROM ${table} WHERE regional IN ('PUMA', 'MALUKU DAN PAPUA') AND brand = 'prepaid' AND kabupaten <> 'TMP' GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const sq = `
                        WITH sq AS (
                            ${queryCurrYtd}
                        )
                        SELECT
                            region,
                            branch,
                            subbranch,
                            cluster,
                            kabupaten,
                            SUM(trx) AS currYtdKabupatenRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch, cluster) AS currYtdClusterRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch) AS currYtdSubbranchRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch) AS currYtdBranchRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region) AS currYtdRegionalRev
                        FROM sq
                        WHERE trx_date BETWEEN '${currJanuaryFirst}' AND '${currDate}'
                        GROUP BY 1, 2, 3, 4, 5
                            `

            const sq5 = `
                        WITH sq5 AS (
                            ${queryPrevYtd}
                        )
                        SELECT
                            region,
                            branch,
                            subbranch,
                            cluster,
                            kabupaten,
                            SUM(trx) AS prevYtdKabupatenRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch, cluster) AS prevYtdClusterRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch) AS prevYtdSubbranchRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region, branch) AS prevYtdBranchRev,
                            SUM(SUM(trx)) OVER (PARTITION BY region) AS prevYtdRegionalRev
                        FROM sq5
                        WHERE trx_date BETWEEN '${prevJanuaryFirst}' AND '${prevYearCurrDate}'
                        GROUP BY 1, 2, 3, 4, 5
                            `

            const [targetRevenue, currMonthRevenue, prevMonthRevenue, prevYearCurrMonthRevenue, currYtdRev, prevYtdRev] = await Promise.all([
                p1.execute(),
                p2.execute(),
                p3.execute(),
                p4.execute(),
                db6.execute(sql.raw(sq)),
                db6.execute(sql.raw(sq5))
            ])

            const regionalsMap = new Map();
            const [currYtdRevenue] = currYtdRev as MySqlRawQueryResult as unknown as [CurrYtDRevenue[], any]
            const [prevYtdRevenue] = prevYtdRev as MySqlRawQueryResult as unknown as [PrevYtDRevenue[], any]

            targetRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthTarget += Number(row.currMonthTargetRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize kabupaten if it doesn't exist
                cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: Number(row.currMonthTargetRev),
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
            })

            currMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthRevenue = Number(row.currMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currMonthRevenue = Number(row.currMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthRevenue = Number(row.currMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthRevenue = Number(row.currMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));

                kabupaten.currMonthRevenue = Number(row.currMonthKabupatenRev)
            })

            prevMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevMonthRevenue = Number(row.prevMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevMonthRevenue = Number(row.prevMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevMonthRevenue = Number(row.prevMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevMonthRevenue = Number(row.prevMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevMonthRevenue = Number(row.prevMonthKabupatenRev)
            })

            prevYearCurrMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthKabupatenRev)
            })

            currYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currYtdRevenue = Number(row.currYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currYtdRevenue = Number(row.currYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currYtdRevenue = Number(row.currYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currYtdRevenue = Number(row.currYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.currYtdRevenue = Number(row.currYtdKabupatenRev)
            })

            prevYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYtdRevenue = Number(row.prevYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYtdRevenue = Number(row.prevYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYtdRevenue = Number(row.prevYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYtdRevenue = Number(row.prevYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYtdRevenue = Number(row.prevYtdKabupatenRev)
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

            return c.json({ data: finalDataRevenue }, 200)
        })
    .get('/trx-sa-byu', zValidator('query', z.object({ date: z.coerce.date().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 3)
            const month = (selectedDate.getMonth() + 1).toString()


            // KOLOM DINAMIS UNTUK MEMILIH ANTARA KOLOM `m1-m12`
            const monthColumn = `m${month}` as keyof typeof trxSAByu.$inferSelect

            // VARIABLE TANGGAL UNTUK IMPORT TABEL SECARA DINAMIS
            const latestDataDate = subDays(selectedDate, 3); // - 3 days

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const latestMonth = parseInt(format(selectedDate, 'M'), 10)
            const isPrevMonthLastYear = currMonth === '01'
            const prevMonth = isPrevMonthLastYear ? '12' : format(subMonths(selectedDate, 1), 'MM')
            const prevMonthYear = isPrevMonthLastYear ? format(subYears(selectedDate, 1), 'yyyy') : format(selectedDate, 'yyyy')
            const prevYear = format(subYears(selectedDate, 1), 'yyyy')

            // TABEL `sa_detil_`
            const currTrxSa = dynamicRevenueSATable(currYear, currMonth)
            const prevMonthTrxSA = dynamicRevenueSATable(prevMonthYear, prevMonth)
            const prevYearCurrMonthTrxSA = dynamicRevenueSATable(prevYear, currMonth)
            const currYtdTrxSARev: string[] = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                currYtdTrxSARev.push(`sa_detil_${currYear}${monthStr}`)
            }
            const prevYtdTrxSARev: string[] = [];
            for (let month = 1; month <= latestMonth; month++) {
                const monthStr = month.toString().padStart(2, '0')
                prevYtdTrxSARev.push(`sa_detil_${prevYear}${monthStr}`)
            }

            // VARIABLE TANGGAL
            // Get the last day of the selected month
            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            // get the first day and last day of the selected month dynamically
            const firstDayOfCurrMonth = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const firstDayOfPrevMonth = format(startOfMonth(subMonths(selectedDate, 1)), 'yyyy-MM-dd')
            const firstDayOfPrevYearCurrMonth = format(startOfMonth(subYears(selectedDate, 1)), 'yyyy-MM-dd')

            const currDate = format(endOfCurrMonth, 'yyyy-MM-dd');
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');

            const currJanuaryFirst = `${currYear}-01-01`
            const prevJanuaryFirst = `${prevYear}-01-01`

            const sq2 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${currTrxSa.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
 CASE
     WHEN ${currTrxSa.kabupaten} IN (
         'AMBON',
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR',
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'BURU',
         'BURU SELATAN',
         'SERAM BAGIAN BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'AMBON'
     WHEN ${currTrxSa.kabupaten} IN (
         'KOTA JAYAPURA',
         'JAYAPURA',
         'KEEROM',
         'MAMBERAMO RAYA',
         'SARMI',
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN',
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'JAYAPURA'
     WHEN ${currTrxSa.kabupaten} IN (
         'MANOKWARI',
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA',
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'SORONG'
     WHEN ${currTrxSa.kabupaten} IN (
         'ASMAT',
         'BOVEN DIGOEL',
         'MAPPI',
         'MERAUKE',
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA',
         'DEIYAI',
         'DOGIYAI',
         'NABIRE',
         'PANIAI'
     ) THEN 'TIMIKA'
     ELSE NULL
 END
                `.as('branchName'),
                    subbranchName: sql<string>`
 CASE
     WHEN ${currTrxSa.kabupaten} IN (
         'AMBON',
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR'
     ) THEN 'AMBON'
     WHEN ${currTrxSa.kabupaten} IN (
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'KEPULAUAN AMBON'
     WHEN ${currTrxSa.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
     WHEN ${currTrxSa.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
     WHEN ${currTrxSa.kabupaten} IN (
         'JAYAPURA',
         'KEEROM',
         'MAMBERAMO RAYA',
         'SARMI',
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN',
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'SENTANI'
     WHEN ${currTrxSa.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
     WHEN ${currTrxSa.kabupaten} IN (
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA'
     ) THEN 'MANOKWARI OUTER'
     WHEN ${currTrxSa.kabupaten} IN (
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'SORONG RAJA AMPAT'
     WHEN ${currTrxSa.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
     WHEN ${currTrxSa.kabupaten} IN (
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA'
     ) THEN 'MIMIKA'
     WHEN ${currTrxSa.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
     ELSE NULL
 END
                `.as('subbranchName'),
                    clusterName: sql<string>`
 CASE
     WHEN ${currTrxSa.kabupaten} IN (
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR'
     ) THEN 'AMBON'
     WHEN ${currTrxSa.kabupaten} IN (
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'KEPULAUAN TUAL'
     WHEN ${currTrxSa.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
     WHEN ${currTrxSa.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
     WHEN ${currTrxSa.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
     WHEN ${currTrxSa.kabupaten} IN (
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN'
     ) THEN 'NEW BIAK NUMFOR'
     WHEN ${currTrxSa.kabupaten} IN (
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'PAPUA PEGUNUNGAN'
     WHEN ${currTrxSa.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
     WHEN ${currTrxSa.kabupaten} IN (
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA'
     ) THEN 'MANOKWARI OUTER'
     WHEN ${currTrxSa.kabupaten} IN (
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'NEW SORONG RAJA AMPAT'
     WHEN ${currTrxSa.kabupaten} IN (
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA'
     ) THEN 'MIMIKA PUNCAK'
     WHEN ${currTrxSa.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
     WHEN ${currTrxSa.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
     ELSE NULL
 END
                `.as('clusterName'),
                    kabupaten: currTrxSa.kabupaten,
                    trx: sql<number>`COUNT(${currTrxSa.msisdn})`.as('trx')
                })
                .from(currTrxSa)
                .where(and(
                    not(eq(currTrxSa.kabupaten, 'TMP')),
                    eq(currTrxSa.brand, 'byu'),
                    and(
                        inArray(currTrxSa.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(currTrxSa.trxDate, firstDayOfCurrMonth, currDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq2')

            const sq3 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevMonthTrxSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
 CASE
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'AMBON',
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR',
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'BURU',
         'BURU SELATAN',
         'SERAM BAGIAN BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'AMBON'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'KOTA JAYAPURA',
         'JAYAPURA',
         'KEEROM',
         'MAMBERAMO RAYA',
         'SARMI',
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN',
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'JAYAPURA'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'MANOKWARI',
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA',
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'SORONG'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'ASMAT',
         'BOVEN DIGOEL',
         'MAPPI',
         'MERAUKE',
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA',
         'DEIYAI',
         'DOGIYAI',
         'NABIRE',
         'PANIAI'
     ) THEN 'TIMIKA'
     ELSE NULL
 END
                `.as('branchName'),
                    subbranchName: sql<string>`
 CASE
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'AMBON',
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR'
     ) THEN 'AMBON'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'KEPULAUAN AMBON'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'JAYAPURA',
         'KEEROM',
         'MAMBERAMO RAYA',
         'SARMI',
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN',
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'SENTANI'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA'
     ) THEN 'MANOKWARI OUTER'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'SORONG RAJA AMPAT'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA'
     ) THEN 'MIMIKA'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
     ELSE NULL
 END
                `.as('subbranchName'),
                    clusterName: sql<string>`
 CASE
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR'
     ) THEN 'AMBON'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'KEPULAUAN TUAL'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN'
     ) THEN 'NEW BIAK NUMFOR'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'PAPUA PEGUNUNGAN'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA'
     ) THEN 'MANOKWARI OUTER'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'NEW SORONG RAJA AMPAT'
     WHEN ${prevMonthTrxSA.kabupaten} IN (
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA'
     ) THEN 'MIMIKA PUNCAK'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
     WHEN ${prevMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
     ELSE NULL
 END
                `.as('clusterName'),
                    kabupaten: prevMonthTrxSA.kabupaten,
                    trx: sql<number>`COUNT(${prevMonthTrxSA.msisdn})`.as('trx')
                })
                .from(prevMonthTrxSA)
                .where(and(
                    not(eq(prevMonthTrxSA.kabupaten, 'TMP')),
                    eq(prevMonthTrxSA.brand, 'byu'),
                    and(
                        inArray(prevMonthTrxSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevMonthTrxSA.trxDate, firstDayOfPrevMonth, prevDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq3')

            const sq4 = db6
                .select({
                    regionName: sql<string>`CASE WHEN ${prevYearCurrMonthTrxSA.regional} IN ('MALUKU DAN PAPUA', 'PUMA') THEN 'PUMA' END`.as('regionName'),
                    branchName: sql<string>`
 CASE
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'AMBON',
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR',
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'BURU',
         'BURU SELATAN',
         'SERAM BAGIAN BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'AMBON'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'KOTA JAYAPURA',
         'JAYAPURA',
         'KEEROM',
         'MAMBERAMO RAYA',
         'SARMI',
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN',
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'JAYAPURA'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'MANOKWARI',
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA',
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'SORONG'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'ASMAT',
         'BOVEN DIGOEL',
         'MAPPI',
         'MERAUKE',
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA',
         'DEIYAI',
         'DOGIYAI',
         'NABIRE',
         'PANIAI'
     ) THEN 'TIMIKA'
     ELSE NULL
 END
                `.as('branchName'),
                    subbranchName: sql<string>`
 CASE
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'AMBON',
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR'
     ) THEN 'AMBON'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'KEPULAUAN AMBON'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'JAYAPURA',
         'KEEROM',
         'MAMBERAMO RAYA',
         'SARMI',
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN',
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'SENTANI'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA'
     ) THEN 'MANOKWARI OUTER'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'SORONG RAJA AMPAT'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA'
     ) THEN 'MIMIKA'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
     ELSE NULL
 END
                `.as('subbranchName'),
                    clusterName: sql<string>`
 CASE
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'KOTA AMBON',
         'MALUKU TENGAH',
         'SERAM BAGIAN TIMUR'
     ) THEN 'AMBON'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'KEPULAUAN ARU',
         'KOTA TUAL',
         'MALUKU BARAT DAYA',
         'MALUKU TENGGARA',
         'MALUKU TENGGARA BARAT',
         'KEPULAUAN TANIMBAR'
     ) THEN 'KEPULAUAN TUAL'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'BIAK',
         'BIAK NUMFOR',
         'KEPULAUAN YAPEN',
         'SUPIORI',
         'WAROPEN'
     ) THEN 'NEW BIAK NUMFOR'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'JAYAWIJAYA',
         'LANNY JAYA',
         'MAMBERAMO TENGAH',
         'NDUGA',
         'PEGUNUNGAN BINTANG',
         'TOLIKARA',
         'YAHUKIMO',
         'YALIMO'
     ) THEN 'PAPUA PEGUNUNGAN'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('MANOKWARI') THEN 'MANOKWARI'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'FAKFAK',
         'FAK FAK',
         'KAIMANA',
         'MANOKWARI SELATAN',
         'PEGUNUNGAN ARFAK',
         'TELUK BINTUNI',
         'TELUK WONDAMA'
     ) THEN 'MANOKWARI OUTER'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'KOTA SORONG',
         'MAYBRAT',
         'RAJA AMPAT',
         'SORONG',
         'SORONG SELATAN',
         'TAMBRAUW'
     ) THEN 'NEW SORONG RAJA AMPAT'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN (
         'INTAN JAYA',
         'MIMIKA',
         'PUNCAK',
         'PUNCAK JAYA',
         'TIMIKA'
     ) THEN 'MIMIKA PUNCAK'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
     WHEN ${prevYearCurrMonthTrxSA.kabupaten} IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
     ELSE NULL
 END
                `.as('clusterName'),
                    kabupaten: prevYearCurrMonthTrxSA.kabupaten,
                    trx: sql<number>`COUNT(${prevYearCurrMonthTrxSA.msisdn})`.as('trx')
                })
                .from(prevYearCurrMonthTrxSA)
                .where(and(
                    not(eq(prevYearCurrMonthTrxSA.kabupaten, 'TMP')),
                    eq(prevYearCurrMonthTrxSA.brand, 'byu'),
                    and(
                        inArray(prevYearCurrMonthTrxSA.regional, ['MALUKU DAN PAPUA', 'PUMA']),
                        between(prevYearCurrMonthTrxSA.trxDate, firstDayOfPrevYearCurrMonth, prevYearCurrDate)
                    )
                ))
                .groupBy(sql`1,2,3,4,5`)
                .as('sq4')

            // QUERY UNTUK TARGET BULAN INI
            const p1 = db
                .select({
                    id: regionals.id,
                    region: regionals.regional,
                    branch: branches.branchNew,
                    subbranch: subbranches.subbranchNew,
                    cluster: clusters.cluster,
                    kabupaten: kabupatens.kabupaten,
                    currMonthTargetRev: sql<number>`SUM(${trxSAByu[monthColumn]})`.as('currMonthTargetRev')
                })
                .from(regionals)
                .leftJoin(branches, eq(regionals.id, branches.regionalId))
                .leftJoin(subbranches, eq(branches.id, subbranches.branchId))
                .leftJoin(clusters, eq(subbranches.id, clusters.subbranchId))
                .leftJoin(kabupatens, eq(clusters.id, kabupatens.clusterId))
                .leftJoin(trxSAByu, eq(kabupatens.id, trxSAByu.kabupatenId))
                .groupBy(
                    regionals.regional,
                    branches.branchNew,
                    subbranches.subbranchNew,
                    clusters.cluster,
                    kabupatens.kabupaten
                )
                .orderBy(asc(regionals.regional))
                .prepare()

            const p2 = db6
                .select({
                    region: sql<string>`${sq2.regionName}`.as('region'),
                    branch: sql<string>`${sq2.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq2.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq2.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq2.kabupaten}`.as('kabupaten'),
                    currMonthKabupatenRev: sql<number>`SUM(${sq2.trx})`.as('currMonthKabupatenRev'),
                    currMonthClusterRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName}, ${sq2.subbranchName}, ${sq2.clusterName})`.as('currMonthClusterRev'),
                    currMonthSubbranchRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName}, ${sq2.subbranchName})`.as('currMonthSubbranchRev'),
                    currMonthBranchRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName}, ${sq2.branchName})`.as('currMonthBranchRev'),
                    currMonthRegionalRev: sql<number>`SUM(SUM(${sq2.trx})) OVER (PARTITION BY ${sq2.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq2)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()


            // QUERY UNTUK MENDAPAT PREV MONTH REVENUE
            const p3 = db6
                .select({
                    region: sql<string>`${sq3.regionName}`.as('region'),
                    branch: sql<string>`${sq3.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq3.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq3.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq3.kabupaten}`.as('kabupaten'),
                    prevMonthKabupatenRev: sql<number>`SUM(${sq3.trx})`.as('currMonthKabupatenRev'),
                    prevMonthClusterRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName}, ${sq3.subbranchName}, ${sq3.clusterName})`.as('currMonthClusterRev'),
                    prevMonthSubbranchRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName}, ${sq3.subbranchName})`.as('currMonthSubbranchRev'),
                    prevMonthBranchRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName}, ${sq3.branchName})`.as('currMonthBranchRev'),
                    prevMonthRegionalRev: sql<number>`SUM(SUM(${sq3.trx})) OVER (PARTITION BY ${sq3.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq3)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            // QUERY UNTUK MENDAPAT PREV YEAR CURR MONTH REVENUE
            const p4 = db6
                .select({
                    region: sql<string>`${sq4.regionName}`.as('region'),
                    branch: sql<string>`${sq4.branchName}`.as('branch'), // Keep only one branchName
                    subbranch: sql<string>`${sq4.subbranchName}`.as('subbranch'),
                    cluster: sql<string>`${sq4.clusterName}`.as('cluster'),
                    kabupaten: sql<string>`${sq4.kabupaten}`.as('kabupaten'),
                    prevYearCurrMonthKabupatenRev: sql<number>`SUM(${sq4.trx})`.as('currMonthKabupatenRev'),
                    prevYearCurrMonthClusterRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName}, ${sq4.subbranchName}, ${sq4.clusterName})`.as('currMonthClusterRev'),
                    prevYearCurrMonthSubbranchRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName}, ${sq4.subbranchName})`.as('currMonthSubbranchRev'),
                    prevYearCurrMonthBranchRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName}, ${sq4.branchName})`.as('currMonthBranchRev'),
                    prevYearCurrMonthRegionalRev: sql<number>`SUM(SUM(${sq4.trx})) OVER (PARTITION BY ${sq4.regionName})`.as('currMonthRegionalRev')
                })
                .from(sq4)
                .groupBy(sql`1,2,3,4,5`)
                .prepare()

            const queryCurrYtd = currYtdTrxSARev.map(table => `
                SELECT
                    CASE WHEN regional IN ('PUMA', 'MALUKU DAN PAPUA') THEN 'PUMA' END as region,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR',
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'BURU',
                            'BURU SELATAN',
                            'SERAM BAGIAN BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KOTA JAYAPURA',
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'MANOKWARI',
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA',
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG'
                        WHEN upper(kabupaten) IN (
                            'ASMAT',
                            'BOVEN DIGOEL',
                            'MAPPI',
                            'MERAUKE',
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA',
                            'DEIYAI',
                            'DOGIYAI',
                            'NABIRE',
                            'PANIAI'
                        ) THEN 'TIMIKA'
                        ELSE NULL
                    END as branch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN AMBON'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                        WHEN upper(kabupaten) IN (
                            'JAYAPURA',
                            'KEEROM',
                            'MAMBERAMO RAYA',
                            'SARMI',
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN',
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'SENTANI'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        ELSE NULL
                    END as subbranch,
                    CASE
                        WHEN upper(kabupaten) IN (
                            'AMBON',
                            'KOTA AMBON',
                            'MALUKU TENGAH',
                            'SERAM BAGIAN TIMUR'
                        ) THEN 'AMBON'
                        WHEN upper(kabupaten) IN (
                            'KEPULAUAN ARU',
                            'KOTA TUAL',
                            'MALUKU BARAT DAYA',
                            'MALUKU TENGGARA',
                            'MALUKU TENGGARA BARAT',
                            'KEPULAUAN TANIMBAR'
                        ) THEN 'KEPULAUAN TUAL'
                        WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                        WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                        WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                        WHEN upper(kabupaten) IN (
                            'BIAK',
                            'BIAK NUMFOR',
                            'KEPULAUAN YAPEN',
                            'SUPIORI',
                            'WAROPEN'
                        ) THEN 'NEW BIAK NUMFOR'
                        WHEN upper(kabupaten) IN (
                            'JAYAWIJAYA',
                            'LANNY JAYA',
                            'MAMBERAMO TENGAH',
                            'NDUGA',
                            'PEGUNUNGAN BINTANG',
                            'TOLIKARA',
                            'YAHUKIMO',
                            'YALIMO'
                        ) THEN 'PAPUA PEGUNUNGAN'
                        WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                        WHEN upper(kabupaten) IN (
                            'FAKFAK',
                            'FAK FAK',
                            'KAIMANA',
                            'MANOKWARI SELATAN',
                            'PEGUNUNGAN ARFAK',
                            'TELUK BINTUNI',
                            'TELUK WONDAMA'
                        ) THEN 'MANOKWARI OUTER'
                        WHEN upper(kabupaten) IN (
                            'KOTA SORONG',
                            'MAYBRAT',
                            'RAJA AMPAT',
                            'SORONG',
                            'SORONG SELATAN',
                            'TAMBRAUW'
                        ) THEN 'NEW SORONG RAJA AMPAT'
                        WHEN upper(kabupaten) IN (
                            'INTAN JAYA',
                            'MIMIKA',
                            'PUNCAK',
                            'PUNCAK JAYA',
                            'TIMIKA'
                        ) THEN 'MIMIKA PUNCAK'
                        WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                        WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                        ELSE NULL
                    END as cluster,
                    kabupaten,
                    trx_date,
                    COUNT(msisdn) as trx
                FROM ${table} WHERE regional IN ('MALUKU DAN PAPUA', 'PUMA') AND brand = 'byu' AND kabupaten <> 'TMP' GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const queryPrevYtd = prevYtdTrxSARev.map(table => `
                    SELECT
                        CASE WHEN regional IN ('PUMA', 'MALUKU DAN PAPUA') THEN 'PUMA' END as region,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR',
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'BURU',
                                'BURU SELATAN',
                                'SERAM BAGIAN BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KOTA JAYAPURA',
                                'JAYAPURA',
                                'KEEROM',
                                'MAMBERAMO RAYA',
                                'SARMI',
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN',
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'JAYAPURA'
                            WHEN upper(kabupaten) IN (
                                'MANOKWARI',
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA',
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'SORONG'
                            WHEN upper(kabupaten) IN (
                                'ASMAT',
                                'BOVEN DIGOEL',
                                'MAPPI',
                                'MERAUKE',
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA',
                                'DEIYAI',
                                'DOGIYAI',
                                'NABIRE',
                                'PANIAI'
                            ) THEN 'TIMIKA'
                            ELSE NULL
                        END as branch,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'KEPULAUAN AMBON'
                            WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BURU'
                            WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'JAYAPURA'
                            WHEN upper(kabupaten) IN (
                                'JAYAPURA',
                                'KEEROM',
                                'MAMBERAMO RAYA',
                                'SARMI',
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN',
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'SENTANI'
                            WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                            WHEN upper(kabupaten) IN (
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA'
                            ) THEN 'MANOKWARI OUTER'
                            WHEN upper(kabupaten) IN (
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'SORONG RAJA AMPAT'
                            WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'MERAUKE'
                            WHEN upper(kabupaten) IN (
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA'
                            ) THEN 'MIMIKA'
                            WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                            ELSE NULL
                        END as subbranch,
                        CASE
                            WHEN upper(kabupaten) IN (
                                'AMBON',
                                'KOTA AMBON',
                                'MALUKU TENGAH',
                                'SERAM BAGIAN TIMUR'
                            ) THEN 'AMBON'
                            WHEN upper(kabupaten) IN (
                                'KEPULAUAN ARU',
                                'KOTA TUAL',
                                'MALUKU BARAT DAYA',
                                'MALUKU TENGGARA',
                                'MALUKU TENGGARA BARAT',
                                'KEPULAUAN TANIMBAR'
                            ) THEN 'KEPULAUAN TUAL'
                            WHEN upper(kabupaten) IN ('BURU', 'BURU SELATAN', 'SERAM BAGIAN BARAT') THEN 'SERAM BARAT BURU'
                            WHEN upper(kabupaten) IN ('KOTA JAYAPURA') THEN 'KOTA JAYAPURA'
                            WHEN upper(kabupaten) IN ('JAYAPURA', 'KEEROM', 'MAMBERAMO RAYA', 'SARMI') THEN 'JAYAPURA OUTER'
                            WHEN upper(kabupaten) IN (
                                'BIAK',
                                'BIAK NUMFOR',
                                'KEPULAUAN YAPEN',
                                'SUPIORI',
                                'WAROPEN'
                            ) THEN 'NEW BIAK NUMFOR'
                            WHEN upper(kabupaten) IN (
                                'JAYAWIJAYA',
                                'LANNY JAYA',
                                'MAMBERAMO TENGAH',
                                'NDUGA',
                                'PEGUNUNGAN BINTANG',
                                'TOLIKARA',
                                'YAHUKIMO',
                                'YALIMO'
                            ) THEN 'PAPUA PEGUNUNGAN'
                            WHEN upper(kabupaten) IN ('MANOKWARI') THEN 'MANOKWARI'
                            WHEN upper(kabupaten) IN (
                                'FAKFAK',
                                'FAK FAK',
                                'KAIMANA',
                                'MANOKWARI SELATAN',
                                'PEGUNUNGAN ARFAK',
                                'TELUK BINTUNI',
                                'TELUK WONDAMA'
                            ) THEN 'MANOKWARI OUTER'
                            WHEN upper(kabupaten) IN (
                                'KOTA SORONG',
                                'MAYBRAT',
                                'RAJA AMPAT',
                                'SORONG',
                                'SORONG SELATAN',
                                'TAMBRAUW'
                            ) THEN 'NEW SORONG RAJA AMPAT'
                            WHEN upper(kabupaten) IN (
                                'INTAN JAYA',
                                'MIMIKA',
                                'PUNCAK',
                                'PUNCAK JAYA',
                                'TIMIKA'
                            ) THEN 'MIMIKA PUNCAK'
                            WHEN upper(kabupaten) IN ('DEIYAI', 'DOGIYAI', 'NABIRE', 'PANIAI') THEN 'NABIRE'
                            WHEN upper(kabupaten) IN ('ASMAT', 'BOVEN DIGOEL', 'MAPPI', 'MERAUKE') THEN 'NEW MERAUKE'
                            ELSE NULL
                        END as cluster,
                        kabupaten,
                        trx_date,
                        COUNT(msisdn) as trx
                FROM ${table} WHERE regional IN ('PUMA', 'MALUKU DAN PAPUA') AND brand = 'byu' AND kabupaten <> 'TMP' GROUP BY 1,2,3,4,5`).join(' UNION ALL ')

            const sq = `
                    WITH sq AS (
                        ${queryCurrYtd}
                    )
                    SELECT
                        region,
                        branch,
                        subbranch,
                        cluster,
                        kabupaten,
                        SUM(trx) AS currYtdKabupatenRev,
                        SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch, cluster) AS currYtdClusterRev,
                        SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch) AS currYtdSubbranchRev,
                        SUM(SUM(trx)) OVER (PARTITION BY region, branch) AS currYtdBranchRev,
                        SUM(SUM(trx)) OVER (PARTITION BY region) AS currYtdRegionalRev
                    FROM sq
                    WHERE trx_date BETWEEN '${currJanuaryFirst}' AND '${currDate}'
                    GROUP BY 1, 2, 3, 4, 5
                        `

            const sq5 = `
                    WITH sq5 AS (
                        ${queryPrevYtd}
                    )
                    SELECT
                        region,
                        branch,
                        subbranch,
                        cluster,
                        kabupaten,
                        SUM(trx) AS prevYtdKabupatenRev,
                        SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch, cluster) AS prevYtdClusterRev,
                        SUM(SUM(trx)) OVER (PARTITION BY region, branch, subbranch) AS prevYtdSubbranchRev,
                        SUM(SUM(trx)) OVER (PARTITION BY region, branch) AS prevYtdBranchRev,
                        SUM(SUM(trx)) OVER (PARTITION BY region) AS prevYtdRegionalRev
                    FROM sq5
                    WHERE trx_date BETWEEN '${prevJanuaryFirst}' AND '${prevYearCurrDate}'
                    GROUP BY 1, 2, 3, 4, 5
                        `

            const [targetRevenue, currMonthRevenue, prevMonthRevenue, prevYearCurrMonthRevenue, currYtdRev, prevYtdRev] = await Promise.all([
                p1.execute(),
                p2.execute(),
                p3.execute(),
                p4.execute(),
                db6.execute(sql.raw(sq)),
                db6.execute(sql.raw(sq5))
            ])

            const regionalsMap = new Map();
            const [currYtdRevenue] = currYtdRev as MySqlRawQueryResult as unknown as [CurrYtDRevenue[], any]
            const [prevYtdRevenue] = prevYtdRev as MySqlRawQueryResult as unknown as [PrevYtDRevenue[], any]

            targetRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthTarget += Number(row.currMonthTargetRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthTarget += Number(row.currMonthTargetRev)

                // Initialize kabupaten if it doesn't exist
                cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: Number(row.currMonthTargetRev),
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
            })

            currMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currMonthRevenue = Number(row.currMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currMonthRevenue = Number(row.currMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currMonthRevenue = Number(row.currMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currMonthRevenue = Number(row.currMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));

                kabupaten.currMonthRevenue = Number(row.currMonthKabupatenRev)
            })

            prevMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevMonthRevenue = Number(row.prevMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevMonthRevenue = Number(row.prevMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevMonthRevenue = Number(row.prevMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevMonthRevenue = Number(row.prevMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevMonthRevenue = Number(row.prevMonthKabupatenRev)
            })

            prevYearCurrMonthRevenue.forEach((row) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYearCurrMonthRevenue = Number(row.prevYearCurrMonthKabupatenRev)
            })

            currYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.currYtdRevenue = Number(row.currYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.currYtdRevenue = Number(row.currYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.currYtdRevenue = Number(row.currYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.currYtdRevenue = Number(row.currYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.currYtdRevenue = Number(row.currYtdKabupatenRev)
            })

            prevYtdRevenue.forEach((row: any) => {
                const regionalName = row.region;
                const branchName = row.branch;
                const subbranchName = row.subbranch;
                const clusterName = row.cluster;
                const kabupatenName = row.kabupaten;

                const regional = regionalsMap.get(regionalName) || regionalsMap.set(regionalName, {
                    name: regionalName,
                    currMonthRevenue: 0,
                    currMonthTarget: 0,
                    currYtdRevenue: 0,
                    prevYtdRevenue: 0,
                    prevMonthRevenue: 0,
                    prevYearCurrMonthRevenue: 0,
                    branches: new Map()
                }).get(regionalName);
                regional.prevYtdRevenue = Number(row.prevYtdRegionalRev)

                const branch = regional.branches.get(branchName) ||
                    (regional.branches.set(branchName, {
                        name: branchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        subbranches: new Map()
                    }), regional.branches.get(branchName));  // Get the newly set value
                branch.prevYtdRevenue = Number(row.prevYtdBranchRev)

                // Initialize subbranch if it doesn't exist
                const subbranch = branch.subbranches.get(subbranchName) ||
                    (branch.subbranches.set(subbranchName, {
                        name: subbranchName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        clusters: new Map()
                    }), branch.subbranches.get(subbranchName));
                subbranch.prevYtdRevenue = Number(row.prevYtdSubbranchRev)

                // Initialize cluster if it doesn't exist
                const cluster = subbranch.clusters.get(clusterName) ||
                    (subbranch.clusters.set(clusterName, {
                        name: clusterName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0,
                        kabupatens: new Map()
                    }), subbranch.clusters.get(clusterName));
                cluster.prevYtdRevenue = Number(row.prevYtdClusterRev)

                // Initialize kabupaten if it doesn't exist
                const kabupaten = cluster.kabupatens.get(kabupatenName) ||
                    (cluster.kabupatens.set(kabupatenName, {
                        name: kabupatenName,
                        currMonthRevenue: 0,
                        currMonthTarget: 0,
                        currYtdRevenue: 0,
                        prevYtdRevenue: 0,
                        prevMonthRevenue: 0,
                        prevYearCurrMonthRevenue: 0
                    }), cluster.kabupatens.get(kabupatenName));
                kabupaten.prevYtdRevenue = Number(row.prevYtdKabupatenRev)
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

            return c.json({ data: finalDataRevenue }, 200)
        })

export default app