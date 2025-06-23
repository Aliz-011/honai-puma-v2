import { endOfMonth, format, getDaysInMonth, subDays, subMonths, subYears, startOfMonth } from "date-fns";
import { and, asc, count, eq, inArray, or, sql, sum, isNotNull, between, desc } from "drizzle-orm";
import { Hono } from "hono";
import { unionAll } from "drizzle-orm/mysql-core";
import { z } from "zod"

import { zValidator } from "@/lib/validator-wrapper";
import { targetHouseholdAll, summaryIoRePsRegional, summaryIoRePsBranch, summaryIoRePsWok, summaryIoRePsSto, feiTargetPuma, targetTerritoryDemands } from "@/db/schema/v_honai_puma";
import { dynamicIhAvailOdpA4, ih_demand_mysiis, ih_occ_golive_ihld, dynamicIhOrderingDetailOrderTable, ih_information_odp } from '@/db/schema/household'
import { territoryHousehold } from '@/db/schema/puma_2025'
import { db } from "@/db";

const app = new Hono()
    .get('/io-re-ps', zValidator('query', z.object({ date: z.string().optional(), branch: z.string().optional(), wok: z.string().optional() })),
        async c => {
            const { date, branch, wok } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            const ihOrderingDetailOrder = dynamicIhOrderingDetailOrderTable(currYear, currMonth)

            const currStartOfMonth = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const currDate = format(selectedDate, 'yyyy-MM-dd')
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');
            const yyyyMM = format(selectedDate, 'yyyyMM')
            const daysInMonth = getDaysInMonth(selectedDate)
            const today = Number(format(selectedDate, 'd'))
            const remainingDays = daysInMonth - today

            const branchTerritory = db
                .select({
                    branch: territoryHousehold.branch,
                })
                .from(territoryHousehold)
                .where(branch ?
                    and(
                        eq(territoryHousehold.regional, 'MALUKU DAN PAPUA'),
                        eq(territoryHousehold.branch, branch)
                    ) :
                    eq(territoryHousehold.regional, 'MALUKU DAN PAPUA')
                )
                .groupBy(territoryHousehold.branch)
                .as('a')

            const summaryBranch = db
                .select()
                .from(summaryIoRePsBranch)
                .where(and(
                    eq(summaryIoRePsBranch.event_date, currDate),
                    eq(summaryIoRePsBranch.channel, 'all'),
                    eq(summaryIoRePsBranch.package, 'all'),
                    branch ? eq(summaryIoRePsBranch.branch, branch) : undefined
                ))
                .groupBy(summaryIoRePsBranch.branch)
                .as('b')

            const branchTargetRevenue = db
                .select({
                    branch: territoryHousehold.branch,
                    target_all_sales: sum(targetHouseholdAll.all_sales).as('target_all_sales'),
                    target_grapari: sum(targetHouseholdAll.grapari).as('target_grapari'),
                    target_agency: sum(targetHouseholdAll.agency).as('target_agency'),
                    target_community: sum(targetHouseholdAll.community).as('target_community'),
                    target_digital: sum(targetHouseholdAll.digital).as('target_digital'),
                    target_greenfield: sum(targetHouseholdAll.greenfield).as('target_greenfield'),
                    target_brownfield: sum(targetHouseholdAll.brownfield).as('target_brownfield')
                })
                .from(targetHouseholdAll)
                .rightJoin(territoryHousehold, eq(targetHouseholdAll.territory, territoryHousehold.sto))
                .where(and(
                    eq(targetHouseholdAll.periode, yyyyMM),
                    branch ? eq(territoryHousehold.branch, branch) : undefined
                ))
                .groupBy(territoryHousehold.branch)
                .as('c')

            const branchPSByChannel = db
                .select({
                    branch: ihOrderingDetailOrder.branch,
                    lp_others: sql<number>`ROUND(SUM(CASE WHEN order_channel IN ('i1', 'a0', 's3', 'b3', 'u2', 'ab') THEN 1 ELSE 0 END) * 100.0 / COUNT(order_id), 2)`.as('lp_others'),
                    indihome: sql<number>`ROUND(SUM(CASE WHEN order_channel IN ('b0') THEN 1 ELSE 0 END) * 100.0 / COUNT(order_id), 2)`.as('indihome'),
                    grapari: sql<number>`ROUND(SUM(CASE WHEN order_channel IN ('k4', 'k3') THEN 1 ELSE 0 END) * 100.0 / COUNT(order_id), 2)`.as('grapari'),
                    sales_force: sql<number>`ROUND(SUM(CASE WHEN order_channel IN ('i4') THEN 1 ELSE 0 END) * 100.0 / COUNT(order_id), 2)`.as('sales_force')
                })
                .from(ihOrderingDetailOrder)
                .where(and(
                    eq(ihOrderingDetailOrder.region, 'MALUKU DAN PAPUA'),
                    eq(ihOrderingDetailOrder.order_type, 'NEW SALES'),
                    inArray(ihOrderingDetailOrder.funneling_group, ['COMPLETED', 'PS']),
                    sql`DATE_FORMAT(${ihOrderingDetailOrder.ps_ts}, '%Y-%m-%d') BETWEEN ${currStartOfMonth} AND ${currDate}`
                ))
                .groupBy(sql`1`)
                .as('d')

            const branchBrownGreen = db
                .select({
                    branch: ihOrderingDetailOrder.branch,
                    greenfield: sql<number>`COUNT(CASE WHEN (${ih_occ_golive_ihld.odp_name} IS NOT NULL AND ${ih_occ_golive_ihld.tahun_program} = 2025 AND YEAR(${ih_occ_golive_ihld.tanggal_go_live_uim}) = 2025) THEN ${ihOrderingDetailOrder.order_id} END)`.as('greenfield'),
                    brownfield: sql<number>`COUNT(CASE WHEN (${ih_occ_golive_ihld.odp_name} IS NOT NULL AND ${ih_occ_golive_ihld.tahun_program} = 2024 AND YEAR(${ih_occ_golive_ihld.tanggal_go_live_uim}) = 2024) THEN ${ihOrderingDetailOrder.order_id} END)`.as('brownfield'),
                })
                .from(ihOrderingDetailOrder)
                .leftJoin(ih_information_odp, eq(ihOrderingDetailOrder.service_id, ih_information_odp.service_number))
                .leftJoin(ih_occ_golive_ihld, eq(ih_information_odp.odp_name, ih_occ_golive_ihld.odp_name))
                .where(and(
                    or(eq(ihOrderingDetailOrder.region, 'MALUKU DAN PAPUA'), eq(ih_occ_golive_ihld.telkomsel_regional, 'PUMA')),
                    isNotNull(ihOrderingDetailOrder.ps_ts),
                    sql`DATE_FORMAT(${ihOrderingDetailOrder.ps_ts}, '%Y-%m-%d') BETWEEN ${currStartOfMonth} AND ${currDate}`
                    // sql`DATE_FORMAT(${ihOrderingDetailOrder.ps_ts}, '%Y-%m-%d') = ${currDate}`
                ))
                .groupBy(sql`1`)
                .as('e')

            const revenueBranch = db
                .select({
                    name: branchTerritory.branch,
                    target_all_sales: sql<number>`ROUND(SUM(${branchTargetRevenue.target_all_sales}),2)`.as('target_all_sales'),
                    level: sql<string>`'branch'`.as('level'),

                    ach_target_fm_io_all_sales: sql<number>`ROUND((SUM(${summaryBranch.io_m})/SUM(${branchTargetRevenue.target_all_sales}))*100, 2)`.as('ach_target_fm_io_all_sales'),
                    drr_io: sql<number>`ROUND((SUM(${summaryBranch.io_m})/(${today}/${daysInMonth}*SUM(${branchTargetRevenue.target_all_sales})))*100, 2)`.as('drr_io'),
                    io_m: sql<number>`ROUND(SUM(${summaryBranch.io_m}),2)`.as('io_m'),
                    io_mom: sql<string>`CONCAT(${summaryBranch.io_mom}, '%')`.as('io_mom'),
                    io_gap_daily: sql<number>`ROUND(SUM(${summaryBranch.io_gap_daily}),2)`.as('io_gap_daily'),

                    ach_target_fm_re_all_sales: sql<number>`ROUND((SUM(${summaryBranch.re_m})/SUM(${branchTargetRevenue.target_all_sales}))*100, 2)`.as('ach_target_fm_re_all_sales'),
                    drr_re: sql<number>`ROUND((SUM(${summaryBranch.re_m})/(${today}/${daysInMonth}*SUM(${branchTargetRevenue.target_all_sales})))*100, 2)`.as('drr_re'),
                    re_m: sql<number>`ROUND(SUM(${summaryBranch.re_m}),2)`.as('re_m'),
                    re_mom: sql<string>`CONCAT(${summaryBranch.re_mom}, '%')`.as('re_mom'),
                    re_gap_daily: sql<number>`ROUND(SUM(${summaryBranch.re_gap_daily}),2)`.as('re_gap_daily'),

                    ach_target_fm_ps_all_sales: sql<number>`ROUND((SUM(${summaryBranch.ps_m})/SUM(${branchTargetRevenue.target_all_sales}))*100, 2)`.as('ach_target_fm_ps_all_sales'),
                    drr_ps: sql<number>`ROUND((SUM(${summaryBranch.ps_m})/(${today}/${daysInMonth}*SUM(${branchTargetRevenue.target_all_sales})))*100, 2)`.as('drr_ps'),
                    target_daily_ps: sql<number>`ROUND(SUM(${branchTargetRevenue.target_all_sales}/${daysInMonth}), 2)`.as('target_daily_ps'),
                    ach_daily_ps: sql<number>`ROUND(SUM(${summaryBranch.ps_m}/${today}), 2)`.as('ach_daily_ps'),
                    ps_gap_daily: sql<number>`ROUND(SUM(${summaryBranch.ps_gap_daily}), 2)`.as('ps_gap_daily'),
                    daily_ps_remaining: sql<number>`ROUND(SUM(${branchTargetRevenue.target_all_sales} - ${summaryBranch.ps_m})/${remainingDays},2)`.as('daily_ps_remaining'),
                    ps_m: sql<number>`ROUND(SUM(${summaryBranch.ps_m}),2)`.as('ps_m'),
                    ps_mom: sql<string>`CONCAT(${summaryBranch.ps_mom}, '%')`.as('ps_mom'),
                    ps_to_io: sql<number>`CONCAT(${summaryBranch.ps_to_io}, '%')`.as('ps_to_io'),
                    ps_to_re: sql<number>`CONCAT(${summaryBranch.ps_to_re}, '%')`.as('ps_to_re'),

                    ach_fm_indihome: sql<string>`CONCAT(d.indihome,'%')`.as('ach_fm_indihome'),
                    ps_indihome: sql<number>`ROUND(d.indihome, 2)`.as('ps_indihome'),
                    ach_fm_grapari: sql<string>`CONCAT(d.grapari,'%')`.as('ach_fm_grapari'),
                    ps_grapari: sql<number>`ROUND(d.grapari, 2)`.as('ps_grapari'),
                    ach_fm_community: sql<string>`CONCAT(d.lp_others,'%')`.as('ach_fm_community'),
                    ps_community: sql<number>`ROUND(d.lp_others, 2)`.as('ps_community'),
                    ach_fm_agency: sql<string>`CONCAT(d.sales_force,'%')`.as('ach_fm_agency'),
                    ps_sales_force: sql<number>`ROUND(d.sales_force, 2)`.as('ps_agency'),

                    brownfield: sql<number>`ROUND(SUM(e.brownfield), 2)`.as('brownfield'),
                    target_brownfield: sql<number>`ROUND(SUM(c.target_brownfield),2)`.as('target_brownfield'),
                    ach_fm_brownfield: sql<string>`CONCAT(ROUND((SUM(e.brownfield)/SUM(c.target_brownfield))*100, 2), '%')`.as('ach_fm_brownfield'),
                    drr_brownfield: sql<string>`CONCAT(ROUND((SUM(e.brownfield)/(${today}/${daysInMonth}*SUM(c.target_brownfield)))*100, 2), '%')`.as('drr_brownfield'),
                    greenfield: sql<number>`ROUND(SUM(e.greenfield), 2)`.as('greenfield'),
                    target_greenfield: sql<number>`ROUND(SUM(c.target_greenfield),2)`.as('target_greenfield'),
                    ach_fm_greenfield: sql<string>`CONCAT(ROUND((SUM(e.greenfield)/SUM(c.target_greenfield))*100, 2), '%')`.as('ach_fm_greenfield'),
                    drr_greenfield: sql<string>`CONCAT(ROUND((SUM(e.greenfield)/(${today}/${daysInMonth}*SUM(c.target_greenfield)))*100, 2), '%')`.as('drr_greenfield'),
                })
                .from(branchTerritory)
                .leftJoin(summaryBranch, eq(branchTerritory.branch, summaryBranch.branch))
                .leftJoin(branchTargetRevenue, eq(summaryBranch.branch, branchTargetRevenue.branch))
                .leftJoin(branchPSByChannel, eq(branchTerritory.branch, branchPSByChannel.branch))
                .leftJoin(branchBrownGreen, eq(branchTerritory.branch, branchBrownGreen.branch))
                .groupBy(branchTerritory.branch)


            const wokTerritory = db
                .select({
                    wok: territoryHousehold.wok,
                })
                .from(territoryHousehold)
                .where(
                    branch && wok ?
                        and(
                            eq(territoryHousehold.regional, 'MALUKU DAN PAPUA'),
                            eq(territoryHousehold.branch, branch),
                            eq(territoryHousehold.wok, wok)
                        ) :
                        branch ?
                            and(
                                eq(territoryHousehold.regional, 'MALUKU DAN PAPUA'),
                                eq(territoryHousehold.branch, branch)
                            ) :
                            eq(territoryHousehold.regional, 'MALUKU DAN PAPUA')
                )
                .groupBy(territoryHousehold.wok)
                .as('a')

            const summaryWok = db
                .select()
                .from(summaryIoRePsWok)
                .where(and(
                    eq(summaryIoRePsWok.event_date, currDate),
                    eq(summaryIoRePsWok.channel, 'all'),
                    eq(summaryIoRePsWok.package, 'all'),
                    branch && wok ?
                        and(
                            eq(summaryIoRePsWok.branch, branch),
                            eq(summaryIoRePsWok.wok, wok)
                        ) :
                        branch ?
                            eq(summaryIoRePsWok.branch, branch) :
                            undefined
                ))
                .groupBy(summaryIoRePsWok.wok)
                .as('b')

            const wokTargetRevenue = db
                .select({
                    wok: territoryHousehold.wok,
                    target_all_sales: sum(targetHouseholdAll.all_sales).as('target_all_sales'),
                    target_grapari: sum(targetHouseholdAll.grapari).as('target_grapari'),
                    target_agency: sum(targetHouseholdAll.agency).as('target_agency'),
                    target_community: sum(targetHouseholdAll.community).as('target_community'),
                    target_digital: sum(targetHouseholdAll.digital).as('target_digital'),
                    target_greenfield: sum(targetHouseholdAll.greenfield).as('target_greenfield'),
                    target_brownfield: sum(targetHouseholdAll.brownfield).as('target_brownfield')
                })
                .from(targetHouseholdAll)
                .rightJoin(territoryHousehold, eq(targetHouseholdAll.territory, territoryHousehold.sto))
                .where(branch && wok ?
                    and(
                        eq(targetHouseholdAll.periode, yyyyMM),
                        eq(territoryHousehold.branch, branch),
                        eq(territoryHousehold.wok, wok)
                    ) :
                    branch ?
                        and(
                            eq(targetHouseholdAll.periode, yyyyMM),
                            eq(territoryHousehold.branch, branch)
                        ) :
                        eq(targetHouseholdAll.periode, yyyyMM))
                .groupBy(territoryHousehold.wok)
                .as('c')

            const wokPSByChannel = db
                .select({
                    wok: ihOrderingDetailOrder.wok,
                    lp_others: sql<number>`ROUND(SUM(CASE WHEN order_channel IN ('i1', 'a0', 's3', 'b3', 'u2', 'ab') THEN 1 ELSE 0 END) * 100.0 / COUNT(order_id), 2)`.as('lp_others'),
                    indihome: sql<number>`ROUND(SUM(CASE WHEN order_channel IN ('b0') THEN 1 ELSE 0 END) * 100.0 / COUNT(order_id), 2)`.as('indihome'),
                    grapari: sql<number>`ROUND(SUM(CASE WHEN order_channel IN ('k4', 'k3') THEN 1 ELSE 0 END) * 100.0 / COUNT(order_id), 2)`.as('grapari'),
                    sales_force: sql<number>`ROUND(SUM(CASE WHEN order_channel IN ('i4') THEN 1 ELSE 0 END) * 100.0 / COUNT(order_id), 2)`.as('sales_force')
                })
                .from(ihOrderingDetailOrder)
                .where(and(
                    eq(ihOrderingDetailOrder.region, 'MALUKU DAN PAPUA'),
                    eq(ihOrderingDetailOrder.order_type, 'NEW SALES'),
                    inArray(ihOrderingDetailOrder.funneling_group, ['COMPLETED', 'PS']),
                    sql`DATE_FORMAT(${ihOrderingDetailOrder.ps_ts}, '%Y-%m-%d') BETWEEN ${currStartOfMonth} AND ${currDate}`
                ))
                .groupBy(sql`1`)
                .as('d')

            const wokBrownGreen = db
                .select({
                    wok: ihOrderingDetailOrder.wok,
                    greenfield: sql<number>`COUNT(CASE WHEN (${ih_occ_golive_ihld.odp_name} IS NOT NULL AND ${ih_occ_golive_ihld.tahun_program} = 2025 AND YEAR(${ih_occ_golive_ihld.tanggal_go_live_uim}) = 2025) THEN ${ihOrderingDetailOrder.order_id} END)`.as('greenfield'),
                    brownfield: sql<number>`COUNT(CASE WHEN (${ih_occ_golive_ihld.odp_name} IS NOT NULL AND ${ih_occ_golive_ihld.tahun_program} = 2024 AND YEAR(${ih_occ_golive_ihld.tanggal_go_live_uim}) = 2024) THEN ${ihOrderingDetailOrder.order_id} END)`.as('brownfield'),
                })
                .from(ihOrderingDetailOrder)
                .leftJoin(ih_information_odp, eq(ihOrderingDetailOrder.service_id, ih_information_odp.service_number))
                .leftJoin(ih_occ_golive_ihld, eq(ih_information_odp.odp_name, ih_occ_golive_ihld.odp_name))
                .where(and(
                    or(eq(ihOrderingDetailOrder.region, 'MALUKU DAN PAPUA'), eq(ih_occ_golive_ihld.telkomsel_regional, 'PUMA')),
                    isNotNull(ihOrderingDetailOrder.ps_ts),
                    sql`DATE_FORMAT(${ihOrderingDetailOrder.ps_ts}, '%Y-%m-%d') BETWEEN ${currStartOfMonth} AND ${currDate}`
                    // sql`DATE_FORMAT(${ihOrderingDetailOrder.ps_ts}, '%Y-%m-%d') = ${currDate}`
                ))
                .groupBy(sql`1`)
                .as('e')

            const revenueWok = db
                .select({
                    name: wokTerritory.wok,
                    target_all_sales: sql<number>`ROUND(SUM(${wokTargetRevenue.target_all_sales}),2)`.as('target_all_sales'),
                    level: sql<string>`'wok'`.as('level'),

                    ach_target_fm_io_all_sales: sql<number>`ROUND((SUM(${summaryWok.io_m})/SUM(${wokTargetRevenue.target_all_sales}))*100, 2)`.as('ach_target_fm_io_all_sales'),
                    drr_io: sql<number>`ROUND((SUM(${summaryWok.io_m})/(${today}/${daysInMonth}*SUM(${wokTargetRevenue.target_all_sales})))*100, 2)`.as('drr_io'),
                    io_m: sql<number>`ROUND(SUM(${summaryWok.io_m}),2)`.as('io_m'),
                    io_mom: sql<string>`CONCAT(${summaryWok.io_mom}, '%')`.as('io_mom'),
                    io_gap_daily: sql<number>`ROUND(SUM(${summaryWok.io_gap_daily}),2)`.as('io_gap_daily'),

                    ach_target_fm_re_all_sales: sql<number>`ROUND((SUM(${summaryWok.re_m})/SUM(${wokTargetRevenue.target_all_sales}))*100, 2)`.as('ach_target_fm_re_all_sales'),
                    drr_re: sql<number>`ROUND((SUM(${summaryWok.re_m})/(${today}/${daysInMonth}*SUM(${wokTargetRevenue.target_all_sales})))*100, 2)`.as('drr_re'),
                    re_m: sql<number>`ROUND(SUM(${summaryWok.re_m}),2)`.as('re_m'),
                    re_mom: sql<string>`CONCAT(${summaryWok.re_mom}, '%')`.as('re_mom'),
                    re_gap_daily: sql<number>`ROUND(SUM(${summaryWok.re_gap_daily}),2)`.as('re_gap_daily'),

                    ach_target_fm_ps_all_sales: sql<number>`ROUND((SUM(${summaryWok.ps_m})/SUM(${wokTargetRevenue.target_all_sales}))*100, 2)`.as('ach_target_fm_ps_all_sales'),
                    drr_ps: sql<number>`ROUND((SUM(${summaryWok.ps_m})/(${today}/${daysInMonth}*SUM(${wokTargetRevenue.target_all_sales})))*100, 2)`.as('drr_ps'),
                    target_daily_ps: sql<number>`ROUND(SUM(${wokTargetRevenue.target_all_sales}/${daysInMonth}), 2)`.as('target_daily_ps'),
                    ach_daily_ps: sql<number>`ROUND(SUM(${summaryWok.ps_m}/${today}), 2)`.as('ach_daily_ps'),
                    ps_gap_daily: sql<number>`ROUND(SUM(${summaryWok.ps_gap_daily}), 2)`.as('ps_gap_daily'),
                    daily_ps_remaining: sql<number>`ROUND(SUM(${wokTargetRevenue.target_all_sales} - ${summaryWok.ps_m})/${remainingDays},2)`.as('daily_ps_remaining'),
                    ps_m: sql<number>`ROUND(SUM(${summaryWok.ps_m}),2)`.as('ps_m'),
                    ps_mom: sql<string>`CONCAT(${summaryWok.ps_mom}, '%')`.as('ps_mom'),
                    ps_to_io: sql<number>`CONCAT(${summaryWok.ps_to_io}, '%')`.as('ps_to_io'),
                    ps_to_re: sql<number>`CONCAT(${summaryWok.ps_to_re}, '%')`.as('ps_to_re'),

                    ach_fm_indihome: sql<string>`CONCAT(d.indihome,'%')`.as('ach_fm_indihome'),
                    ps_indihome: sql<number>`ROUND(d.indihome, 2)`.as('ps_indihome'),
                    ach_fm_grapari: sql<string>`CONCAT(d.grapari,'%')`.as('ach_fm_grapari'),
                    ps_grapari: sql<number>`ROUND(d.grapari, 2)`.as('ps_grapari'),
                    ach_fm_community: sql<string>`CONCAT(d.lp_others,'%')`.as('ach_fm_community'),
                    ps_community: sql<number>`ROUND(d.lp_others, 2)`.as('ps_community'),
                    ach_fm_agency: sql<string>`CONCAT(d.sales_force,'%')`.as('ach_fm_agency'),
                    ps_sales_force: sql<number>`ROUND(d.sales_force, 2)`.as('ps_agency'),

                    brownfield: sql<number>`ROUND(SUM(e.brownfield), 2)`.as('brownfield'),
                    target_brownfield: sql<number>`ROUND(SUM(c.target_brownfield),2)`.as('target_brownfield'),
                    ach_fm_brownfield: sql<string>`CONCAT(ROUND((SUM(e.brownfield)/SUM(c.target_brownfield))*100, 2), '%')`.as('ach_fm_brownfield'),
                    drr_brownfield: sql<string>`CONCAT(ROUND((SUM(e.brownfield)/(${today}/${daysInMonth}*SUM(c.target_brownfield)))*100, 2), '%')`.as('drr_brownfield'),
                    greenfield: sql<number>`ROUND(SUM(e.greenfield), 2)`.as('greenfield'),
                    target_greenfield: sql<number>`ROUND(SUM(c.target_greenfield),2)`.as('target_greenfield'),
                    ach_fm_greenfield: sql<string>`CONCAT(ROUND((SUM(e.greenfield)/SUM(c.target_greenfield))*100, 2), '%')`.as('ach_fm_greenfield'),
                    drr_greenfield: sql<string>`CONCAT(ROUND((SUM(e.greenfield)/(${today}/${daysInMonth}*SUM(c.target_greenfield)))*100, 2), '%')`.as('drr_greenfield'),
                })
                .from(wokTerritory)
                .leftJoin(summaryWok, eq(wokTerritory.wok, summaryWok.wok))
                .leftJoin(wokTargetRevenue, eq(summaryWok.wok, wokTargetRevenue.wok))
                .leftJoin(wokPSByChannel, eq(wokTerritory.wok, wokPSByChannel.wok))
                .leftJoin(wokBrownGreen, eq(wokTerritory.wok, wokBrownGreen.wok))
                .groupBy(wokTerritory.wok)


            if (branch && wok) {
                const [finalDataRevenue] = await Promise.all([
                    revenueWok
                ])

                return c.json({ data: finalDataRevenue })
            }

            const [finalDataRevenue] = await Promise.all([
                revenueBranch
            ])

            return c.json({ data: finalDataRevenue })
        })
    .get('/demands-deployment', zValidator('query', z.object({ date: z.string().optional(), branch: z.string().optional(), wok: z.string().optional() })),
        async c => {
            const { date, branch, wok } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const latestMonth = parseInt(format(selectedDate, 'M'), 10)
            const isPrevMonthLastYear = currMonth === '01'
            const prevMonth = isPrevMonthLastYear ? '12' : format(subMonths(selectedDate, 1), 'MM')
            const prevMonthYear = isPrevMonthLastYear ? format(subYears(selectedDate, 1), 'yyyy') : format(selectedDate, 'yyyy')
            const prevYear = format(subYears(selectedDate, 1), 'yyyy')

            const currOdpTable = dynamicIhAvailOdpA4(currYear, currMonth)
            const prevOdpTable = dynamicIhAvailOdpA4(prevMonthYear, prevMonth)

            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = endOfMonth(subMonths(selectedDate, 1))
            const endOfPrevMonth2 = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1)
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            const currDate = format(endOfCurrMonth, 'yyyy-MM-dd')
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevDate2 = format(endOfPrevMonth2, 'yyyy-MM-dd')
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');
            const yyyyMM = format(selectedDate, 'yyyyMM')
            const daysInMonth = getDaysInMonth(selectedDate)
            const today = Number(format(selectedDate, 'd'))

            const currJanuaryFirst = `${currYear}-01-01`
            const prevJanuaryFirst = `${prevYear}-01-01`

            console.log({ currJanuaryFirst, prevJanuaryFirst, currDate, prevDate, prevDate2, prevYearCurrDate })

            const branchTerritory = db
                .select({ branch: territoryHousehold.branch })
                .from(territoryHousehold)
                .where(branch ? and(
                    eq(territoryHousehold.regional, 'MALUKU DAN PAPUA'),
                    eq(territoryHousehold.branch, branch)
                ) : eq(territoryHousehold.regional, 'MALUKU DAN PAPUA'))
                .groupBy(territoryHousehold.branch)
                .as('a');

            const branchCurrOdp = db
                .select({
                    branch: sql<string>`
                    CASE
                        WHEN ${currOdpTable.sto} IN ('WHA','TUA','SPR','SML','NML','NIR','MSH','LRA','DOB','BUL', 'PAO', 'ABO') THEN 'AMBON'
                        WHEN ${currOdpTable.sto} IN ('WAM','SRU','SRM','SNI','BIA', 'WAE','JPB','JAP','ABE') THEN 'JAYAPURA'
                        WHEN ${currOdpTable.sto} IN ('TIM','TBG','KUK','NAB', 'TMR','MRK','BAD','AGT') THEN 'TIMIKA'
                        WHEN ${currOdpTable.sto} IN ('WMR','RSK','MWR','KIN','FFA','BTI', 'TMB', 'SON') THEN 'SORONG'
                    END`.as('branch'),
                    status: sql<string>`
                    CASE
                        WHEN ${currOdpTable.status} IN ('BLACK', 'BLACKSYSTEM') THEN 'BLACK' ELSE ${currOdpTable.status}
                    END`.as('status'),
                    event_date: currOdpTable.event_date,
                    amount_port: currOdpTable.is_total,
                    avai_port: currOdpTable.avai,
                    used: currOdpTable.used,
                    total_odp_per_status: count(currOdpTable.status).as('total_odp_per_status'),
                    occ_alpro: sql<number>`ROUND(SUM(${currOdpTable.used} / ${currOdpTable.is_total}), 2)`.as('occ_alpro')
                })
                .from(currOdpTable)
                .where(and(
                    inArray(currOdpTable.witel, ['MALUKU', 'PAPUA', 'PAPUA BARAT']),
                    eq(currOdpTable.event_date, currDate)
                ))
                .groupBy(sql`1,2`)
                .as('b');

            const branchPrevOdp = db
                .select({
                    branch: sql<string>`
                    CASE
                        WHEN ${prevOdpTable.sto} IN ('WHA','TUA','SPR','SML','NML','NIR','MSH','LRA','DOB','BUL', 'PAO', 'ABO') THEN 'AMBON'
                        WHEN ${prevOdpTable.sto} IN ('WAM','SRU','SRM','SNI','BIA', 'WAE','JPB','JAP','ABE') THEN 'JAYAPURA'
                        WHEN ${prevOdpTable.sto} IN ('TIM','TBG','KUK','NAB', 'TMR','MRK','BAD','AGT') THEN 'TIMIKA'
                        WHEN ${prevOdpTable.sto} IN ('WMR','RSK','MWR','KIN','FFA','BTI', 'TMB', 'SON') THEN 'SORONG'
                    END`.as('branch'),
                    status: sql<string>`
                    CASE
                        WHEN ${prevOdpTable.status} IN ('BLACK', 'BLACKSYSTEM') THEN 'BLACK' ELSE ${prevOdpTable.status}
                    END`.as('status'),
                    used: prevOdpTable.used,
                    is_total: prevOdpTable.is_total,
                    occ_alpro: sql<number>`ROUND(SUM(${prevOdpTable.used} / ${prevOdpTable.is_total}), 2)`.as('occ_alpro')
                })
                .from(prevOdpTable)
                .where(and(
                    inArray(prevOdpTable.witel, ['MALUKU', 'PAPUA', 'PAPUA BARAT']),
                    eq(prevOdpTable.event_date, prevDate)
                ))
                .groupBy(sql`1,2`)
                .as('c');

            const branchDD = db
                .select({
                    branch: sql<string>`${ih_occ_golive_ihld.telkomsel_branch}`.as('branch'),
                    new_golive_m: sql<number>`COUNT(CASE WHEN ${ih_occ_golive_ihld.tanggal_go_live_uim} = ${currDate} THEN 1 END)`.as('new_golive_m'),
                    new_golive_m1: sql<number>`COUNT(CASE WHEN ${ih_occ_golive_ihld.tanggal_go_live_uim} = ${prevDate2} THEN 1 END)`.as('new_golive_m1'),
                    new_golive_ytd: sql<number>`COUNT(CASE WHEN ${ih_occ_golive_ihld.tanggal_go_live_uim} BETWEEN ${currJanuaryFirst} AND ${currDate} THEN 1 END)`.as('new_golive_ytd'),
                    new_golive_ytd1: sql<number>`COUNT(CASE WHEN ${ih_occ_golive_ihld.tanggal_go_live_uim} BETWEEN ${prevJanuaryFirst} AND ${prevYearCurrDate} THEN 1 END)`.as('new_golive_ytd1'),
                })
                .from(ih_occ_golive_ihld)
                .where(branch ? and(
                    eq(ih_occ_golive_ihld.regional, 'PUMA'),
                    eq(ih_occ_golive_ihld.telkomsel_branch, branch)
                ) : eq(ih_occ_golive_ihld.regional, 'PUMA'))
                .groupBy(sql`1`)
                .as('dd')

            const branchGoLive = db
                .select({
                    branch: branchDD.branch,
                    new_go_live_m: branchDD.new_golive_m,
                    new_go_live_mom: sql<string>`CONCAT(ROUND((dd.new_golive_m - dd.new_golive_m1) / (dd.new_golive_m1) * 100, 2), '%')`.as('new_go_live_mom'),
                    new_go_live_ytd: sql<string>`CONCAT(ROUND((dd.new_golive_ytd - dd.new_golive_ytd1) / (dd.new_golive_ytd1) * 100, 2), '%')`.as('new_go_live_ytd'),
                })
                .from(branchDD)
                .groupBy(branchDD.branch)
                .as('d')

            const branchWithStatus = db
                .select({
                    name: branchTerritory.branch,
                    status: sql<string>`b.status`.as('status'),
                    level: sql<string>`'branch'`.as('level'),
                    amount_port: branchCurrOdp.amount_port,
                    avai_port: branchCurrOdp.avai_port,
                    new_go_live_mom: sql<string>`d.new_go_live_mom`.as('new_go_live_mom'),
                    new_go_live_ytd: sql<string>`d.new_go_live_ytd`.as('new_go_live_ytd'),
                    total_odp: sql<number>`b.total_odp_per_status`.as('total_odp'),
                    occupied_alpro_m: sql<number>`ROUND(SUM(b.used) / SUM(${branchCurrOdp.amount_port}), 2)`.as('occupied_alpro_m'),
                    occupied_alpro_m1: sql<number>`c.occ_alpro`.as('occupied_alpro_m1'),
                    alpro_gap: sql<number>`ROUND(b.occ_alpro - COALESCE(c.occ_alpro, 0), 2)`.as('alpro_gap'),
                    alpro_mom: sql<string>`
                    CONCAT(CASE
                        WHEN b.occ_alpro IS NOT NULL AND c.occ_alpro > 0 THEN
                            ROUND(((b.occ_alpro - c.occ_alpro) / c.occ_alpro) * 100, 2)
                        ELSE NULL
                    END, '%')`.as('alpro_mom')
                })
                .from(branchTerritory)
                .leftJoin(branchCurrOdp, sql`${branchTerritory.branch} = b.branch`)
                .leftJoin(branchPrevOdp, sql`${branchTerritory.branch} = c.branch AND b.status = c.status`)
                .leftJoin(branchGoLive, sql`${branchTerritory.branch} = d.branch`)
                .groupBy(sql`1,2`)
                .orderBy(asc(sql`b.status`))

            const branchAllStatus = db
                .select({
                    name: branchTerritory.branch,
                    status: sql<string>`'all'`.as('status'),
                    level: sql<string>`'branch'`.as('level'),
                    amount_port: sum(branchCurrOdp.amount_port).as('amount_port'),
                    avai_port: sum(branchCurrOdp.avai_port).as('avai_port'),
                    new_go_live_mom: sql<string>`d.new_go_live_mom`.as('new_go_live_mom'),
                    new_go_live_ytd: sql<string>`d.new_go_live_ytd`.as('new_go_live_ytd'),
                    total_odp: sql<number>`SUM(b.total_odp_per_status)`.as('total_odp'),
                    occupied_alpro_m: sql<number>`ROUND(SUM(b.used) / SUM(${branchCurrOdp.amount_port}),2)`.as('occupied_alpro_m'),
                    occupied_alpro_m1: sql<number>`ROUND(SUM(c.occ_alpro),2)`.as('occupied_alpro_m1'),
                    alpro_gap: sql<number>`ROUND(SUM(b.occ_alpro) - COALESCE(SUM(c.occ_alpro), 0), 2)`.as('alpro_gap'),
                    alpro_mom: sql<string>`
                    CONCAT(CASE
                        WHEN b.occ_alpro IS NOT NULL AND c.occ_alpro > 0 THEN
                            ROUND(((SUM(b.occ_alpro) - SUM(c.occ_alpro)) / SUM(c.occ_alpro)) * 100, 2)
                        ELSE NULL
                    END, '%')`.as('alpro_mom')
                })
                .from(branchTerritory)
                .leftJoin(branchCurrOdp, sql`${branchTerritory.branch} = b.branch`)
                .leftJoin(branchPrevOdp, sql`${branchTerritory.branch} = c.branch AND b.status = c.status`)
                .leftJoin(branchGoLive, sql`${branchTerritory.branch} = d.branch`)
                .groupBy(sql`1`)

            const finalBranchQuery = db.$with('branch_base_data').as(unionAll(branchAllStatus, branchWithStatus))

            const wokTerritory = db
                .select({ wok: territoryHousehold.wok })
                .from(territoryHousehold)
                .where(branch && wok ? and(
                    eq(territoryHousehold.regional, 'MALUKU DAN PAPUA'),
                    eq(territoryHousehold.branch, branch),
                    eq(territoryHousehold.wok, wok)
                ) : eq(territoryHousehold.regional, 'MALUKU DAN PAPUA'))
                .groupBy(territoryHousehold.wok)
                .as('a')

            const wokCurrOdp = db
                .select({
                    wok: sql<string>`
                    CASE
                        WHEN ${currOdpTable.sto} IN ('WHA','TUA','SPR','SML','NML','NIR','MSH','LRA','DOB','BUL', 'PAO', 'ABO') THEN 'AMBON'
                        WHEN ${currOdpTable.sto} IN ('WAM','SRU','SRM','SNI','BIA', 'WAE','JPB','JAP','ABE') THEN 'JAYAPURA'
                        WHEN ${currOdpTable.sto} IN ('TIM','TBG','KUK','NAB', 'TMR','MRK','BAD','AGT') THEN 'TIMIKA'
                        WHEN ${currOdpTable.sto} IN ('WMR','RSK','MWR','KIN','FFA','BTI', 'TMB', 'SON') THEN 'SORONG'
                    END`.as('wok'),
                    status: sql<string>`
                    CASE
                        WHEN ${currOdpTable.status} IN ('BLACK', 'BLACKSYSTEM') THEN 'BLACK' ELSE ${currOdpTable.status}
                    END`.as('status'),
                    event_date: currOdpTable.event_date,
                    amount_port: currOdpTable.is_total,
                    avai_port: currOdpTable.avai,
                    total_odp_per_status: count(currOdpTable.status).as('total_odp_per_status'),
                    occ_alpro: sql<number>`ROUND(SUM(${currOdpTable.used} / ${currOdpTable.is_total}), 2)`.as('occ_alpro')
                })
                .from(currOdpTable)
                .where(and(
                    inArray(currOdpTable.witel, ['MALUKU', 'PAPUA', 'PAPUA BARAT']),
                    eq(currOdpTable.event_date, currDate)
                ))
                .groupBy(sql`1,2,3`)
                .as('b')

            const wokPrevOdp = db
                .select({
                    wok: sql<string>`
                    CASE
                        WHEN ${prevOdpTable.sto} IN ('WHA','TUA','SPR','SML','NML','NIR','MSH','LRA','DOB','BUL', 'PAO', 'ABO') THEN 'AMBON'
                        WHEN ${prevOdpTable.sto} IN ('WAM','SRU','SRM','SNI','BIA', 'WAE','JPB','JAP','ABE') THEN 'JAYAPURA'
                        WHEN ${prevOdpTable.sto} IN ('TIM','TBG','KUK','NAB', 'TMR','MRK','BAD','AGT') THEN 'TIMIKA'
                        WHEN ${prevOdpTable.sto} IN ('WMR','RSK','MWR','KIN','FFA','BTI', 'TMB', 'SON') THEN 'SORONG'
                    END`.as('wok'),
                    status_odp: sql<string>`
                    CASE
                        WHEN ${prevOdpTable.status} IN ('BLACK', 'BLACKSYSTEM') THEN 'BLACK' ELSE ${prevOdpTable.status}
                    END`.as('status_odp'),
                    occ_alpro: sql<number>`ROUND(SUM(${prevOdpTable.used} / ${prevOdpTable.is_total}), 2)`.as('occ_alpro')
                })
                .from(prevOdpTable)
                .where(and(
                    inArray(prevOdpTable.witel, ['MALUKU', 'PAPUA', 'PAPUA BARAT']),
                    eq(prevOdpTable.event_date, prevDate)
                ))
                .groupBy(sql`1,2`)
                .as('c')

            const wokDD = db
                .select({
                    wok: sql<string>`${ih_occ_golive_ihld.wok}`.as('wok'),
                    new_golive_m: sql<number>`COUNT(CASE WHEN ${ih_occ_golive_ihld.tanggal_go_live_uim} = ${currDate} THEN 1 END)`.as('new_golive_m'),
                    new_golive_m1: sql<number>`COUNT(CASE WHEN ${ih_occ_golive_ihld.tanggal_go_live_uim} = ${prevDate2} THEN 1 END)`.as('new_golive_m1'),
                    new_golive_ytd: sql<number>`COUNT(CASE WHEN ${ih_occ_golive_ihld.tanggal_go_live_uim} BETWEEN ${currJanuaryFirst} AND ${currDate} THEN 1 END)`.as('new_golive_ytd'),
                    new_golive_ytd1: sql<number>`COUNT(CASE WHEN ${ih_occ_golive_ihld.tanggal_go_live_uim} BETWEEN ${prevJanuaryFirst} AND ${prevYearCurrDate} THEN 1 END)`.as('new_golive_ytd1'),
                })
                .from(ih_occ_golive_ihld)
                .where(eq(ih_occ_golive_ihld.regional, 'PUMA'))
                .groupBy(sql`1`)
                .as('dd')

            const wokGoLive = db
                .select({
                    wok: wokDD.wok,
                    new_go_live_m: wokDD.new_golive_m,
                    new_go_live_mom: sql<string>`CONCAT(ROUND((${wokDD.new_golive_m} - ${wokDD.new_golive_m1}) / (${wokDD.new_golive_m1}), 2), '%')`.as('new_go_live_mom'),
                    new_go_live_ytd: sql<string>`CONCAT(ROUND((${wokDD.new_golive_ytd} - ${wokDD.new_golive_ytd1}) / (${wokDD.new_golive_ytd1}), 2), '%')`.as('new_go_live_ytd'),
                })
                .from(wokDD)
                .groupBy(wokDD.wok)
                .as('d')

            const wokWithStatus = db
                .select({
                    name: wokTerritory.wok,
                    status: sql<string>`b.status`.as('status'),
                    level: sql<string>`'wok'`.as('level'),
                    amount_port: wokCurrOdp.amount_port,
                    avai_port: wokCurrOdp.avai_port,
                    new_go_live_mom: sql`d.new_go_live_mom`.as('new_go_live_mom'),
                    new_go_live_ytd: sql`d.new_go_live_ytd`.as('new_go_live_ytd'),
                    total_odp: sql<number>`b.total_odp_per_status`.as('total_odp'),
                    occupied_alpro_m: sql<number>`b.occ_alpro`.as('occupied_alpro_m'),
                    occupied_alpro_m1: sql<number>`c.occ_alpro`.as('occupied_alpro_m1'),
                    alpro_gap: sql<number>`ROUND(b.occ_alpro - COALESCE(c.occ_alpro, 0), 2)`.as('alpro_gap'),
                    alpro_mom: sql<string>`
                    CONCAT(CASE 
                        WHEN c.occ_alpro IS NOT NULL AND c.occ_alpro > 0 THEN 
                            ROUND(((b.occ_alpro - c.occ_alpro) / c.occ_alpro) * 100, 2)
                        ELSE NULL
                    END, '%')`.as('alpro_mom')
                })
                .from(wokTerritory)
                .leftJoin(wokCurrOdp, sql`${wokTerritory.wok} = b.wok`)
                .leftJoin(wokPrevOdp, sql`${wokTerritory.wok} = c.wok AND b.status = c.status`)
                .leftJoin(wokGoLive, sql`${wokTerritory.wok} = d.wok`)
                .groupBy(sql`1,2`)

            const wokAllStatus = db
                .select({
                    name: wokTerritory.wok,
                    status: sql<string>`'all'`.as('status'),
                    level: sql<string>`'wok'`.as('level'),
                    amount_port: sum(wokCurrOdp.amount_port).as('amount_port'),
                    avai_port: sum(wokCurrOdp.avai_port).as('avai_port'),
                    new_go_live_mom: sql`d.new_go_live_mom`.as('new_go_live_mom'),
                    new_go_live_ytd: sql`d.new_go_live_ytd`.as('new_go_live_ytd'),
                    total_odp: sql<number>`SUM(b.total_odp_per_status)`.as('total_odp'),
                    occupied_alpro_m: sql<number>`ROUND(SUM(b.occ_alpro),2)`.as('occupied_alpro_m'),
                    occupied_alpro_m1: sql<number>`ROUND(SUM(c.occ_alpro),2)`.as('occupied_alpro_m1'),
                    alpro_gap: sql<number>`ROUND(SUM(b.occ_alpro) - COALESCE(SUM(c.occ_alpro), 0), 2)`.as('alpro_gap'),
                    alpro_mom: sql<string>`
                    CONCAT(CASE
                        WHEN b.occ_alpro IS NOT NULL AND c.occ_alpro > 0 THEN
                            ROUND(((SUM(b.occ_alpro) - SUM(c.occ_alpro)) / SUM(c.occ_alpro)) * 100, 2)
                        ELSE NULL
                    END, '%')`.as('alpro_mom')
                })
                .from(wokTerritory)
                .leftJoin(wokCurrOdp, sql`${wokTerritory.wok} = b.wok`)
                .leftJoin(wokPrevOdp, sql`${wokTerritory.wok} = c.wok AND b.status = c.status`)
                .leftJoin(wokGoLive, sql`${wokTerritory.wok} = d.wok`)
                .groupBy(sql`1`)

            const finalWokQuery = db.$with('wok_base_data').as(unionAll(wokAllStatus, wokWithStatus))

            if (branch && wok) {
                const [finalDataRevenue] = await Promise.all([
                    db.with(finalWokQuery)
                        .select({
                            name: finalWokQuery.name,
                            level: finalWokQuery.level,
                            status: finalWokQuery.status,
                            total_odp: finalWokQuery.total_odp,
                            amount_port: finalWokQuery.amount_port,
                            avai_port: finalWokQuery.avai_port,
                            new_go_live_mom: finalBranchQuery.new_go_live_mom,
                            new_go_live_ytd: finalBranchQuery.new_go_live_ytd,
                            occupied_alpro_m: finalWokQuery.occupied_alpro_m,
                            occupied_alpro_m1: finalWokQuery.occupied_alpro_m1,
                            alpro_gap: finalWokQuery.alpro_gap,
                            alpro_mom: finalWokQuery.alpro_mom,
                            odp_percentage: sql<string>`
                        CONCAT(CASE
                            WHEN status != 'all' THEN
                                ROUND((total_odp * 100) / NULLIF(MAX(CASE WHEN status = 'all' THEN total_odp END) OVER (PARTITION BY branch), 0), 2)
                            ELSE NULL
                        END, '%')
                        `.as('odp_percentage')
                        })
                        .from(finalWokQuery)
                ])

                return c.json({ data: finalDataRevenue })
            }

            const [finalDataRevenue] = await Promise.all([
                db.with(finalBranchQuery)
                    .select({
                        name: finalBranchQuery.name,
                        level: finalBranchQuery.level,
                        status: finalBranchQuery.status,
                        total_odp: finalBranchQuery.total_odp,
                        amount_port: finalBranchQuery.amount_port,
                        avai_port: finalBranchQuery.avai_port,
                        new_go_live_mom: finalBranchQuery.new_go_live_mom,
                        new_go_live_ytd: finalBranchQuery.new_go_live_ytd,
                        occupied_alpro_m: finalBranchQuery.occupied_alpro_m,
                        occupied_alpro_m1: finalBranchQuery.occupied_alpro_m1,
                        alpro_gap: finalBranchQuery.alpro_gap,
                        alpro_mom: finalBranchQuery.alpro_mom,
                        odp_percentage: sql<string>`
                        CONCAT(CASE
                            WHEN status != 'all' THEN
                                ROUND((total_odp * 100) / NULLIF(MAX(CASE WHEN status = 'all' THEN total_odp END) OVER (PARTITION BY branch), 0), 2)
                            ELSE NULL
                        END, '%')
                        `.as('odp_percentage')
                    })
                    .from(finalBranchQuery)
            ])

            return c.json({ data: finalDataRevenue })
        })
    .get('/sf-class', zValidator('query', z.object({ date: z.string().optional() })),
        async c => {
            const { date } = c.req.valid('query')
            const selectedDate = date ? new Date(date) : subDays(new Date(), 2)

            const currMonth = format(selectedDate, 'MM')
            const currYear = format(selectedDate, 'yyyy')
            const lastDayOfSelectedMonth = endOfMonth(selectedDate);
            const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

            const ihOrderingDetailOrder = dynamicIhOrderingDetailOrderTable(currYear, currMonth)

            const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
            const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
            const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

            const currStartOfMonth = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
            const currDate = format(selectedDate, 'yyyy-MM-dd')
            const prevDate = format(endOfPrevMonth, 'yyyy-MM-dd');
            const prevYearCurrDate = format(endOfPrevYearSameMonth, 'yyyy-MM-dd');
            const yyyyMM = format(selectedDate, 'yyyyMM')
            const daysInMonth = getDaysInMonth(selectedDate)
            const today = Number(format(selectedDate, 'd'))

            const sfClass = db
                .select({
                    sf_code: ihOrderingDetailOrder.sf_code,
                    ps: count(ihOrderingDetailOrder.ps_ts).as('ps')
                })
                .from(ihOrderingDetailOrder)
                .where(and(
                    eq(ihOrderingDetailOrder.region, 'MALUKU DAN PAPUA'),
                    eq(ihOrderingDetailOrder.order_type, 'NEW SALES'),
                    eq(ihOrderingDetailOrder.order_channel, 'i4'),
                    inArray(ihOrderingDetailOrder.funneling_group, ['COMPLETED', 'PS']),
                    isNotNull(ihOrderingDetailOrder.ps_ts),
                    isNotNull(ihOrderingDetailOrder.sf_code),
                    sql`DATE_FORMAT(${ihOrderingDetailOrder.ps_ts}, '%Y-%m-%d') BETWEEN ${currStartOfMonth} AND ${currDate}`
                ))
                .groupBy(ihOrderingDetailOrder.sf_code)
                .as('a')

            const sfSummary = db
                .select({
                    sf_code: sfClass.sf_code,
                    ps: sfClass.ps,
                    category: sql<string>`CASE
                        WHEN a.ps BETWEEN 0 AND 1 THEN 'BLACK'
                        WHEN a.ps BETWEEN 2 AND 5 THEN 'BRONZE'
                        WHEN a.ps BETWEEN 6 AND 10 THEN 'SILVER'
                        WHEN a.ps BETWEEN 11 AND 20 THEN 'GOLD'
                        WHEN a.ps > 20 THEN 'PLATINUM'
                    END`.as('category')
                })
                .from(sfClass)
                .groupBy(sql`1`)
                .orderBy(desc(sfClass.ps))

            const [finalDataRevenue] = await Promise.all([
                sfSummary
            ])

            return c.json({ data: finalDataRevenue })
        })


export default app

type ODP = {
    name: string | null;
    level: string;
    status: string;
    amount_port: string | null;
    avai_port: string | null;
    occupied_alpro_m: number;
    occupied_alpro_m1: number;
    alpro_gap: number;
    alpro_mom: number;
    odp_percentage: string;
}