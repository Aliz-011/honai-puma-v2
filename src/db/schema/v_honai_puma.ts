import { mysqlSchema, varchar, double, index, decimal, bigint, int } from "drizzle-orm/mysql-core";

export const honaiPuma = mysqlSchema('v_honai_puma')

export const dynamicRevenueCVM = (year: string, month: string) => {
    return honaiPuma.table(`summary_revenue_cvm_${year}${month}`, {
        region: varchar("region", { length: 20 }),
        branch: varchar("branch", { length: 25 }),
        subbranch: varchar("subbranch", { length: 30 }),
        cluster: varchar("cluster", { length: 30 }),
        kabupaten: varchar("kabupaten", { length: 30 }),

        // Current Month Revenue
        currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
        currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
        currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
        currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Month Revenue
        previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
        previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Year Same Month Revenue
        previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

        // Target Revenue
        kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
        clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
        subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
        branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
        regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

        // YTD Revenue
        ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
        ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
        ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Previous Year YTD Revenue
        prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
        prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
        prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Metadata
        transactionDate: varchar("mtd_dt", { length: 20 }),
        processingDate: varchar("processing_date", { length: 20 }),
    })
}

export const dynamicRevenueCVMOutlet = (year: string, month: string) => {
    return honaiPuma.table(`summary_revenue_cvm_outlet_${year}${month}`, {
        region: varchar("region", { length: 20 }),
        branch: varchar("branch", { length: 25 }),
        subbranch: varchar("subbranch", { length: 30 }),
        cluster: varchar("cluster", { length: 30 }),
        kabupaten: varchar("kabupaten", { length: 30 }),

        // Current Month Revenue
        currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
        currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
        currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
        currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Month Revenue
        previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
        previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Year Same Month Revenue
        previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

        // Target Revenue
        kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
        clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
        subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
        branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
        regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

        // YTD Revenue
        ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
        ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
        ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Previous Year YTD Revenue
        prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
        prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
        prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Metadata
        transactionDate: varchar("mtd_dt", { length: 20 }),
        processingDate: varchar("processing_date", { length: 20 }),
    })
}

export const dynamicPayingSubs = (year: string, month: string) => {
    return honaiPuma.table(`summary_paying_subs_${year}${month}`, {
        region: varchar("region", { length: 20 }),
        branch: varchar("branch", { length: 25 }),
        subbranch: varchar("subbranch", { length: 30 }),
        cluster: varchar("cluster", { length: 30 }),
        kabupaten: varchar("kabupaten", { length: 30 }),

        // Current Month Revenue
        currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
        currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
        currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
        currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Month Revenue
        previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
        previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Year Same Month Revenue
        previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

        // Target Revenue
        kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
        clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
        subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
        branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
        regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

        // YTD Revenue
        ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
        ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
        ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Previous Year YTD Revenue
        prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
        prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
        prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Metadata
        mtd_dt: varchar("mtd_dt", { length: 20 }),
        processingDate: varchar("processing_date", { length: 20 }),
    })
}

export const dynamicPayingLos = (year: string, month: string) => {
    return honaiPuma.table(`summary_paying_los_${year}${month}`, {
        region: varchar("region", { length: 20 }),
        branch: varchar("branch", { length: 25 }),
        subbranch: varchar("subbranch", { length: 30 }),
        cluster: varchar("cluster", { length: 30 }),
        kabupaten: varchar("kabupaten", { length: 30 }),

        // Current Month Revenue
        currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
        currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
        currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
        currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Month Revenue
        previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
        previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Year Same Month Revenue
        previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

        // Target Revenue
        kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
        clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
        subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
        branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
        regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

        // YTD Revenue
        ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
        ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
        ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Previous Year YTD Revenue
        prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
        prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
        prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Metadata
        mtd_dt: varchar("mtd_dt", { length: 20 }),
        processingDate: varchar("processing_date", { length: 20 }),
    })
}

export const dynamicRevenueGross = (year: string, month: string) => {
    return honaiPuma.table(`summary_revenue_gross_${year}${month}`, {
        region: varchar("region", { length: 20 }),
        branch: varchar("branch", { length: 25 }),
        subbranch: varchar("subbranch", { length: 30 }),
        cluster: varchar("cluster", { length: 30 }),
        kabupaten: varchar("kabupaten", { length: 30 }),

        // Current Month Revenue
        currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
        currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
        currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
        currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Month Revenue
        previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
        previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Year Same Month Revenue
        previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

        // Target Revenue
        kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
        clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
        subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
        branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
        regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

        // YTD Revenue
        ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
        ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
        ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Previous Year YTD Revenue
        prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
        prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
        prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Metadata
        transactionDate: varchar("mtd_dt", { length: 20 }),
        processingDate: varchar("processing_date", { length: 20 }),
    })
}

export const dynamicRevenueByu = (year: string, month: string) => {
    return honaiPuma.table(`summary_revenue_byu_${year}${month}`, {
        region: varchar("region", { length: 20 }),
        branch: varchar("branch", { length: 25 }),
        subbranch: varchar("subbranch", { length: 30 }),
        cluster: varchar("cluster", { length: 30 }),
        kabupaten: varchar("kabupaten", { length: 30 }),

        // Current Month Revenue
        currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
        currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
        currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
        currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Month Revenue
        previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
        previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Year Same Month Revenue
        previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

        // Target Revenue
        kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
        clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
        subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
        branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
        regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

        // YTD Revenue
        ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
        ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
        ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Previous Year YTD Revenue
        prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
        prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
        prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Metadata
        transactionDate: varchar("mtd_dt", { length: 20 }),
        processingDate: varchar("processing_date", { length: 20 }),
    })
}

export const dynamicRevenueGrossPrabayar = (year: string, month: string) => {
    return honaiPuma.table(`summary_revenue_gross_prabayar_${year}${month}`, {
        region: varchar("region", { length: 20 }),
        branch: varchar("branch", { length: 25 }),
        subbranch: varchar("subbranch", { length: 30 }),
        cluster: varchar("cluster", { length: 30 }),
        kabupaten: varchar("kabupaten", { length: 30 }),

        // Current Month Revenue
        currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
        currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
        currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
        currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Month Revenue
        previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
        previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Year Same Month Revenue
        previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

        // Target Revenue
        kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
        clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
        subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
        branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
        regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

        // YTD Revenue
        ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
        ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
        ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Previous Year YTD Revenue
        prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
        prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
        prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Metadata
        transactionDate: varchar("mtd_dt", { length: 20 }),
        processingDate: varchar("processing_date", { length: 20 }),
    })
}

export const dynamicRevenueNewSales = (year: string, month: string) => {
    return honaiPuma.table(`summary_revenue_new_sales_${year}${month}`, {
        region: varchar("region", { length: 20 }),
        branch: varchar("branch", { length: 25 }),
        subbranch: varchar("subbranch", { length: 30 }),
        cluster: varchar("cluster", { length: 30 }),
        kabupaten: varchar("kabupaten", { length: 30 }),

        // Current Month Revenue
        currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
        currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
        currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
        currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Month Revenue
        previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
        previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

        // Previous Year Same Month Revenue
        previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
        previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

        // Target Revenue
        kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
        clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
        subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
        branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
        regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

        // YTD Revenue
        ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
        ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
        ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Previous Year YTD Revenue
        prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
        prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
        prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
        prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
        prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

        // Metadata
        transactionDate: varchar("mtd_dt", { length: 20 }),
        processingDate: varchar("processing_date", { length: 20 }),
    })
}

export const dynamicRevenueNewSalesPrabayar = (year: string, month: string) => honaiPuma.table(`summary_revenue_new_sales_prabayar_${year}${month}`, {
    region: varchar("region", { length: 20 }),
    branch: varchar("branch", { length: 25 }),
    subbranch: varchar("subbranch", { length: 30 }),
    cluster: varchar("cluster", { length: 30 }),
    kabupaten: varchar("kabupaten", { length: 30 }),

    // Current Month Revenue
    currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
    currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
    currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
    currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

    // Previous Month Revenue
    previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
    previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
    previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
    previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

    // Previous Year Same Month Revenue
    previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

    // Target Revenue
    kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
    clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
    subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
    branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
    regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

    // YTD Revenue
    ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
    ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
    ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
    ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
    ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

    // Previous Year YTD Revenue
    prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
    prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
    prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
    prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
    prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

    // Metadata
    transactionDate: varchar("mtd_dt", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const dynamicTrxNewSales = (year: string, month: string) => honaiPuma.table(`summary_trx_new_sales_${year}${month}`, {
    region: varchar("region", { length: 20 }),
    branch: varchar("branch", { length: 25 }),
    subbranch: varchar("subbranch", { length: 30 }),
    cluster: varchar("cluster", { length: 30 }),
    kabupaten: varchar("kabupaten", { length: 30 }),

    // Current Month Revenue
    currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
    currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
    currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
    currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

    // Previous Month Revenue
    previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
    previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
    previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
    previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

    // Previous Year Same Month Revenue
    previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

    // Target Revenue
    kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
    clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
    subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
    branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
    regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

    // YTD Revenue
    ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
    ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
    ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
    ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
    ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

    // Previous Year YTD Revenue
    prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
    prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
    prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
    prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
    prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

    // Metadata
    transactionDate: varchar("mtd_dt", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const dynamicTrxNewSalesPrabayar = (year: string, month: string) => honaiPuma.table(`summary_trx_new_sales_prabayar_${year}${month}`, {
    region: varchar("region", { length: 20 }),
    branch: varchar("branch", { length: 25 }),
    subbranch: varchar("subbranch", { length: 30 }),
    cluster: varchar("cluster", { length: 30 }),
    kabupaten: varchar("kabupaten", { length: 30 }),

    // Current Month Revenue
    currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
    currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
    currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
    currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

    // Previous Month Revenue
    previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
    previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
    previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
    previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

    // Previous Year Same Month Revenue
    previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

    // Target Revenue
    kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
    clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
    subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
    branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
    regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

    // YTD Revenue
    ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
    ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
    ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
    ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
    ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

    // Previous Year YTD Revenue
    prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
    prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
    prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
    prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
    prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

    // Metadata
    transactionDate: varchar("mtd_dt", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const dynamicRevenueRedeemPV = (year: string, month: string) => honaiPuma.table(`summary_revenue_redeem_pv_${year}${month}`, {
    region: varchar("region", { length: 20 }),
    branch: varchar("branch", { length: 25 }),
    subbranch: varchar("subbranch", { length: 30 }),
    cluster: varchar("cluster", { length: 30 }),
    kabupaten: varchar("kabupaten", { length: 30 }),

    // Current Month Revenue
    currentMonthKabupatenRevenue: double("current_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    currentMonthClusterRevenue: double("current_month_cluster_revenue", { precision: 30, scale: 4 }),
    currentMonthSubbranchRevenue: double("current_month_subbranch_revenue", { precision: 30, scale: 4 }),
    currentMonthBranchRevenue: double("current_month_branch_revenue", { precision: 30, scale: 4 }),
    currentMonthRegionRevenue: double("current_month_region_revenue", { precision: 30, scale: 4 }),

    // Previous Month Revenue
    previousMonthKabupatenRevenue: double("previous_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    previousMonthClusterRevenue: double("previous_month_cluster_revenue", { precision: 30, scale: 4 }),
    previousMonthSubbranchRevenue: double("previous_month_subbranch_revenue", { precision: 30, scale: 4 }),
    previousMonthBranchRevenue: double("previous_month_branch_revenue", { precision: 30, scale: 4 }),
    previousMonthRegionRevenue: double("previous_month_region_revenue", { precision: 30, scale: 4 }),

    // Previous Year Same Month Revenue
    previousYearSameMonthKabupatenRevenue: double("previous_year_same_month_kabupaten_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthClusterRevenue: double("previous_year_same_month_cluster_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthSubbranchRevenue: double("previous_year_same_month_subbranch_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthBranchRevenue: double("previous_year_same_month_branch_revenue", { precision: 30, scale: 4 }),
    previousYearSameMonthRegionRevenue: double("previous_year_same_month_region_revenue", { precision: 30, scale: 4 }),

    // Target Revenue
    kabupatenTargetRevenue: double("kabupaten_target_revenue", { precision: 30, scale: 4 }),
    clusterTargetRevenue: double("cluster_target_revenue", { precision: 30, scale: 4 }),
    subbranchTargetRevenue: double("subbranch_target_revenue", { precision: 30, scale: 4 }),
    branchTargetRevenue: double("branch_target_revenue", { precision: 30, scale: 4 }),
    regionalTargetRevenue: double("regional_target_revenue", { precision: 30, scale: 4 }),

    // YTD Revenue
    ytdKabupatenRevenue: double("ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
    ytdClusterRevenue: double("ytd_cluster_revenue", { precision: 30, scale: 4 }),
    ytdSubbranchRevenue: double("ytd_subbranch_revenue", { precision: 30, scale: 4 }),
    ytdBranchRevenue: double("ytd_branch_revenue", { precision: 30, scale: 4 }),
    ytdRegionalRevenue: double("ytd_regional_revenue", { precision: 30, scale: 4 }),

    // Previous Year YTD Revenue
    prevYtdKabupatenRevenue: double("prev_ytd_kabupaten_revenue", { precision: 30, scale: 4 }),
    prevYtdClusterRevenue: double("prev_ytd_cluster_revenue", { precision: 30, scale: 4 }),
    prevYtdSubbranchRevenue: double("prev_ytd_subbranch_revenue", { precision: 30, scale: 4 }),
    prevYtdBranchRevenue: double("prev_ytd_branch_revenue", { precision: 30, scale: 4 }),
    prevYtdRegionalRevenue: double("prev_ytd_regional_revenue", { precision: 30, scale: 4 }),

    // Metadata
    transactionDate: varchar("mtd_dt", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const feiTargetPuma = honaiPuma.table('fei_target_puma', {
    territory: varchar("territory", { length: 50 }),
    periode: varchar("periode", { length: 200 }),

    rev_all: decimal("rev_all", { precision: 19, scale: 2 }),
    rev_byu: decimal("rev_byu", { precision: 19, scale: 2 }),
    rev_prepaid: decimal("rev_prepaid", { precision: 19, scale: 2 }),
    rev_ns: decimal("rev_ns", { precision: 19, scale: 2 }),
    rev_ns_prepaid: decimal("rev_ns_prepaid", { precision: 19, scale: 2 }),

    paying_subs: decimal("paying_subs", { precision: 19, scale: 2 }),
    paying_los_0_1: decimal("paying_los_0_1", { precision: 19, scale: 2 }),
    paying_los_0_1_byu: decimal("paying_los_0_1_byu", { precision: 19, scale: 2 }),
    paying_los_0_1_prepaid: decimal("paying_los_0_1_prepaid", { precision: 19, scale: 2 }),

    rev_cvm: decimal("rev_cvm", { precision: 19, scale: 2 }),
    rev_cvm_outlet: decimal("rev_cvm_outlet", { precision: 19, scale: 2 }),

    pv_redeem_prepaid: decimal("pv_redeem_prepaid", { precision: 19, scale: 2 }),
    pv_redeem_byu: decimal("pv_redeem_byu", { precision: 19, scale: 2 }),

    rev_sa: decimal("rev_sa", { precision: 19, scale: 2 }),
    rev_sa_byu: decimal("rev_sa_byu", { precision: 19, scale: 2 }),
    rev_sa_prepaid: decimal("rev_sa_prepaid", { precision: 19, scale: 2 }),

    trx_sa: decimal("trx_sa", { precision: 19, scale: 2 }),
    trx_sa_byu: decimal("trx_sa_byu", { precision: 19, scale: 2 }),
    trx_sa_prepaid: decimal("trx_sa_prepaid", { precision: 19, scale: 2 }),

    so: decimal("so", { precision: 19, scale: 2 }),
    so_byu: decimal("so_byu", { precision: 19, scale: 2 }),
    so_prepaid: decimal("so_prepaid", { precision: 19, scale: 2 }),

    trx_ns: decimal("trx_ns", { precision: 19, scale: 2 }),
    trx_ns_byu: decimal("trx_ns_byu", { precision: 19, scale: 2 }),
    trx_ns_prepaid: decimal("trx_ns_prepaid", { precision: 19, scale: 2 }),
})

export const targetHouseholdAll = honaiPuma.table('target_household_all', {
    territory: varchar("territory", { length: 50 }),
    periode: varchar("periode", { length: 200 }),

    all_sales: varchar("all_sales", { length: 50 }),
    agency: varchar("agency", { length: 50 }),
    community: varchar("community", { length: 50 }),
    grapari: varchar("grapari", { length: 50 }),
    digital: varchar("digital", { length: 50 }),
    b2b2c: varchar("b2b2c", { length: 50 }),
    greenfield: varchar("greenfield", { length: 50 }),
    brownfield: varchar("brownfield", { length: 50 }),
    ih_reg: varchar("ih_reg", { length: 50 }),
    hwa: varchar("hwa", { length: 50 }),
    tsel_one: varchar("tsel_one", { length: 50 }),
    all_sales_ih_only: varchar("all_sales_ih_only", { length: 50 }),
    daily_target_io: varchar("daily_target_io", { length: 50 }),
    daily_target_re: varchar("daily_target_re", { length: 50 }),
    daily_target_ps: varchar("daily_target_ps", { length: 50 }),

})

export const targetTerritoryDemands = honaiPuma.table('target_territory_demands', {
    branch: varchar('branch', { length: 30 }),
    wok: varchar('wok', { length: 20 }),
    periode: varchar('periode', { length: 10 }),
    ytd_demand: varchar('ytd_demand', { length: 20 })
})

export const targetRevenueC3mr = honaiPuma.table('target_revenue_c3mr', {
    branch: varchar('branch', { length: 20 }),
    wok: varchar('wok', { length: 20 }),
    periode: varchar('periode', { length: 10 }),
    rev_all: varchar('rev_all', { length: 20 }),
    rev_ns: varchar('rev_ns', { length: 20 }),
    rev_existing: varchar('rev_existing', { length: 20 })
})

export const summaryRevAllRegional = honaiPuma.table('summary_rev_all_regional', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 100 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),
    rev_all_qoq: varchar("rev_all_qoq", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_qoq: varchar("rev_bb_qoq", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_qoq: varchar("rev_sms_qoq", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_qoq: varchar("rev_voice_qoq", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_qoq: varchar("rev_digital_qoq", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_qoq: varchar("rev_ir_qoq", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_abso", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_qoq: varchar("rev_others_qoq", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.newAbcStrate).using('btree')
}))

export const summaryRevAllBranch = honaiPuma.table('summary_rev_all_branch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 30 }),
    branch: varchar('branch', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 80 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),
    rev_all_qoq: varchar("rev_all_qoq", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_qoq: varchar("rev_bb_qoq", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_qoq: varchar("rev_sms_qoq", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_qoq: varchar("rev_voice_qoq", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_qoq: varchar("rev_digital_qoq", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_qoq: varchar("rev_ir_qoq", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_abso", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_qoq: varchar("rev_others_qoq", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.branch, t.newAbcStrate).using('btree')
}))

export const summaryRevAllSubbranch = honaiPuma.table('summary_rev_all_subbranch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 50 }),
    branch: varchar('branch', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 80 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),
    rev_all_qoq: varchar("rev_all_qoq", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_qoq: varchar("rev_bb_qoq", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_qoq: varchar("rev_sms_qoq", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_qoq: varchar("rev_voice_qoq", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_qoq: varchar("rev_digital_qoq", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_qoq: varchar("rev_ir_qoq", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_abso", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_qoq: varchar("rev_others_qoq", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.branch, t.subbranch, t.newAbcStrate).using('btree')
}))

export const summaryRevAllCluster = honaiPuma.table('summary_rev_all_cluster', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 30 }),
    branch: varchar('branch', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 50 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),
    rev_all_qoq: varchar("rev_all_qoq", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_qoq: varchar("rev_bb_qoq", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_qoq: varchar("rev_sms_qoq", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_qoq: varchar("rev_voice_qoq", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_qoq: varchar("rev_digital_qoq", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_qoq: varchar("rev_ir_qoq", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_abso", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_qoq: varchar("rev_others_qoq", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.branch, t.subbranch, t.cluster, t.newAbcStrate).using('btree')
}))

export const summaryRevAllKabupaten = honaiPuma.table('summary_rev_all_kabupaten', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 30 }),
    branch: varchar('branch', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    kabupaten: varchar('kabupaten', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 80 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_m1: varchar("rev_all_m1", { length: 100 }),
    rev_all_m12: varchar("rev_all_m12", { length: 100 }),
    rev_all_y: varchar("rev_all_y", { length: 100 }),
    rev_all_y1: varchar("rev_all_y1", { length: 100 }),
    rev_all_q: varchar("rev_all_q", { length: 100 }),
    rev_all_q1: varchar("rev_all_q1", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),
    rev_all_qoq: varchar("rev_all_qoq", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_m1: varchar("rev_bb_m1", { length: 100 }),
    rev_bb_m12: varchar("rev_bb_m12", { length: 100 }),
    rev_bb_y: varchar("rev_bb_y", { length: 100 }),
    rev_bb_y1: varchar("rev_bb_y1", { length: 100 }),
    rev_bb_q: varchar("rev_bb_q", { length: 100 }),
    rev_bb_q1: varchar("rev_bb_q1", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_qoq: varchar("rev_bb_qoq", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_m1: varchar("rev_sms_m1", { length: 100 }),
    rev_sms_m12: varchar("rev_sms_m12", { length: 100 }),
    rev_sms_y: varchar("rev_sms_y", { length: 100 }),
    rev_sms_y1: varchar("rev_sms_y1", { length: 100 }),
    rev_sms_q: varchar("rev_sms_q", { length: 100 }),
    rev_sms_q1: varchar("rev_sms_q1", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_qoq: varchar("rev_sms_qoq", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_m1: varchar("rev_voice_m1", { length: 100 }),
    rev_voice_m12: varchar("rev_voice_m12", { length: 100 }),
    rev_voice_y: varchar("rev_voice_y", { length: 100 }),
    rev_voice_y1: varchar("rev_voice_y1", { length: 100 }),
    rev_voice_q: varchar("rev_voice_q", { length: 100 }),
    rev_voice_q1: varchar("rev_voice_q1", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_qoq: varchar("rev_voice_qoq", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_m1: varchar("rev_digital_m1", { length: 100 }),
    rev_digital_m12: varchar("rev_digital_m12", { length: 100 }),
    rev_digital_y: varchar("rev_digital_y", { length: 100 }),
    rev_digital_y1: varchar("rev_digital_y1", { length: 100 }),
    rev_digital_q: varchar("rev_digital_q", { length: 100 }),
    rev_digital_q1: varchar("rev_digital_q1", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_qoq: varchar("rev_digital_qoq", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_m1: varchar("rev_ir_m1", { length: 100 }),
    rev_ir_m12: varchar("rev_ir_m12", { length: 100 }),
    rev_ir_y: varchar("rev_ir_y", { length: 100 }),
    rev_ir_y1: varchar("rev_ir_y1", { length: 100 }),
    rev_ir_q: varchar("rev_ir_q", { length: 100 }),
    rev_ir_q1: varchar("rev_ir_q1", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_qoq: varchar("rev_ir_qoq", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_m1: varchar("rev_others_m1", { length: 100 }),
    rev_others_m12: varchar("rev_others_m12", { length: 100 }),
    rev_others_y: varchar("rev_others_y", { length: 100 }),
    rev_others_y1: varchar("rev_others_y1", { length: 100 }),
    rev_others_q: varchar("rev_others_q", { length: 100 }),
    rev_others_q1: varchar("rev_others_q1", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_abso", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_qoq: varchar("rev_others_qoq", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.branch, t.subbranch, t.cluster, t.kabupaten, t.newAbcStrate).using('btree')
}))

export const summaryRevPrabayarRegional = honaiPuma.table('summary_rev_prabayar_regional', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 100 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_absolut", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.newAbcStrate).using('btree')
}))

export const summaryRevPrabayarBranch = honaiPuma.table('summary_rev_prabayar_branch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 30 }),
    branch: varchar('branch', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 80 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_absolut", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.branch, t.newAbcStrate).using('btree')
}))

export const summaryRevPrabayarSubbranch = honaiPuma.table('summary_rev_prabayar_subbranch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 50 }),
    branch: varchar('branch', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 80 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_absolut", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.branch, t.subbranch, t.newAbcStrate).using('btree')
}))

export const summaryRevPrabayarCluster = honaiPuma.table('summary_rev_prabayar_cluster', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 30 }),
    branch: varchar('branch', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 50 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_absolut", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.branch, t.subbranch, t.cluster, t.newAbcStrate).using('btree')
}))

export const summaryRevPrabayarKabupaten = honaiPuma.table('summary_rev_prabayar_kabupaten', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 30 }),
    branch: varchar('branch', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    kabupaten: varchar('kabupaten', { length: 30 }),
    newAbcStrate: varchar('new_abc_strategy', { length: 80 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_m1: varchar("rev_all_m1", { length: 100 }),
    rev_all_m12: varchar("rev_all_m12", { length: 100 }),
    rev_all_y: varchar("rev_all_y", { length: 100 }),
    rev_all_y1: varchar("rev_all_y1", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_absolut: varchar("rev_all_absolut", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_m1: varchar("rev_bb_m1", { length: 100 }),
    rev_bb_m12: varchar("rev_bb_m12", { length: 100 }),
    rev_bb_y: varchar("rev_bb_y", { length: 100 }),
    rev_bb_y1: varchar("rev_bb_y1", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_absolut: varchar("rev_bb_absolut", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_m1: varchar("rev_sms_m1", { length: 100 }),
    rev_sms_m12: varchar("rev_sms_m12", { length: 100 }),
    rev_sms_y: varchar("rev_sms_y", { length: 100 }),
    rev_sms_y1: varchar("rev_sms_y1", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_absolut: varchar("rev_sms_absolut", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_m1: varchar("rev_voice_m1", { length: 100 }),
    rev_voice_m12: varchar("rev_voice_m12", { length: 100 }),
    rev_voice_y: varchar("rev_voice_y", { length: 100 }),
    rev_voice_y1: varchar("rev_voice_y1", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_absol: varchar("rev_voice_absolut", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_m1: varchar("rev_digital_m1", { length: 100 }),
    rev_digital_m12: varchar("rev_digital_m12", { length: 100 }),
    rev_digital_y: varchar("rev_digital_y", { length: 100 }),
    rev_digital_y1: varchar("rev_digital_y1", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_absol: varchar("rev_digital_absolut", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_m1: varchar("rev_ir_m1", { length: 100 }),
    rev_ir_m12: varchar("rev_ir_m12", { length: 100 }),
    rev_ir_y: varchar("rev_ir_y", { length: 100 }),
    rev_ir_y1: varchar("rev_ir_y1", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_absolut: varchar("rev_ir_absolut", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_m1: varchar("rev_others_m1", { length: 100 }),
    rev_others_m12: varchar("rev_others_m12", { length: 100 }),
    rev_others_y: varchar("rev_others_y", { length: 100 }),
    rev_others_y1: varchar("rev_others_y1", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_abso: varchar("rev_others_absolut", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
}, t => ({
    summaryRevAll: index('summary_rev_all').on(t.tgl, t.area, t.regional, t.branch, t.subbranch, t.cluster, t.kabupaten, t.newAbcStrate).using('btree')
}))

export const summaryRevByuRegional = honaiPuma.table('summary_rev_byu_regional', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 50 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
})

export const summaryRevByuBranch = honaiPuma.table('summary_rev_byu_branch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 50 }),
    branch: varchar('branch', { length: 30 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
})

export const summaryRevByuSubbranch = honaiPuma.table('summary_rev_byu_subbranch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 50 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
})

export const summaryRevByuCluster = honaiPuma.table('summary_rev_byu_cluster', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 50 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),
    cluster: varchar('cluster', { length: 100 }),
    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_all_mom: varchar("rev_all_mom", { length: 100 }),
    rev_all_yoy: varchar("rev_all_yoy", { length: 100 }),
    rev_all_ytd: varchar("rev_all_ytd", { length: 100 }),

    rev_bb_m: varchar("rev_bb_m", { length: 100 }),
    rev_bb_mom: varchar("rev_bb_mom", { length: 100 }),
    rev_bb_yoy: varchar("rev_bb_yoy", { length: 100 }),
    rev_bb_ytd: varchar("rev_bb_ytd", { length: 100 }),
    rev_bb_contr: varchar("rev_bb_contr", { length: 100 }),

    rev_sms_m: varchar("rev_sms_m", { length: 100 }),
    rev_sms_mom: varchar("rev_sms_mom", { length: 100 }),
    rev_sms_yoy: varchar("rev_sms_yoy", { length: 100 }),
    rev_sms_ytd: varchar("rev_sms_ytd", { length: 100 }),
    rev_sms_contr: varchar("rev_sms_contr", { length: 100 }),

    rev_voice_m: varchar("rev_voice_m", { length: 100 }),
    rev_voice_mom: varchar("rev_voice_mom", { length: 100 }),
    rev_voice_yoy: varchar("rev_voice_yoy", { length: 100 }),
    rev_voice_ytd: varchar("rev_voice_ytd", { length: 100 }),
    rev_voice_contr: varchar("rev_voice_contr", { length: 100 }),

    rev_digital_m: varchar("rev_digital_m", { length: 100 }),
    rev_digital_mom: varchar("rev_digital_mom", { length: 100 }),
    rev_digital_yoy: varchar("rev_digital_yoy", { length: 100 }),
    rev_digital_ytd: varchar("rev_digital_ytd", { length: 100 }),
    rev_digital_contr: varchar("rev_digital_contr", { length: 100 }),

    rev_ir_m: varchar("rev_ir_m", { length: 100 }),
    rev_ir_mom: varchar("rev_ir_mom", { length: 100 }),
    rev_ir_yoy: varchar("rev_ir_yoy", { length: 100 }),
    rev_ir_ytd: varchar("rev_ir_ytd", { length: 100 }),
    rev_ir_contr: varchar("rev_ir_contr", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),
    rev_others_yoy: varchar("rev_others_yoy", { length: 100 }),
    rev_others_ytd: varchar("rev_others_ytd", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
})

export const summaryRevByuKabupaten = honaiPuma.table('summary_rev_byu_kabupaten', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    regional: varchar('regional', { length: 50 }),
    branch: varchar('branch', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    kabupaten: varchar('kabupaten', { length: 30 }),
    rev_all_m: varchar('rev_all_m', { length: 100 }),
    rev_all_m1: varchar('rev_all_m1', { length: 100 }),
    rev_all_m12: varchar('rev_all_m12', { length: 100 }),
    rev_all_y: varchar('rev_all_y', { length: 100 }),
    rev_all_y1: varchar('rev_all_y1', { length: 100 }),
    rev_all_mom: varchar('rev_all_mom', { length: 100 }),
    rev_all_yoy: varchar('rev_all_yoy', { length: 100 }),
    rev_all_ytd: varchar('rev_all_ytd', { length: 100 }),

    // rev_bb_*
    rev_bb_m: varchar('rev_bb_m', { length: 100 }),
    rev_bb_m1: varchar('rev_bb_m1', { length: 100 }),
    rev_bb_m12: varchar('rev_bb_m12', { length: 100 }),
    rev_bb_y: varchar('rev_bb_y', { length: 100 }),
    rev_bb_y1: varchar('rev_bb_y1', { length: 100 }),
    rev_bb_mom: varchar('rev_bb_mom', { length: 100 }),
    rev_bb_yoy: varchar('rev_bb_yoy', { length: 100 }),
    rev_bb_ytd: varchar('rev_bb_ytd', { length: 100 }),
    rev_bb_contr: varchar('rev_bb_contr', { length: 100 }),

    // rev_sms_*
    rev_sms_m: varchar('rev_sms_m', { length: 100 }),
    rev_sms_m1: varchar('rev_sms_m1', { length: 100 }),
    rev_sms_m12: varchar('rev_sms_m12', { length: 100 }),
    rev_sms_y: varchar('rev_sms_y', { length: 100 }),
    rev_sms_y1: varchar('rev_sms_y1', { length: 100 }),
    rev_sms_mom: varchar('rev_sms_mom', { length: 100 }),
    rev_sms_yoy: varchar('rev_sms_yoy', { length: 100 }),
    rev_sms_ytd: varchar('rev_sms_ytd', { length: 100 }),
    rev_sms_contr: varchar('rev_sms_contr', { length: 100 }),

    // rev_voice_*
    rev_voice_m: varchar('rev_voice_m', { length: 100 }),
    rev_voice_m1: varchar('rev_voice_m1', { length: 100 }),
    rev_voice_m12: varchar('rev_voice_m12', { length: 100 }),
    rev_voice_y: varchar('rev_voice_y', { length: 100 }),
    rev_voice_y1: varchar('rev_voice_y1', { length: 100 }),
    rev_voice_mom: varchar('rev_voice_mom', { length: 100 }),
    rev_voice_yoy: varchar('rev_voice_yoy', { length: 100 }),
    rev_voice_ytd: varchar('rev_voice_ytd', { length: 100 }),
    rev_voice_contr: varchar('rev_voice_contr', { length: 100 }),

    // rev_digital_*
    rev_digital_m: varchar('rev_digital_m', { length: 100 }),
    rev_digital_m1: varchar('rev_digital_m1', { length: 100 }),
    rev_digital_m12: varchar('rev_digital_m12', { length: 100 }),
    rev_digital_y: varchar('rev_digital_y', { length: 100 }),
    rev_digital_y1: varchar('rev_digital_y1', { length: 100 }),
    rev_digital_mom: varchar('rev_digital_mom', { length: 100 }),
    rev_digital_yoy: varchar('rev_digital_yoy', { length: 100 }),
    rev_digital_ytd: varchar('rev_digital_ytd', { length: 100 }),
    rev_digital_contr: varchar('rev_digital_contr', { length: 100 }),

    // rev_ir_*
    rev_ir_m: varchar('rev_ir_m', { length: 100 }),
    rev_ir_m1: varchar('rev_ir_m1', { length: 100 }),
    rev_ir_m12: varchar('rev_ir_m12', { length: 100 }),
    rev_ir_y: varchar('rev_ir_y', { length: 100 }),
    rev_ir_y1: varchar('rev_ir_y1', { length: 100 }),
    rev_ir_mom: varchar('rev_ir_mom', { length: 100 }),
    rev_ir_yoy: varchar('rev_ir_yoy', { length: 100 }),
    rev_ir_ytd: varchar('rev_ir_ytd', { length: 100 }),
    rev_ir_contr: varchar('rev_ir_contr', { length: 100 }),

    // rev_others_*
    rev_others_m: varchar('rev_others_m', { length: 100 }),
    rev_others_m1: varchar('rev_others_m1', { length: 100 }),
    rev_others_m12: varchar('rev_others_m12', { length: 100 }),
    rev_others_y: varchar('rev_others_y', { length: 100 }),
    rev_others_y1: varchar('rev_others_y1', { length: 100 }),
    rev_others_mom: varchar('rev_others_mom', { length: 100 }),
    rev_others_yoy: varchar('rev_others_yoy', { length: 100 }),
    rev_others_ytd: varchar('rev_others_ytd', { length: 100 }),
    rev_others_contr: varchar('rev_others_contr', { length: 100 }),
})

export const summaryBbRegional = honaiPuma.table('summary_bb_regional', {
    tgl: varchar("tgl", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    type: varchar("type", { length: 200 }),
    Rev_Data_Pack: varchar("Rev_Data_Pack", { length: 100 }),
    MoM_Data_Pack: varchar("MoM_Data_Pack", { length: 100 }),
    Abs_Data_Pack: varchar("Abs_Data_Pack", { length: 100 }),
    YoY_Data_Pack: varchar("YoY_Data_Pack", { length: 100 }),
    YTD_Data_Pack: varchar("YTD_Data_Pack", { length: 100 }),
    QoQ_Data_Pack: varchar("QoQ_Data_Pack", { length: 100 }),

    Rev_Core: varchar("Rev_Core", { length: 100 }),
    MoM_Core: varchar("MoM_Core", { length: 100 }),
    Abs_Core: varchar("Abs_Core", { length: 100 }),
    YoY_Core: varchar("YoY_Core", { length: 100 }),
    YTD_Core: varchar("YTD_Core", { length: 100 }),
    QoQ_Core: varchar("QoQ_Core", { length: 100 }),
    cont_core: varchar("cont_core", { length: 100 }),

    Rev_BTL: varchar("Rev_BTL", { length: 100 }),
    MoM_BTL: varchar("MoM_BTL", { length: 100 }),
    Abs_BTL: varchar("Abs_BTL", { length: 100 }),
    YoY_BTL: varchar("YoY_BTL", { length: 100 }),
    YTD_BTL: varchar("YTD_BTL", { length: 100 }),
    QoQ_BTL: varchar("QoQ_BTL", { length: 100 }),
    cont_BTL: varchar("cont_BTL", { length: 100 }),

    Rev_Akuisisi: varchar("Rev_Akuisisi", { length: 100 }),
    MoM_Akuisisi: varchar("MoM_Akuisisi", { length: 100 }),
    Abs_Akuisisi: varchar("Abs_Akuisisi", { length: 100 }),
    YoY_Akuisisi: varchar("YoY_Akuisisi", { length: 100 }),
    YTD_Akuisisi: varchar("YTD_Akuisisi", { length: 100 }),
    QoQ_Akuisisi: varchar("QoQ_Akuisisi", { length: 100 }),
    cont_Akuisisi: varchar("cont_Akuisisi", { length: 100 }),

    Rev_Voucher_Fisik: varchar("Rev_Voucher_Fisik", { length: 100 }),
    MoM_Voucher_Fisik: varchar("MoM_Voucher_Fisik", { length: 100 }),
    Abs_Voucher_Fisik: varchar("Abs_Voucher_Fisik", { length: 100 }),
    YoY_Voucher_Fisik: varchar("YoY_Voucher_Fisik", { length: 100 }),
    YTD_Voucher_Fisik: varchar("YTD_Voucher_Fisik", { length: 100 }),
    QoQ_Voucher_Fisik: varchar("QoQ_Voucher_Fisik", { length: 100 }),
    cont_Voucher_Fisik: varchar("cont_Voucher_Fisik", { length: 100 }),

    Rev_MKios_Fix: varchar("Rev_MKios_Fix", { length: 100 }),
    MoM_MKios_Fix: varchar("MoM_MKios_Fix", { length: 100 }),
    Abs_MKios_Fix: varchar("Abs_MKios_Fix", { length: 100 }),
    YoY_MKios_Fix: varchar("YoY_MKios_Fix", { length: 100 }),
    YTD_MKios_Fix: varchar("YTD_MKios_Fix", { length: 100 }),
    QoQ_MKios_Fix: varchar("QoQ_MKios_Fix", { length: 100 }),
    cont_MKios_Fix: varchar("cont_MKios_Fix", { length: 100 }),

    Rev_Others: varchar("Rev_Others", { length: 100 }),
    MoM_Others: varchar("MoM_Others", { length: 100 }),
    Abs_Others: varchar("Abs_Others", { length: 100 }),
    YoY_Others: varchar("YoY_Others", { length: 100 }),
    YTD_Others: varchar("YTD_Others", { length: 100 }),
    QoQ_Others: varchar("QoQ_Others", { length: 100 }),
    cont_Others: varchar("cont_Others", { length: 100 }),

    Rev_UMB_Chan: varchar("Rev_UMB_Channel", { length: 100 }),
    MoM_UMB_Cha: varchar("MoM_UMB_Channel", { length: 100 }),
    Abs_UMB_Chan: varchar("Abs_UMB_Channel", { length: 100 }),
    YoY_UMB_Chan: varchar("YoY_UMB_Channel", { length: 100 }),
    YTD_UMB_Chan: varchar("YTD_UMB_Channel", { length: 100 }),
    QoQ_UMB_Chan: varchar("QoQ_UMB_Channel", { length: 100 }),
    cont_UMB_Chan: varchar("cont_UMB_Channel", { length: 100 }),

    Rev_MKIOS_Channel: varchar("Rev_MKIOS_Channel", { length: 100 }),
    MoM_MKIOS_Channel: varchar("MoM_MKIOS_Channel", { length: 100 }),
    YoY_MKIOS_Channel: varchar("YoY_MKIOS_Channel", { length: 100 }),
    Abs_MKIOS_Channel: varchar("Abs_MKIOS_Channel", { length: 100 }),
    YTD_MKIOS_Channel: varchar("YTD_MKIOS_Channel", { length: 100 }),
    QoQ_MKIOS_Channel: varchar("QoQ_MKIOS_Channel", { length: 100 }),
    cont_MKIOS_Channel: varchar("cont_MKIOS_Channel", { length: 100 }),

    Rev_MyTelkoms: varchar("Rev_MyTelkomsel_Channel", { length: 100 }),
    MoM_MyTelkoms: varchar("MoM_MyTelkomsel_Channel", { length: 100 }),
    Abs_MyTelkoms: varchar("Abs_MyTelkomsel_Channel", { length: 100 }),
    YoY_MyTelkoms: varchar("YoY_MyTelkomsel_Channel", { length: 100 }),
    YTD_MyTelkoms: varchar("YTD_MyTelkomsel_Channel", { length: 100 }),
    QoQ_MyTelkoms: varchar("QoQ_MyTelkomsel_Channel", { length: 100 }),
    cont_MyTelkoms: varchar("cont_MyTelkomsel_Channel", { length: 100 }),

    Rev_Modern_Channel: varchar("Rev_Modern_Channel_Channel", { length: 100 }),
    MoM_Modern_Channel: varchar("MoM_Modern_Channel_Channel", { length: 100 }),
    Abs_Modern_Channel: varchar("Abs_Modern_Channel_Channel", { length: 100 }),
    YoY_Modern_Channel: varchar("YoY_Modern_Channel_Channel", { length: 100 }),
    YTD_Modern_Channel: varchar("YTD_Modern_Channel_Channel", { length: 100 }),
    QoQ_Modern_Channel: varchar("QoQ_Modern_Channel_Channel", { length: 100 }),
    cont_Modern_Channel: varchar("cont_Modern_Channel_Channel", { length: 100 }),

    Rev_Others_Channel: varchar("Rev_Others_Channel_Channel", { length: 100 }),
    MoM_Others_Channel: varchar("MoM_Others_Channel_Channel", { length: 100 }),
    Abs_Others_Channel: varchar("Abs_Others_Channel_Channel", { length: 100 }),
    YoY_Others_Channel: varchar("YoY_Others_Channel_Channel", { length: 100 }),
    YTD_Others_Channel: varchar("YTD_Others_Channel_Channel", { length: 100 }),
    QoQ_Others_Channel: varchar("QoQ_Others_Channel_Channel", { length: 100 }),
    cont_Others_Channel: varchar("cont_Others_Channel_Channel", { length: 100 }),
}, t => [
    index('tgl').on(t.tgl).using('btree'),
    index('regional').on(t.regional).using('btree'),
])

export const summaryBbBranch = honaiPuma.table('summary_bb_branch', {
    tgl: varchar("tgl", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    type: varchar("type", { length: 200 }),
    Rev_Data_Pack: varchar("Rev_Data_Pack", { length: 100 }),
    MoM_Data_Pack: varchar("MoM_Data_Pack", { length: 100 }),
    Abs_Data_Pack: varchar("Abs_Data_Pack", { length: 100 }),
    YoY_Data_Pack: varchar("YoY_Data_Pack", { length: 100 }),
    YTD_Data_Pack: varchar("YTD_Data_Pack", { length: 100 }),
    QoQ_Data_Pack: varchar("QoQ_Data_Pack", { length: 100 }),

    Rev_Core: varchar("Rev_Core", { length: 100 }),
    MoM_Core: varchar("MoM_Core", { length: 100 }),
    Abs_Core: varchar("Abs_Core", { length: 100 }),
    YoY_Core: varchar("YoY_Core", { length: 100 }),
    YTD_Core: varchar("YTD_Core", { length: 100 }),
    QoQ_Core: varchar("QoQ_Core", { length: 100 }),
    cont_core: varchar("cont_core", { length: 100 }),

    Rev_BTL: varchar("Rev_BTL", { length: 100 }),
    MoM_BTL: varchar("MoM_BTL", { length: 100 }),
    Abs_BTL: varchar("Abs_BTL", { length: 100 }),
    YoY_BTL: varchar("YoY_BTL", { length: 100 }),
    YTD_BTL: varchar("YTD_BTL", { length: 100 }),
    QoQ_BTL: varchar("QoQ_BTL", { length: 100 }),
    cont_BTL: varchar("cont_BTL", { length: 100 }),

    Rev_Akuisisi: varchar("Rev_Akuisisi", { length: 100 }),
    MoM_Akuisisi: varchar("MoM_Akuisisi", { length: 100 }),
    Abs_Akuisisi: varchar("Abs_Akuisisi", { length: 100 }),
    YoY_Akuisisi: varchar("YoY_Akuisisi", { length: 100 }),
    YTD_Akuisisi: varchar("YTD_Akuisisi", { length: 100 }),
    QoQ_Akuisisi: varchar("QoQ_Akuisisi", { length: 100 }),
    cont_Akuisisi: varchar("cont_Akuisisi", { length: 100 }),

    Rev_Voucher_Fisik: varchar("Rev_Voucher_Fisik", { length: 100 }),
    MoM_Voucher_Fisik: varchar("MoM_Voucher_Fisik", { length: 100 }),
    Abs_Voucher_Fisik: varchar("Abs_Voucher_Fisik", { length: 100 }),
    YoY_Voucher_Fisik: varchar("YoY_Voucher_Fisik", { length: 100 }),
    YTD_Voucher_Fisik: varchar("YTD_Voucher_Fisik", { length: 100 }),
    QoQ_Voucher_Fisik: varchar("QoQ_Voucher_Fisik", { length: 100 }),
    cont_Voucher_Fisik: varchar("cont_Voucher_Fisik", { length: 100 }),

    Rev_MKios_Fix: varchar("Rev_MKios_Fix", { length: 100 }),
    MoM_MKios_Fix: varchar("MoM_MKios_Fix", { length: 100 }),
    Abs_MKios_Fix: varchar("Abs_MKios_Fix", { length: 100 }),
    YoY_MKios_Fix: varchar("YoY_MKios_Fix", { length: 100 }),
    YTD_MKios_Fix: varchar("YTD_MKios_Fix", { length: 100 }),
    QoQ_MKios_Fix: varchar("QoQ_MKios_Fix", { length: 100 }),
    cont_MKios_Fix: varchar("cont_MKios_Fix", { length: 100 }),

    Rev_Others: varchar("Rev_Others", { length: 100 }),
    MoM_Others: varchar("MoM_Others", { length: 100 }),
    Abs_Others: varchar("Abs_Others", { length: 100 }),
    YoY_Others: varchar("YoY_Others", { length: 100 }),
    YTD_Others: varchar("YTD_Others", { length: 100 }),
    QoQ_Others: varchar("QoQ_Others", { length: 100 }),
    cont_Others: varchar("cont_Others", { length: 100 }),

    Rev_UMB_Chan: varchar("Rev_UMB_Channel", { length: 100 }),
    MoM_UMB_Cha: varchar("MoM_UMB_Channel", { length: 100 }),
    Abs_UMB_Chan: varchar("Abs_UMB_Channel", { length: 100 }),
    YoY_UMB_Chan: varchar("YoY_UMB_Channel", { length: 100 }),
    YTD_UMB_Chan: varchar("YTD_UMB_Channel", { length: 100 }),
    QoQ_UMB_Chan: varchar("QoQ_UMB_Channel", { length: 100 }),
    cont_UMB_Chan: varchar("cont_UMB_Channel", { length: 100 }),

    Rev_MKIOS_Channel: varchar("Rev_MKIOS_Channel", { length: 100 }),
    MoM_MKIOS_Channel: varchar("MoM_MKIOS_Channel", { length: 100 }),
    YoY_MKIOS_Channel: varchar("YoY_MKIOS_Channel", { length: 100 }),
    Abs_MKIOS_Channel: varchar("Abs_MKIOS_Channel", { length: 100 }),
    YTD_MKIOS_Channel: varchar("YTD_MKIOS_Channel", { length: 100 }),
    QoQ_MKIOS_Channel: varchar("QoQ_MKIOS_Channel", { length: 100 }),
    cont_MKIOS_Channel: varchar("cont_MKIOS_Channel", { length: 100 }),

    Rev_MyTelkoms: varchar("Rev_MyTelkomsel_Channel", { length: 100 }),
    MoM_MyTelkoms: varchar("MoM_MyTelkomsel_Channel", { length: 100 }),
    Abs_MyTelkoms: varchar("Abs_MyTelkomsel_Channel", { length: 100 }),
    YoY_MyTelkoms: varchar("YoY_MyTelkomsel_Channel", { length: 100 }),
    YTD_MyTelkoms: varchar("YTD_MyTelkomsel_Channel", { length: 100 }),
    QoQ_MyTelkoms: varchar("QoQ_MyTelkomsel_Channel", { length: 100 }),
    cont_MyTelkoms: varchar("cont_MyTelkomsel_Channel", { length: 100 }),

    Rev_Modern_Channel: varchar("Rev_Modern_Channel_Channel", { length: 100 }),
    MoM_Modern_Channel: varchar("MoM_Modern_Channel_Channel", { length: 100 }),
    Abs_Modern_Channel: varchar("Abs_Modern_Channel_Channel", { length: 100 }),
    YoY_Modern_Channel: varchar("YoY_Modern_Channel_Channel", { length: 100 }),
    YTD_Modern_Channel: varchar("YTD_Modern_Channel_Channel", { length: 100 }),
    QoQ_Modern_Channel: varchar("QoQ_Modern_Channel_Channel", { length: 100 }),
    cont_Modern_Channel: varchar("cont_Modern_Channel_Channel", { length: 100 }),

    Rev_Others_Channel: varchar("Rev_Others_Channel_Channel", { length: 100 }),
    MoM_Others_Channel: varchar("MoM_Others_Channel_Channel", { length: 100 }),
    Abs_Others_Channel: varchar("Abs_Others_Channel_Channel", { length: 100 }),
    YoY_Others_Channel: varchar("YoY_Others_Channel_Channel", { length: 100 }),
    YTD_Others_Channel: varchar("YTD_Others_Channel_Channel", { length: 100 }),
    QoQ_Others_Channel: varchar("QoQ_Others_Channel_Channel", { length: 100 }),
    cont_Others_Channel: varchar("cont_Others_Channel_Channel", { length: 100 }),
}, t => ({
    tgl: index('tgl').on(t.tgl).using('btree'),
    regional: index('regional').on(t.regional).using('btree'),
    branch: index('branch').on(t.branch).using('btree'),
}))

export const summaryBbSubbranch = honaiPuma.table('summary_bb_subbranch', {
    tgl: varchar("tgl", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 200 }),
    type: varchar("type", { length: 200 }),
    Rev_Data_Pack: varchar("Rev_Data_Pack", { length: 100 }),
    MoM_Data_Pack: varchar("MoM_Data_Pack", { length: 100 }),
    Abs_Data_Pack: varchar("Abs_Data_Pack", { length: 100 }),
    YoY_Data_Pack: varchar("YoY_Data_Pack", { length: 100 }),
    YTD_Data_Pack: varchar("YTD_Data_Pack", { length: 100 }),
    QoQ_Data_Pack: varchar("QoQ_Data_Pack", { length: 100 }),

    Rev_Core: varchar("Rev_Core", { length: 100 }),
    MoM_Core: varchar("MoM_Core", { length: 100 }),
    Abs_Core: varchar("Abs_Core", { length: 100 }),
    YoY_Core: varchar("YoY_Core", { length: 100 }),
    YTD_Core: varchar("YTD_Core", { length: 100 }),
    QoQ_Core: varchar("QoQ_Core", { length: 100 }),
    cont_core: varchar("cont_core", { length: 100 }),

    Rev_BTL: varchar("Rev_BTL", { length: 100 }),
    MoM_BTL: varchar("MoM_BTL", { length: 100 }),
    Abs_BTL: varchar("Abs_BTL", { length: 100 }),
    YoY_BTL: varchar("YoY_BTL", { length: 100 }),
    YTD_BTL: varchar("YTD_BTL", { length: 100 }),
    QoQ_BTL: varchar("QoQ_BTL", { length: 100 }),
    cont_BTL: varchar("cont_BTL", { length: 100 }),

    Rev_Akuisisi: varchar("Rev_Akuisisi", { length: 100 }),
    MoM_Akuisisi: varchar("MoM_Akuisisi", { length: 100 }),
    Abs_Akuisisi: varchar("Abs_Akuisisi", { length: 100 }),
    YoY_Akuisisi: varchar("YoY_Akuisisi", { length: 100 }),
    YTD_Akuisisi: varchar("YTD_Akuisisi", { length: 100 }),
    QoQ_Akuisisi: varchar("QoQ_Akuisisi", { length: 100 }),
    cont_Akuisisi: varchar("cont_Akuisisi", { length: 100 }),

    Rev_Voucher_Fisik: varchar("Rev_Voucher_Fisik", { length: 100 }),
    MoM_Voucher_Fisik: varchar("MoM_Voucher_Fisik", { length: 100 }),
    Abs_Voucher_Fisik: varchar("Abs_Voucher_Fisik", { length: 100 }),
    YoY_Voucher_Fisik: varchar("YoY_Voucher_Fisik", { length: 100 }),
    YTD_Voucher_Fisik: varchar("YTD_Voucher_Fisik", { length: 100 }),
    QoQ_Voucher_Fisik: varchar("QoQ_Voucher_Fisik", { length: 100 }),
    cont_Voucher_Fisik: varchar("cont_Voucher_Fisik", { length: 100 }),

    Rev_MKios_Fix: varchar("Rev_MKios_Fix", { length: 100 }),
    MoM_MKios_Fix: varchar("MoM_MKios_Fix", { length: 100 }),
    Abs_MKios_Fix: varchar("Abs_MKios_Fix", { length: 100 }),
    YoY_MKios_Fix: varchar("YoY_MKios_Fix", { length: 100 }),
    YTD_MKios_Fix: varchar("YTD_MKios_Fix", { length: 100 }),
    QoQ_MKios_Fix: varchar("QoQ_MKios_Fix", { length: 100 }),
    cont_MKios_Fix: varchar("cont_MKios_Fix", { length: 100 }),

    Rev_Others: varchar("Rev_Others", { length: 100 }),
    MoM_Others: varchar("MoM_Others", { length: 100 }),
    Abs_Others: varchar("Abs_Others", { length: 100 }),
    YoY_Others: varchar("YoY_Others", { length: 100 }),
    YTD_Others: varchar("YTD_Others", { length: 100 }),
    QoQ_Others: varchar("QoQ_Others", { length: 100 }),
    cont_Others: varchar("cont_Others", { length: 100 }),

    Rev_UMB_Chan: varchar("Rev_UMB_Channel", { length: 100 }),
    MoM_UMB_Cha: varchar("MoM_UMB_Channel", { length: 100 }),
    Abs_UMB_Chan: varchar("Abs_UMB_Channel", { length: 100 }),
    YoY_UMB_Chan: varchar("YoY_UMB_Channel", { length: 100 }),
    YTD_UMB_Chan: varchar("YTD_UMB_Channel", { length: 100 }),
    QoQ_UMB_Chan: varchar("QoQ_UMB_Channel", { length: 100 }),
    cont_UMB_Chan: varchar("cont_UMB_Channel", { length: 100 }),

    Rev_MKIOS_Channel: varchar("Rev_MKIOS_Channel", { length: 100 }),
    MoM_MKIOS_Channel: varchar("MoM_MKIOS_Channel", { length: 100 }),
    YoY_MKIOS_Channel: varchar("YoY_MKIOS_Channel", { length: 100 }),
    Abs_MKIOS_Channel: varchar("Abs_MKIOS_Channel", { length: 100 }),
    YTD_MKIOS_Channel: varchar("YTD_MKIOS_Channel", { length: 100 }),
    QoQ_MKIOS_Channel: varchar("QoQ_MKIOS_Channel", { length: 100 }),
    cont_MKIOS_Channel: varchar("cont_MKIOS_Channel", { length: 100 }),

    Rev_MyTelkoms: varchar("Rev_MyTelkomsel_Channel", { length: 100 }),
    MoM_MyTelkoms: varchar("MoM_MyTelkomsel_Channel", { length: 100 }),
    Abs_MyTelkoms: varchar("Abs_MyTelkomsel_Channel", { length: 100 }),
    YoY_MyTelkoms: varchar("YoY_MyTelkomsel_Channel", { length: 100 }),
    YTD_MyTelkoms: varchar("YTD_MyTelkomsel_Channel", { length: 100 }),
    QoQ_MyTelkoms: varchar("QoQ_MyTelkomsel_Channel", { length: 100 }),
    cont_MyTelkoms: varchar("cont_MyTelkomsel_Channel", { length: 100 }),

    Rev_Modern_Channel: varchar("Rev_Modern_Channel_Channel", { length: 100 }),
    MoM_Modern_Channel: varchar("MoM_Modern_Channel_Channel", { length: 100 }),
    Abs_Modern_Channel: varchar("Abs_Modern_Channel_Channel", { length: 100 }),
    YoY_Modern_Channel: varchar("YoY_Modern_Channel_Channel", { length: 100 }),
    YTD_Modern_Channel: varchar("YTD_Modern_Channel_Channel", { length: 100 }),
    QoQ_Modern_Channel: varchar("QoQ_Modern_Channel_Channel", { length: 100 }),
    cont_Modern_Channel: varchar("cont_Modern_Channel_Channel", { length: 100 }),

    Rev_Others_Channel: varchar("Rev_Others_Channel_Channel", { length: 100 }),
    MoM_Others_Channel: varchar("MoM_Others_Channel_Channel", { length: 100 }),
    Abs_Others_Channel: varchar("Abs_Others_Channel_Channel", { length: 100 }),
    YoY_Others_Channel: varchar("YoY_Others_Channel_Channel", { length: 100 }),
    YTD_Others_Channel: varchar("YTD_Others_Channel_Channel", { length: 100 }),
    QoQ_Others_Channel: varchar("QoQ_Others_Channel_Channel", { length: 100 }),
    cont_Others_Channel: varchar("cont_Others_Channel_Channel", { length: 100 }),
}, t => [
    index('tgl').on(t.tgl).using('btree'),
    index('regional').on(t.regional).using('btree'),
    index('branch').on(t.branch).using('btree'),
    index('subbranch').on(t.subbranch).using('btree'),
])

export const summaryBbCluster = honaiPuma.table('summary_bb_cluster', {
    tgl: varchar("tgl", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 200 }),
    cluster: varchar("cluster", { length: 200 }),
    type: varchar("type", { length: 200 }),
    Rev_Data_Pack: varchar("Rev_Data_Pack", { length: 100 }),
    MoM_Data_Pack: varchar("MoM_Data_Pack", { length: 100 }),
    Abs_Data_Pack: varchar("Abs_Data_Pack", { length: 100 }),
    YoY_Data_Pack: varchar("YoY_Data_Pack", { length: 100 }),
    YTD_Data_Pack: varchar("YTD_Data_Pack", { length: 100 }),
    QoQ_Data_Pack: varchar("QoQ_Data_Pack", { length: 100 }),

    Rev_Core: varchar("Rev_Core", { length: 100 }),
    MoM_Core: varchar("MoM_Core", { length: 100 }),
    Abs_Core: varchar("Abs_Core", { length: 100 }),
    YoY_Core: varchar("YoY_Core", { length: 100 }),
    YTD_Core: varchar("YTD_Core", { length: 100 }),
    QoQ_Core: varchar("QoQ_Core", { length: 100 }),
    cont_core: varchar("cont_core", { length: 100 }),

    Rev_BTL: varchar("Rev_BTL", { length: 100 }),
    MoM_BTL: varchar("MoM_BTL", { length: 100 }),
    Abs_BTL: varchar("Abs_BTL", { length: 100 }),
    YoY_BTL: varchar("YoY_BTL", { length: 100 }),
    YTD_BTL: varchar("YTD_BTL", { length: 100 }),
    QoQ_BTL: varchar("QoQ_BTL", { length: 100 }),
    cont_BTL: varchar("cont_BTL", { length: 100 }),

    Rev_Akuisisi: varchar("Rev_Akuisisi", { length: 100 }),
    MoM_Akuisisi: varchar("MoM_Akuisisi", { length: 100 }),
    Abs_Akuisisi: varchar("Abs_Akuisisi", { length: 100 }),
    YoY_Akuisisi: varchar("YoY_Akuisisi", { length: 100 }),
    YTD_Akuisisi: varchar("YTD_Akuisisi", { length: 100 }),
    QoQ_Akuisisi: varchar("QoQ_Akuisisi", { length: 100 }),
    cont_Akuisisi: varchar("cont_Akuisisi", { length: 100 }),

    Rev_Voucher_Fisik: varchar("Rev_Voucher_Fisik", { length: 100 }),
    MoM_Voucher_Fisik: varchar("MoM_Voucher_Fisik", { length: 100 }),
    Abs_Voucher_Fisik: varchar("Abs_Voucher_Fisik", { length: 100 }),
    YoY_Voucher_Fisik: varchar("YoY_Voucher_Fisik", { length: 100 }),
    YTD_Voucher_Fisik: varchar("YTD_Voucher_Fisik", { length: 100 }),
    QoQ_Voucher_Fisik: varchar("QoQ_Voucher_Fisik", { length: 100 }),
    cont_Voucher_Fisik: varchar("cont_Voucher_Fisik", { length: 100 }),

    Rev_MKios_Fix: varchar("Rev_MKios_Fix", { length: 100 }),
    MoM_MKios_Fix: varchar("MoM_MKios_Fix", { length: 100 }),
    Abs_MKios_Fix: varchar("Abs_MKios_Fix", { length: 100 }),
    YoY_MKios_Fix: varchar("YoY_MKios_Fix", { length: 100 }),
    YTD_MKios_Fix: varchar("YTD_MKios_Fix", { length: 100 }),
    QoQ_MKios_Fix: varchar("QoQ_MKios_Fix", { length: 100 }),
    cont_MKios_Fix: varchar("cont_MKios_Fix", { length: 100 }),

    Rev_Others: varchar("Rev_Others", { length: 100 }),
    MoM_Others: varchar("MoM_Others", { length: 100 }),
    Abs_Others: varchar("Abs_Others", { length: 100 }),
    YoY_Others: varchar("YoY_Others", { length: 100 }),
    YTD_Others: varchar("YTD_Others", { length: 100 }),
    QoQ_Others: varchar("QoQ_Others", { length: 100 }),
    cont_Others: varchar("cont_Others", { length: 100 }),

    Rev_UMB_Chan: varchar("Rev_UMB_Channel", { length: 100 }),
    MoM_UMB_Cha: varchar("MoM_UMB_Channel", { length: 100 }),
    Abs_UMB_Chan: varchar("Abs_UMB_Channel", { length: 100 }),
    YoY_UMB_Chan: varchar("YoY_UMB_Channel", { length: 100 }),
    YTD_UMB_Chan: varchar("YTD_UMB_Channel", { length: 100 }),
    QoQ_UMB_Chan: varchar("QoQ_UMB_Channel", { length: 100 }),
    cont_UMB_Chan: varchar("cont_UMB_Channel", { length: 100 }),

    Rev_MKIOS_Channel: varchar("Rev_MKIOS_Channel", { length: 100 }),
    MoM_MKIOS_Channel: varchar("MoM_MKIOS_Channel", { length: 100 }),
    YoY_MKIOS_Channel: varchar("YoY_MKIOS_Channel", { length: 100 }),
    Abs_MKIOS_Channel: varchar("Abs_MKIOS_Channel", { length: 100 }),
    YTD_MKIOS_Channel: varchar("YTD_MKIOS_Channel", { length: 100 }),
    QoQ_MKIOS_Channel: varchar("QoQ_MKIOS_Channel", { length: 100 }),
    cont_MKIOS_Channel: varchar("cont_MKIOS_Channel", { length: 100 }),

    Rev_MyTelkoms: varchar("Rev_MyTelkomsel_Channel", { length: 100 }),
    MoM_MyTelkoms: varchar("MoM_MyTelkomsel_Channel", { length: 100 }),
    Abs_MyTelkoms: varchar("Abs_MyTelkomsel_Channel", { length: 100 }),
    YoY_MyTelkoms: varchar("YoY_MyTelkomsel_Channel", { length: 100 }),
    YTD_MyTelkoms: varchar("YTD_MyTelkomsel_Channel", { length: 100 }),
    QoQ_MyTelkoms: varchar("QoQ_MyTelkomsel_Channel", { length: 100 }),
    cont_MyTelkoms: varchar("cont_MyTelkomsel_Channel", { length: 100 }),

    Rev_Modern_Channel: varchar("Rev_Modern_Channel_Channel", { length: 100 }),
    MoM_Modern_Channel: varchar("MoM_Modern_Channel_Channel", { length: 100 }),
    Abs_Modern_Channel: varchar("Abs_Modern_Channel_Channel", { length: 100 }),
    YoY_Modern_Channel: varchar("YoY_Modern_Channel_Channel", { length: 100 }),
    YTD_Modern_Channel: varchar("YTD_Modern_Channel_Channel", { length: 100 }),
    QoQ_Modern_Channel: varchar("QoQ_Modern_Channel_Channel", { length: 100 }),
    cont_Modern_Channel: varchar("cont_Modern_Channel_Channel", { length: 100 }),

    Rev_Others_Channel: varchar("Rev_Others_Channel_Channel", { length: 100 }),
    MoM_Others_Channel: varchar("MoM_Others_Channel_Channel", { length: 100 }),
    Abs_Others_Channel: varchar("Abs_Others_Channel_Channel", { length: 100 }),
    YoY_Others_Channel: varchar("YoY_Others_Channel_Channel", { length: 100 }),
    YTD_Others_Channel: varchar("YTD_Others_Channel_Channel", { length: 100 }),
    QoQ_Others_Channel: varchar("QoQ_Others_Channel_Channel", { length: 100 }),
    cont_Others_Channel: varchar("cont_Others_Channel_Channel", { length: 100 }),
}, t => ({
    tgl: index('tgl').on(t.tgl).using('btree'),
    regional: index('regional').on(t.regional).using('btree'),
    branch: index('branch').on(t.branch).using('btree'),
    subbranch: index('subbranch').on(t.subbranch).using('btree'),
    cluster: index('cluster').on(t.cluster).using('btree'),
}))

export const summaryBbCity = honaiPuma.table('summary_bb_city', {
    tgl: varchar("tgl", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 200 }),
    cluster: varchar("cluster", { length: 200 }),
    city: varchar("city", { length: 200 }),
    type: varchar("type", { length: 200 }),
    Rev_Data_Pack: varchar("Rev_Data_Pack", { length: 100 }),
    MoM_Data_Pack: varchar("MoM_Data_Pack", { length: 100 }),
    Abs_Data_Pack: varchar("Abs_Data_Pack", { length: 100 }),
    YoY_Data_Pack: varchar("YoY_Data_Pack", { length: 100 }),
    YTD_Data_Pack: varchar("YTD_Data_Pack", { length: 100 }),
    QoQ_Data_Pack: varchar("QoQ_Data_Pack", { length: 100 }),

    Rev_Core: varchar("Rev_Core", { length: 100 }),
    MoM_Core: varchar("MoM_Core", { length: 100 }),
    Abs_Core: varchar("Abs_Core", { length: 100 }),
    YoY_Core: varchar("YoY_Core", { length: 100 }),
    YTD_Core: varchar("YTD_Core", { length: 100 }),
    QoQ_Core: varchar("QoQ_Core", { length: 100 }),
    cont_core: varchar("cont_core", { length: 100 }),

    Rev_BTL: varchar("Rev_BTL", { length: 100 }),
    MoM_BTL: varchar("MoM_BTL", { length: 100 }),
    Abs_BTL: varchar("Abs_BTL", { length: 100 }),
    YoY_BTL: varchar("YoY_BTL", { length: 100 }),
    YTD_BTL: varchar("YTD_BTL", { length: 100 }),
    QoQ_BTL: varchar("QoQ_BTL", { length: 100 }),
    cont_BTL: varchar("cont_BTL", { length: 100 }),

    Rev_Akuisisi: varchar("Rev_Akuisisi", { length: 100 }),
    MoM_Akuisisi: varchar("MoM_Akuisisi", { length: 100 }),
    Abs_Akuisisi: varchar("Abs_Akuisisi", { length: 100 }),
    YoY_Akuisisi: varchar("YoY_Akuisisi", { length: 100 }),
    YTD_Akuisisi: varchar("YTD_Akuisisi", { length: 100 }),
    QoQ_Akuisisi: varchar("QoQ_Akuisisi", { length: 100 }),
    cont_Akuisisi: varchar("cont_Akuisisi", { length: 100 }),

    Rev_Voucher_Fisik: varchar("Rev_Voucher_Fisik", { length: 100 }),
    MoM_Voucher_Fisik: varchar("MoM_Voucher_Fisik", { length: 100 }),
    Abs_Voucher_Fisik: varchar("Abs_Voucher_Fisik", { length: 100 }),
    YoY_Voucher_Fisik: varchar("YoY_Voucher_Fisik", { length: 100 }),
    YTD_Voucher_Fisik: varchar("YTD_Voucher_Fisik", { length: 100 }),
    QoQ_Voucher_Fisik: varchar("QoQ_Voucher_Fisik", { length: 100 }),
    cont_Voucher_Fisik: varchar("cont_Voucher_Fisik", { length: 100 }),

    Rev_MKios_Fix: varchar("Rev_MKios_Fix", { length: 100 }),
    MoM_MKios_Fix: varchar("MoM_MKios_Fix", { length: 100 }),
    Abs_MKios_Fix: varchar("Abs_MKios_Fix", { length: 100 }),
    YoY_MKios_Fix: varchar("YoY_MKios_Fix", { length: 100 }),
    YTD_MKios_Fix: varchar("YTD_MKios_Fix", { length: 100 }),
    QoQ_MKios_Fix: varchar("QoQ_MKios_Fix", { length: 100 }),
    cont_MKios_Fix: varchar("cont_MKios_Fix", { length: 100 }),

    Rev_Others: varchar("Rev_Others", { length: 100 }),
    MoM_Others: varchar("MoM_Others", { length: 100 }),
    Abs_Others: varchar("Abs_Others", { length: 100 }),
    YoY_Others: varchar("YoY_Others", { length: 100 }),
    YTD_Others: varchar("YTD_Others", { length: 100 }),
    QoQ_Others: varchar("QoQ_Others", { length: 100 }),
    cont_Others: varchar("cont_Others", { length: 100 }),

    Rev_UMB_Chan: varchar("Rev_UMB_Channel", { length: 100 }),
    MoM_UMB_Cha: varchar("MoM_UMB_Channel", { length: 100 }),
    Abs_UMB_Chan: varchar("Abs_UMB_Channel", { length: 100 }),
    YoY_UMB_Chan: varchar("YoY_UMB_Channel", { length: 100 }),
    YTD_UMB_Chan: varchar("YTD_UMB_Channel", { length: 100 }),
    QoQ_UMB_Chan: varchar("QoQ_UMB_Channel", { length: 100 }),
    cont_UMB_Chan: varchar("cont_UMB_Channel", { length: 100 }),

    Rev_MKIOS_Channel: varchar("Rev_MKIOS_Channel", { length: 100 }),
    MoM_MKIOS_Channel: varchar("MoM_MKIOS_Channel", { length: 100 }),
    YoY_MKIOS_Channel: varchar("YoY_MKIOS_Channel", { length: 100 }),
    Abs_MKIOS_Channel: varchar("Abs_MKIOS_Channel", { length: 100 }),
    YTD_MKIOS_Channel: varchar("YTD_MKIOS_Channel", { length: 100 }),
    QoQ_MKIOS_Channel: varchar("QoQ_MKIOS_Channel", { length: 100 }),
    cont_MKIOS_Channel: varchar("cont_MKIOS_Channel", { length: 100 }),

    Rev_MyTelkoms: varchar("Rev_MyTelkomsel_Channel", { length: 100 }),
    MoM_MyTelkoms: varchar("MoM_MyTelkomsel_Channel", { length: 100 }),
    Abs_MyTelkoms: varchar("Abs_MyTelkomsel_Channel", { length: 100 }),
    YoY_MyTelkoms: varchar("YoY_MyTelkomsel_Channel", { length: 100 }),
    YTD_MyTelkoms: varchar("YTD_MyTelkomsel_Channel", { length: 100 }),
    QoQ_MyTelkoms: varchar("QoQ_MyTelkomsel_Channel", { length: 100 }),
    cont_MyTelkoms: varchar("cont_MyTelkomsel_Channel", { length: 100 }),

    Rev_Modern_Channel: varchar("Rev_Modern_Channel_Channel", { length: 100 }),
    MoM_Modern_Channel: varchar("MoM_Modern_Channel_Channel", { length: 100 }),
    Abs_Modern_Channel: varchar("Abs_Modern_Channel_Channel", { length: 100 }),
    YoY_Modern_Channel: varchar("YoY_Modern_Channel_Channel", { length: 100 }),
    YTD_Modern_Channel: varchar("YTD_Modern_Channel_Channel", { length: 100 }),
    QoQ_Modern_Channel: varchar("QoQ_Modern_Channel_Channel", { length: 100 }),
    cont_Modern_Channel: varchar("cont_Modern_Channel_Channel", { length: 100 }),

    Rev_Others_Channel: varchar("Rev_Others_Channel_Channel", { length: 100 }),
    MoM_Others_Channel: varchar("MoM_Others_Channel_Channel", { length: 100 }),
    Abs_Others_Channel: varchar("Abs_Others_Channel_Channel", { length: 100 }),
    YoY_Others_Channel: varchar("YoY_Others_Channel_Channel", { length: 100 }),
    YTD_Others_Channel: varchar("YTD_Others_Channel_Channel", { length: 100 }),
    QoQ_Others_Channel: varchar("QoQ_Others_Channel_Channel", { length: 100 }),
    cont_Others_Channel: varchar("cont_Others_Channel_Channel", { length: 100 }),
}, t => ({
    tgl: index('tgl').on(t.tgl).using('btree'),
    regional: index('regional').on(t.regional).using('btree'),
    branch: index('branch').on(t.branch).using('btree'),
    subbranch: index('subbranch').on(t.subbranch).using('btree'),
    cluster: index('cluster').on(t.cluster).using('btree'),
    city: index('city').on(t.city).using('btree'),
}))

export const summarySaAllRegional = honaiPuma.table('summary_sa_all_regional', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),

    trx_sa_cur: decimal("trx_sa_cur", { precision: 19, scale: 0 }),
    trx_natural_cur: decimal("trx_natural_cur", { precision: 19, scale: 0 }),
    trx_total_cur: decimal("trx_total_cur", { precision: 19, scale: 0 }),

    trx_mom_sa: decimal("trx_mom_sa", { precision: 19, scale: 2 }),
    trx_mom_natural: decimal("trx_mom_natural", { precision: 19, scale: 2 }),
    trx_mom_all: decimal("trx_mom_all", { precision: 19, scale: 2 }),

    trx_contr_sa: decimal("trx_contr_sa", { precision: 19, scale: 2 }),
    trx_contr_natural: decimal("trx_contr_natural", { precision: 19, scale: 2 }),

    rev_sa_cur: decimal("rev_sa_cur", { precision: 19, scale: 0 }),
    rev_natural_cur: decimal("rev_natural_cur", { precision: 19, scale: 0 }),
    rev_total_cur: decimal("rev_total_cur", { precision: 19, scale: 0 }),

    rev_mom_sa: decimal("rev_mom_sa", { precision: 19, scale: 2 }),
    rev_mom_natural: decimal("rev_mom_natural", { precision: 19, scale: 2 }),
    rev_mom_all: decimal("rev_mom_all", { precision: 19, scale: 2 }),

    rev_contr_sa: decimal("rev_contr_sa", { precision: 19, scale: 2 }),
    rev_contr_natural: decimal("rev_contr_natural", { precision: 19, scale: 2 }),
})

export const summarySaAllBranch = honaiPuma.table('summary_sa_all_branch', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),

    trx_sa_cur: decimal("trx_sa_cur", { precision: 19, scale: 0 }),
    trx_natural_cur: decimal("trx_natural_cur", { precision: 19, scale: 0 }),
    trx_total_cur: decimal("trx_total_cur", { precision: 19, scale: 0 }),

    trx_mom_sa: decimal("trx_mom_sa", { precision: 19, scale: 2 }),
    trx_mom_natural: decimal("trx_mom_natural", { precision: 19, scale: 2 }),
    trx_mom_all: decimal("trx_mom_all", { precision: 19, scale: 2 }),

    trx_contr_sa: decimal("trx_contr_sa", { precision: 19, scale: 2 }),
    trx_contr_natural: decimal("trx_contr_natural", { precision: 19, scale: 2 }),

    rev_sa_cur: decimal("rev_sa_cur", { precision: 19, scale: 0 }),
    rev_natural_cur: decimal("rev_natural_cur", { precision: 19, scale: 0 }),
    rev_total_cur: decimal("rev_total_cur", { precision: 19, scale: 0 }),

    rev_mom_sa: decimal("rev_mom_sa", { precision: 19, scale: 2 }),
    rev_mom_natural: decimal("rev_mom_natural", { precision: 19, scale: 2 }),
    rev_mom_all: decimal("rev_mom_all", { precision: 19, scale: 2 }),

    rev_contr_sa: decimal("rev_contr_sa", { precision: 19, scale: 2 }),
    rev_contr_natural: decimal("rev_contr_natural", { precision: 19, scale: 2 }),
})

export const summarySaAllSubbranch = honaiPuma.table('summary_sa_all_subbranch', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 200 }),

    trx_sa_cur: decimal("trx_sa_cur", { precision: 19, scale: 0 }),
    trx_natural_cur: decimal("trx_natural_cur", { precision: 19, scale: 0 }),
    trx_total_cur: decimal("trx_total_cur", { precision: 19, scale: 0 }),

    trx_mom_sa: decimal("trx_mom_sa", { precision: 19, scale: 2 }),
    trx_mom_natural: decimal("trx_mom_natural", { precision: 19, scale: 2 }),
    trx_mom_all: decimal("trx_mom_all", { precision: 19, scale: 2 }),

    trx_contr_sa: decimal("trx_contr_sa", { precision: 19, scale: 2 }),
    trx_contr_natural: decimal("trx_contr_natural", { precision: 19, scale: 2 }),

    rev_sa_cur: decimal("rev_sa_cur", { precision: 19, scale: 0 }),
    rev_natural_cur: decimal("rev_natural_cur", { precision: 19, scale: 0 }),
    rev_total_cur: decimal("rev_total_cur", { precision: 19, scale: 0 }),

    rev_mom_sa: decimal("rev_mom_sa", { precision: 19, scale: 2 }),
    rev_mom_natural: decimal("rev_mom_natural", { precision: 19, scale: 2 }),
    rev_mom_all: decimal("rev_mom_all", { precision: 19, scale: 2 }),

    rev_contr_sa: decimal("rev_contr_sa", { precision: 19, scale: 2 }),
    rev_contr_natural: decimal("rev_contr_natural", { precision: 19, scale: 2 }),
})

export const summarySaAllCluster = honaiPuma.table('summary_sa_all_cluster', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 255 }),
    cluster: varchar("cluster", { length: 255 }),

    trx_sa_cur: decimal("trx_sa_cur", { precision: 19, scale: 0 }),
    trx_natural_cur: decimal("trx_natural_cur", { precision: 19, scale: 0 }),
    trx_total_cur: decimal("trx_total_cur", { precision: 19, scale: 0 }),

    trx_mom_sa: decimal("trx_mom_sa", { precision: 19, scale: 2 }),
    trx_mom_natural: decimal("trx_mom_natural", { precision: 19, scale: 2 }),
    trx_mom_all: decimal("trx_mom_all", { precision: 19, scale: 2 }),

    trx_contr_sa: decimal("trx_contr_sa", { precision: 19, scale: 2 }),
    trx_contr_natural: decimal("trx_contr_natural", { precision: 19, scale: 2 }),

    rev_sa_cur: decimal("rev_sa_cur", { precision: 19, scale: 0 }),
    rev_natural_cur: decimal("rev_natural_cur", { precision: 19, scale: 0 }),
    rev_total_cur: decimal("rev_total_cur", { precision: 19, scale: 0 }),

    rev_mom_sa: decimal("rev_mom_sa", { precision: 19, scale: 2 }),
    rev_mom_natural: decimal("rev_mom_natural", { precision: 19, scale: 2 }),
    rev_mom_all: decimal("rev_mom_all", { precision: 19, scale: 2 }),

    rev_contr_sa: decimal("rev_contr_sa", { precision: 19, scale: 2 }),
    rev_contr_natural: decimal("rev_contr_natural", { precision: 19, scale: 2 }),
})

export const summarySaAllKabupaten = honaiPuma.table('summary_sa_all_kabupaten', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 255 }),
    cluster: varchar("cluster", { length: 255 }),
    kabupaten: varchar("kabupaten", { length: 255 }),

    trx_sa_cur: decimal("trx_sa_cur", { precision: 19, scale: 0 }),
    trx_natural_cur: decimal("trx_natural_cur", { precision: 19, scale: 0 }),
    trx_total_cur: decimal("trx_total_cur", { precision: 19, scale: 0 }),

    trx_mom_sa: decimal("trx_mom_sa", { precision: 19, scale: 2 }),
    trx_mom_natural: decimal("trx_mom_natural", { precision: 19, scale: 2 }),
    trx_mom_all: decimal("trx_mom_all", { precision: 19, scale: 2 }),

    trx_contr_sa: decimal("trx_contr_sa", { precision: 19, scale: 2 }),
    trx_contr_natural: decimal("trx_contr_natural", { precision: 19, scale: 2 }),

    rev_sa_cur: decimal("rev_sa_cur", { precision: 19, scale: 0 }),
    rev_natural_cur: decimal("rev_natural_cur", { precision: 19, scale: 0 }),
    rev_total_cur: decimal("rev_total_cur", { precision: 19, scale: 0 }),

    rev_mom_sa: decimal("rev_mom_sa", { precision: 19, scale: 2 }),
    rev_mom_natural: decimal("rev_mom_natural", { precision: 19, scale: 2 }),
    rev_mom_all: decimal("rev_mom_all", { precision: 19, scale: 2 }),

    rev_contr_sa: decimal("rev_contr_sa", { precision: 19, scale: 2 }),
    rev_contr_natural: decimal("rev_contr_natural", { precision: 19, scale: 2 }),
})

export const summaryPvConsumeRegional = honaiPuma.table('summary_pv_consume_regional', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 255 }),
    denom: varchar("denom", { length: 10 }),

    cur_trx: decimal("cur_trx", { precision: 19, scale: 0 }),
    last_trx: decimal("last_trx", { precision: 19, scale: 0 }),
    trx_wow: decimal("trx_wow", { precision: 19, scale: 2 }),
    trx_mom: decimal("trx_mom", { precision: 19, scale: 2 }),

    cur_rev: decimal("cur_rev", { precision: 19, scale: 0 }),
    last_rev: decimal("last_rev", { precision: 19, scale: 0 }),
    rev_wow: decimal("rev_wow", { precision: 19, scale: 2 }),
    rev_mom: decimal("rev_mom", { precision: 19, scale: 2 }),
})

export const summaryPvConsumeBranch = honaiPuma.table('summary_pv_consume_branch', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 255 }),
    branch: varchar("branch", { length: 255 }),
    denom: varchar("denom", { length: 10 }),

    cur_trx: decimal("cur_trx", { precision: 19, scale: 0 }),
    last_trx: decimal("last_trx", { precision: 19, scale: 0 }),
    trx_wow: decimal("trx_wow", { precision: 19, scale: 2 }),
    trx_mom: decimal("trx_mom", { precision: 19, scale: 2 }),

    cur_rev: decimal("cur_rev", { precision: 19, scale: 0 }),
    last_rev: decimal("last_rev", { precision: 19, scale: 0 }),
    rev_wow: decimal("rev_wow", { precision: 19, scale: 2 }),
    rev_mom: decimal("rev_mom", { precision: 19, scale: 2 }),
})

export const summaryPvConsumeSubbranch = honaiPuma.table('summary_pv_consume_subbranch', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 255 }),
    branch: varchar("branch", { length: 255 }),
    subbranch: varchar("subbranch", { length: 255 }),
    denom: varchar("denom", { length: 10 }),

    cur_trx: decimal("cur_trx", { precision: 19, scale: 0 }),
    last_trx: decimal("last_trx", { precision: 19, scale: 0 }),
    trx_wow: decimal("trx_wow", { precision: 19, scale: 2 }),
    trx_mom: decimal("trx_mom", { precision: 19, scale: 2 }),

    cur_rev: decimal("cur_rev", { precision: 19, scale: 0 }),
    last_rev: decimal("last_rev", { precision: 19, scale: 0 }),
    rev_wow: decimal("rev_wow", { precision: 19, scale: 2 }),
    rev_mom: decimal("rev_mom", { precision: 19, scale: 2 }),
})

export const summaryPvConsumeCluster = honaiPuma.table('summary_pv_consume_cluster', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 255 }),
    branch: varchar("branch", { length: 255 }),
    subbranch: varchar("subbranch", { length: 255 }),
    cluster: varchar("cluster", { length: 255 }),
    denom: varchar("denom", { length: 10 }),

    cur_trx: decimal("cur_trx", { precision: 19, scale: 0 }),
    last_trx: decimal("last_trx", { precision: 19, scale: 0 }),
    trx_wow: decimal("trx_wow", { precision: 19, scale: 2 }),
    trx_mom: decimal("trx_mom", { precision: 19, scale: 2 }),

    cur_rev: decimal("cur_rev", { precision: 19, scale: 0 }),
    last_rev: decimal("last_rev", { precision: 19, scale: 0 }),
    rev_wow: decimal("rev_wow", { precision: 19, scale: 2 }),
    rev_mom: decimal("rev_mom", { precision: 19, scale: 2 }),
})

export const summaryPvConsumeKabupaten = honaiPuma.table('summary_pv_consume_kabupaten', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 255 }),
    branch: varchar("branch", { length: 255 }),
    subbranch: varchar("subbranch", { length: 255 }),
    cluster: varchar("cluster", { length: 255 }),
    city: varchar("city", { length: 255 }),
    denom: varchar("denom", { length: 10 }),

    cur_trx: decimal("cur_trx", { precision: 19, scale: 0 }),
    last_trx: decimal("last_trx", { precision: 19, scale: 0 }),
    trx_wow: decimal("trx_wow", { precision: 19, scale: 2 }),
    trx_mom: decimal("trx_mom", { precision: 19, scale: 2 }),

    cur_rev: decimal("cur_rev", { precision: 19, scale: 0 }),
    last_rev: decimal("last_rev", { precision: 19, scale: 0 }),
    rev_wow: decimal("rev_wow", { precision: 19, scale: 2 }),
    rev_mom: decimal("rev_mom", { precision: 19, scale: 2 }),
})

export const summaryRgbHqRegional = honaiPuma.table('summary_rgb_hq_full_regional', {
    event_date: varchar("event_date", { length: 10 }),
    regional: varchar("regional", { length: 100 }),
    brand: varchar("brand", { length: 100 }),
    catlos: varchar("catlos", { length: 100 }),

    cb_mtd: bigint('cb_mtd', { mode: 'number' }),
    cb_m1: bigint('cb_m1', { mode: 'number' }),
    cb_m12: bigint('cb_m12', { mode: 'number' }),
    cb_mom: decimal('cb_mom', { precision: 18, scale: 2 }),
    cb_yoy: decimal('cb_yoy', { precision: 18, scale: 2 }),

    rgb_mtd: bigint('rgb_mtd', { mode: 'number' }),
    rgb_m1: bigint('rgb_m1', { mode: 'number' }),
    rgb_m12: bigint('rgb_m12', { mode: 'number' }),
    rgb_mom: decimal('rgb_mom', { precision: 18, scale: 2 }),
    rgb_yoy: decimal('rgb_yoy', { precision: 18, scale: 2 }),

    rgb_data_mtd: bigint('rgb_data_mtd', { mode: 'number' }),
    rgb_data_m1: bigint('rgb_data_m1', { mode: 'number' }),
    rgb_data_m12: bigint('rgb_data_m12', { mode: 'number' }),
    rgb_data_mom: decimal('rgb_data_mom', { precision: 18, scale: 2 }),
    rgb_data_yoy: decimal('rgb_data_yoy', { precision: 18, scale: 2 }),

    payload_user_mtd: bigint('payload_user_mtd', { mode: 'number' }),
    payload_user_m1: bigint('payload_user_m1', { mode: 'number' }),
    payload_user_m12: bigint('payload_user_m12', { mode: 'number' }),
    payload_user_mom: decimal('payload_user_mom', { precision: 18, scale: 2 }),
    payload_user_yoy: decimal('payload_user_yoy', { precision: 18, scale: 2 }),

    payload_usage_mtd: bigint('payload_usage_mtd', { mode: 'number' }),
    payload_usage_m1: bigint('payload_usage_m1', { mode: 'number' }),
    payload_usage_m12: bigint('payload_usage_m12', { mode: 'number' }),
    payload_usage_mom: decimal('payload_usage_mom', { precision: 18, scale: 2 }),
    payload_usage_yoy: decimal('payload_usage_yoy', { precision: 18, scale: 2 }),

    rgb_digital_mtd: bigint('rgb_digital_mtd', { mode: 'number' }),
    rgb_digital_m1: bigint('rgb_digital_m1', { mode: 'number' }),
    rgb_digital_m12: bigint('rgb_digital_m12', { mode: 'number' }),
    rgb_digital_mom: decimal('rgb_digital_mom', { precision: 18, scale: 2 }),
    rgb_digital_yoy: decimal('rgb_digital_yoy', { precision: 18, scale: 2 }),

    non_rgb_mtd: bigint('non_rgb_mtd', { mode: 'number' }),
    non_rgb_m1: bigint('non_rgb_m1', { mode: 'number' }),
    non_rgb_m12: bigint('non_rgb_m12', { mode: 'number' }),
    persen_to_cb: decimal('persen_to_cb', { precision: 18, scale: 2 }),
})

export const summaryRgbHqBranch = honaiPuma.table('summary_rgb_hq_full_branch', {
    event_date: varchar("event_date", { length: 10 }),
    regional: varchar("regional", { length: 100 }),
    branch: varchar("branch", { length: 100 }),
    brand: varchar("brand", { length: 100 }),
    catlos: varchar("catlos", { length: 100 }),

    cb_mtd: bigint('cb_mtd', { mode: 'number' }),
    cb_m1: bigint('cb_m1', { mode: 'number' }),
    cb_m12: bigint('cb_m12', { mode: 'number' }),
    cb_mom: decimal('cb_mom', { precision: 18, scale: 2 }),
    cb_yoy: decimal('cb_yoy', { precision: 18, scale: 2 }),

    rgb_mtd: bigint('rgb_mtd', { mode: 'number' }),
    rgb_m1: bigint('rgb_m1', { mode: 'number' }),
    rgb_m12: bigint('rgb_m12', { mode: 'number' }),
    rgb_mom: decimal('rgb_mom', { precision: 18, scale: 2 }),
    rgb_yoy: decimal('rgb_yoy', { precision: 18, scale: 2 }),

    rgb_data_mtd: bigint('rgb_data_mtd', { mode: 'number' }),
    rgb_data_m1: bigint('rgb_data_m1', { mode: 'number' }),
    rgb_data_m12: bigint('rgb_data_m12', { mode: 'number' }),
    rgb_data_mom: decimal('rgb_data_mom', { precision: 18, scale: 2 }),
    rgb_data_yoy: decimal('rgb_data_yoy', { precision: 18, scale: 2 }),

    payload_user_mtd: bigint('payload_user_mtd', { mode: 'number' }),
    payload_user_m1: bigint('payload_user_m1', { mode: 'number' }),
    payload_user_m12: bigint('payload_user_m12', { mode: 'number' }),
    payload_user_mom: decimal('payload_user_mom', { precision: 18, scale: 2 }),
    payload_user_yoy: decimal('payload_user_yoy', { precision: 18, scale: 2 }),

    payload_usage_mtd: bigint('payload_usage_mtd', { mode: 'number' }),
    payload_usage_m1: bigint('payload_usage_m1', { mode: 'number' }),
    payload_usage_m12: bigint('payload_usage_m12', { mode: 'number' }),
    payload_usage_mom: decimal('payload_usage_mom', { precision: 18, scale: 2 }),
    payload_usage_yoy: decimal('payload_usage_yoy', { precision: 18, scale: 2 }),

    rgb_digital_mtd: bigint('rgb_digital_mtd', { mode: 'number' }),
    rgb_digital_m1: bigint('rgb_digital_m1', { mode: 'number' }),
    rgb_digital_m12: bigint('rgb_digital_m12', { mode: 'number' }),
    rgb_digital_mom: decimal('rgb_digital_mom', { precision: 18, scale: 2 }),
    rgb_digital_yoy: decimal('rgb_digital_yoy', { precision: 18, scale: 2 }),

    non_rgb_mtd: bigint('non_rgb_mtd', { mode: 'number' }),
    non_rgb_m1: bigint('non_rgb_m1', { mode: 'number' }),
    non_rgb_m12: bigint('non_rgb_m12', { mode: 'number' }),
    persen_to_cb: decimal('persen_to_cb', { precision: 18, scale: 2 }),
})

export const summaryRgbHqCluster = honaiPuma.table('summary_rgb_hq_full_cluster', {
    event_date: varchar("event_date", { length: 10 }),
    regional: varchar("regional", { length: 100 }),
    branch: varchar("branch", { length: 100 }),
    cluster: varchar("cluster", { length: 100 }),
    brand: varchar("brand", { length: 100 }),
    catlos: varchar("catlos", { length: 100 }),

    cb_mtd: bigint('cb_mtd', { mode: 'number' }),
    cb_m1: bigint('cb_m1', { mode: 'number' }),
    cb_m12: bigint('cb_m12', { mode: 'number' }),
    cb_mom: decimal('cb_mom', { precision: 18, scale: 2 }),
    cb_yoy: decimal('cb_yoy', { precision: 18, scale: 2 }),

    rgb_mtd: bigint('rgb_mtd', { mode: 'number' }),
    rgb_m1: bigint('rgb_m1', { mode: 'number' }),
    rgb_m12: bigint('rgb_m12', { mode: 'number' }),
    rgb_mom: decimal('rgb_mom', { precision: 18, scale: 2 }),
    rgb_yoy: decimal('rgb_yoy', { precision: 18, scale: 2 }),

    rgb_data_mtd: bigint('rgb_data_mtd', { mode: 'number' }),
    rgb_data_m1: bigint('rgb_data_m1', { mode: 'number' }),
    rgb_data_m12: bigint('rgb_data_m12', { mode: 'number' }),
    rgb_data_mom: decimal('rgb_data_mom', { precision: 18, scale: 2 }),
    rgb_data_yoy: decimal('rgb_data_yoy', { precision: 18, scale: 2 }),

    payload_user_mtd: bigint('payload_user_mtd', { mode: 'number' }),
    payload_user_m1: bigint('payload_user_m1', { mode: 'number' }),
    payload_user_m12: bigint('payload_user_m12', { mode: 'number' }),
    payload_user_mom: decimal('payload_user_mom', { precision: 18, scale: 2 }),
    payload_user_yoy: decimal('payload_user_yoy', { precision: 18, scale: 2 }),

    payload_usage_mtd: bigint('payload_usage_mtd', { mode: 'number' }),
    payload_usage_m1: bigint('payload_usage_m1', { mode: 'number' }),
    payload_usage_m12: bigint('payload_usage_m12', { mode: 'number' }),
    payload_usage_mom: decimal('payload_usage_mom', { precision: 18, scale: 2 }),
    payload_usage_yoy: decimal('payload_usage_yoy', { precision: 18, scale: 2 }),

    rgb_digital_mtd: bigint('rgb_digital_mtd', { mode: 'number' }),
    rgb_digital_m1: bigint('rgb_digital_m1', { mode: 'number' }),
    rgb_digital_m12: bigint('rgb_digital_m12', { mode: 'number' }),
    rgb_digital_mom: decimal('rgb_digital_mom', { precision: 18, scale: 2 }),
    rgb_digital_yoy: decimal('rgb_digital_yoy', { precision: 18, scale: 2 }),

    non_rgb_mtd: bigint('non_rgb_mtd', { mode: 'number' }),
    non_rgb_m1: bigint('non_rgb_m1', { mode: 'number' }),
    non_rgb_m12: bigint('non_rgb_m12', { mode: 'number' }),
    persen_to_cb: decimal('persen_to_cb', { precision: 18, scale: 2 }),
})

export const summaryRgbHqKabupaten = honaiPuma.table('summary_rgb_hq_full_kabupaten', {
    event_date: varchar("event_date", { length: 10 }),
    regional: varchar("regional", { length: 100 }),
    branch: varchar("branch", { length: 100 }),
    cluster: varchar("cluster", { length: 100 }),
    kabupaten: varchar("kabupaten", { length: 100 }),
    brand: varchar("brand", { length: 100 }),
    catlos: varchar("catlos", { length: 100 }),

    cb_mtd: bigint('cb_mtd', { mode: 'number' }),
    cb_m1: bigint('cb_m1', { mode: 'number' }),
    cb_m12: bigint('cb_m12', { mode: 'number' }),
    cb_mom: decimal('cb_mom', { precision: 18, scale: 2 }),
    cb_yoy: decimal('cb_yoy', { precision: 18, scale: 2 }),

    rgb_mtd: bigint('rgb_mtd', { mode: 'number' }),
    rgb_m1: bigint('rgb_m1', { mode: 'number' }),
    rgb_m12: bigint('rgb_m12', { mode: 'number' }),
    rgb_mom: decimal('rgb_mom', { precision: 18, scale: 2 }),
    rgb_yoy: decimal('rgb_yoy', { precision: 18, scale: 2 }),

    rgb_data_mtd: bigint('rgb_data_mtd', { mode: 'number' }),
    rgb_data_m1: bigint('rgb_data_m1', { mode: 'number' }),
    rgb_data_m12: bigint('rgb_data_m12', { mode: 'number' }),
    rgb_data_mom: decimal('rgb_data_mom', { precision: 18, scale: 2 }),
    rgb_data_yoy: decimal('rgb_data_yoy', { precision: 18, scale: 2 }),

    payload_user_mtd: bigint('payload_user_mtd', { mode: 'number' }),
    payload_user_m1: bigint('payload_user_m1', { mode: 'number' }),
    payload_user_m12: bigint('payload_user_m12', { mode: 'number' }),
    payload_user_mom: decimal('payload_user_mom', { precision: 18, scale: 2 }),
    payload_user_yoy: decimal('payload_user_yoy', { precision: 18, scale: 2 }),

    payload_usage_mtd: bigint('payload_usage_mtd', { mode: 'number' }),
    payload_usage_m1: bigint('payload_usage_m1', { mode: 'number' }),
    payload_usage_m12: bigint('payload_usage_m12', { mode: 'number' }),
    payload_usage_mom: decimal('payload_usage_mom', { precision: 18, scale: 2 }),
    payload_usage_yoy: decimal('payload_usage_yoy', { precision: 18, scale: 2 }),

    rgb_digital_mtd: bigint('rgb_digital_mtd', { mode: 'number' }),
    rgb_digital_m1: bigint('rgb_digital_m1', { mode: 'number' }),
    rgb_digital_m12: bigint('rgb_digital_m12', { mode: 'number' }),
    rgb_digital_mom: decimal('rgb_digital_mom', { precision: 18, scale: 2 }),
    rgb_digital_yoy: decimal('rgb_digital_yoy', { precision: 18, scale: 2 }),

    non_rgb_mtd: bigint('non_rgb_mtd', { mode: 'number' }),
    non_rgb_m1: bigint('non_rgb_m1', { mode: 'number' }),
    non_rgb_m12: bigint('non_rgb_m12', { mode: 'number' }),
    persen_to_cb: decimal('persen_to_cb', { precision: 18, scale: 2 }),
})

export const summarySoAllRegional = honaiPuma.table('summary_so_all_regional', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),

    trx_core_m: varchar("trx_core_m", { length: 100 }),
    trx_core_contr: varchar("trx_core_contr", { length: 100 }),
    trx_core_mom: varchar("trx_core_mom", { length: 100 }),

    trx_acq_m: varchar("trx_acq_m", { length: 100 }),
    trx_acq_contr: varchar("trx_acq_contr", { length: 100 }),
    trx_acq_mom: varchar("trx_acq_mom", { length: 100 }),

    trx_cvm_m: varchar("trx_cvm_m", { length: 100 }),
    trx_cvm_contr: varchar("trx_cvm_contr", { length: 100 }),
    trx_cvm_mom: varchar("trx_cvm_mom", { length: 100 }),

    trx_pv_m: varchar("trx_pv_m", { length: 100 }),
    trx_pv_contr: varchar("trx_pv_contr", { length: 100 }),
    trx_pv_mom: varchar("trx_pv_mom", { length: 100 }),

    trx_no_data_pack_m: varchar("trx_no_data_pack_m", { length: 100 }),
    trx_no_data_pack_contr: varchar("trx_no_data_pack_contr", { length: 100 }),
    trx_no_data_pack_mom: varchar("trx_no_data_pack_mom", { length: 100 }),

    trx_others_m: varchar("trx_others_m", { length: 100 }),
    trx_others_contr: varchar("trx_others_contr", { length: 100 }),
    trx_others_mom: varchar("trx_others_mom", { length: 100 }),

    trx_all_m: varchar("trx_all_m", { length: 100 }),
    trx_total_mom: varchar("trx_total_mom", { length: 100 }),

    rev_core_m: varchar("rev_core_m", { length: 100 }),
    rev_core_contr: varchar("rev_core_contr", { length: 100 }),
    rev_core_mom: varchar("rev_core_mom", { length: 100 }),

    rev_acq_m: varchar("rev_acq_m", { length: 100 }),
    rev_acq_contr: varchar("rev_acq_contr", { length: 100 }),
    rev_acq_mom: varchar("rev_acq_mom", { length: 100 }),

    rev_cvm_m: varchar("rev_cvm_m", { length: 100 }),
    rev_cvm_contr: varchar("rev_cvm_contr", { length: 100 }),
    rev_cvm_mom: varchar("rev_cvm_mom", { length: 100 }),

    rev_pv_m: varchar("rev_pv_m", { length: 100 }),
    rev_pv_contr: varchar("rev_pv_contr", { length: 100 }),
    rev_pv_mom: varchar("rev_pv_mom", { length: 100 }),

    rev_no_data_pack_m: varchar("rev_no_data_pack_m", { length: 100 }),
    rev_no_data_pack_contr: varchar("rev_no_data_pack_contr", { length: 100 }),
    rev_no_data_pack_mom: varchar("rev_no_data_pack_mom", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),

    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_total_mom: varchar("rev_total_mom", { length: 100 }),
})

export const summarySoAllBranch = honaiPuma.table('summary_so_all_branch', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),

    trx_core_m: varchar("trx_core_m", { length: 100 }),
    trx_core_contr: varchar("trx_core_contr", { length: 100 }),
    trx_core_mom: varchar("trx_core_mom", { length: 100 }),

    trx_acq_m: varchar("trx_acq_m", { length: 100 }),
    trx_acq_contr: varchar("trx_acq_contr", { length: 100 }),
    trx_acq_mom: varchar("trx_acq_mom", { length: 100 }),

    trx_cvm_m: varchar("trx_cvm_m", { length: 100 }),
    trx_cvm_contr: varchar("trx_cvm_contr", { length: 100 }),
    trx_cvm_mom: varchar("trx_cvm_mom", { length: 100 }),

    trx_pv_m: varchar("trx_pv_m", { length: 100 }),
    trx_pv_contr: varchar("trx_pv_contr", { length: 100 }),
    trx_pv_mom: varchar("trx_pv_mom", { length: 100 }),

    trx_no_data_pack_m: varchar("trx_no_data_pack_m", { length: 100 }),
    trx_no_data_pack_contr: varchar("trx_no_data_pack_contr", { length: 100 }),
    trx_no_data_pack_mom: varchar("trx_no_data_pack_mom", { length: 100 }),

    trx_others_m: varchar("trx_others_m", { length: 100 }),
    trx_others_contr: varchar("trx_others_contr", { length: 100 }),
    trx_others_mom: varchar("trx_others_mom", { length: 100 }),

    trx_all_m: varchar("trx_all_m", { length: 100 }),
    trx_total_mom: varchar("trx_total_mom", { length: 100 }),

    rev_core_m: varchar("rev_core_m", { length: 100 }),
    rev_core_contr: varchar("rev_core_contr", { length: 100 }),
    rev_core_mom: varchar("rev_core_mom", { length: 100 }),

    rev_acq_m: varchar("rev_acq_m", { length: 100 }),
    rev_acq_contr: varchar("rev_acq_contr", { length: 100 }),
    rev_acq_mom: varchar("rev_acq_mom", { length: 100 }),

    rev_cvm_m: varchar("rev_cvm_m", { length: 100 }),
    rev_cvm_contr: varchar("rev_cvm_contr", { length: 100 }),
    rev_cvm_mom: varchar("rev_cvm_mom", { length: 100 }),

    rev_pv_m: varchar("rev_pv_m", { length: 100 }),
    rev_pv_contr: varchar("rev_pv_contr", { length: 100 }),
    rev_pv_mom: varchar("rev_pv_mom", { length: 100 }),

    rev_no_data_pack_m: varchar("rev_no_data_pack_m", { length: 100 }),
    rev_no_data_pack_contr: varchar("rev_no_data_pack_contr", { length: 100 }),
    rev_no_data_pack_mom: varchar("rev_no_data_pack_mom", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),

    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_total_mom: varchar("rev_total_mom", { length: 100 }),
})

export const summarySoAllSubbranch = honaiPuma.table('summary_so_all_subbranch', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 200 }),

    trx_core_m: varchar("trx_core_m", { length: 100 }),
    trx_core_contr: varchar("trx_core_contr", { length: 100 }),
    trx_core_mom: varchar("trx_core_mom", { length: 100 }),

    trx_acq_m: varchar("trx_acq_m", { length: 100 }),
    trx_acq_contr: varchar("trx_acq_contr", { length: 100 }),
    trx_acq_mom: varchar("trx_acq_mom", { length: 100 }),

    trx_cvm_m: varchar("trx_cvm_m", { length: 100 }),
    trx_cvm_contr: varchar("trx_cvm_contr", { length: 100 }),
    trx_cvm_mom: varchar("trx_cvm_mom", { length: 100 }),

    trx_pv_m: varchar("trx_pv_m", { length: 100 }),
    trx_pv_contr: varchar("trx_pv_contr", { length: 100 }),
    trx_pv_mom: varchar("trx_pv_mom", { length: 100 }),

    trx_no_data_pack_m: varchar("trx_no_data_pack_m", { length: 100 }),
    trx_no_data_pack_contr: varchar("trx_no_data_pack_contr", { length: 100 }),
    trx_no_data_pack_mom: varchar("trx_no_data_pack_mom", { length: 100 }),

    trx_others_m: varchar("trx_others_m", { length: 100 }),
    trx_others_contr: varchar("trx_others_contr", { length: 100 }),
    trx_others_mom: varchar("trx_others_mom", { length: 100 }),

    trx_all_m: varchar("trx_all_m", { length: 100 }),
    trx_total_mom: varchar("trx_total_mom", { length: 100 }),

    rev_core_m: varchar("rev_core_m", { length: 100 }),
    rev_core_contr: varchar("rev_core_contr", { length: 100 }),
    rev_core_mom: varchar("rev_core_mom", { length: 100 }),

    rev_acq_m: varchar("rev_acq_m", { length: 100 }),
    rev_acq_contr: varchar("rev_acq_contr", { length: 100 }),
    rev_acq_mom: varchar("rev_acq_mom", { length: 100 }),

    rev_cvm_m: varchar("rev_cvm_m", { length: 100 }),
    rev_cvm_contr: varchar("rev_cvm_contr", { length: 100 }),
    rev_cvm_mom: varchar("rev_cvm_mom", { length: 100 }),

    rev_pv_m: varchar("rev_pv_m", { length: 100 }),
    rev_pv_contr: varchar("rev_pv_contr", { length: 100 }),
    rev_pv_mom: varchar("rev_pv_mom", { length: 100 }),

    rev_no_data_pack_m: varchar("rev_no_data_pack_m", { length: 100 }),
    rev_no_data_pack_contr: varchar("rev_no_data_pack_contr", { length: 100 }),
    rev_no_data_pack_mom: varchar("rev_no_data_pack_mom", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),

    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_total_mom: varchar("rev_total_mom", { length: 100 }),
})

export const summarySoAllCluster = honaiPuma.table('summary_so_all_cluster', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 200 }),
    cluster: varchar("cluster", { length: 200 }),

    trx_core_m: varchar("trx_core_m", { length: 100 }),
    trx_core_contr: varchar("trx_core_contr", { length: 100 }),
    trx_core_mom: varchar("trx_core_mom", { length: 100 }),

    trx_acq_m: varchar("trx_acq_m", { length: 100 }),
    trx_acq_contr: varchar("trx_acq_contr", { length: 100 }),
    trx_acq_mom: varchar("trx_acq_mom", { length: 100 }),

    trx_cvm_m: varchar("trx_cvm_m", { length: 100 }),
    trx_cvm_contr: varchar("trx_cvm_contr", { length: 100 }),
    trx_cvm_mom: varchar("trx_cvm_mom", { length: 100 }),

    trx_pv_m: varchar("trx_pv_m", { length: 100 }),
    trx_pv_contr: varchar("trx_pv_contr", { length: 100 }),
    trx_pv_mom: varchar("trx_pv_mom", { length: 100 }),

    trx_no_data_pack_m: varchar("trx_no_data_pack_m", { length: 100 }),
    trx_no_data_pack_contr: varchar("trx_no_data_pack_contr", { length: 100 }),
    trx_no_data_pack_mom: varchar("trx_no_data_pack_mom", { length: 100 }),

    trx_others_m: varchar("trx_others_m", { length: 100 }),
    trx_others_contr: varchar("trx_others_contr", { length: 100 }),
    trx_others_mom: varchar("trx_others_mom", { length: 100 }),

    trx_all_m: varchar("trx_all_m", { length: 100 }),
    trx_total_mom: varchar("trx_total_mom", { length: 100 }),

    rev_core_m: varchar("rev_core_m", { length: 100 }),
    rev_core_contr: varchar("rev_core_contr", { length: 100 }),
    rev_core_mom: varchar("rev_core_mom", { length: 100 }),

    rev_acq_m: varchar("rev_acq_m", { length: 100 }),
    rev_acq_contr: varchar("rev_acq_contr", { length: 100 }),
    rev_acq_mom: varchar("rev_acq_mom", { length: 100 }),

    rev_cvm_m: varchar("rev_cvm_m", { length: 100 }),
    rev_cvm_contr: varchar("rev_cvm_contr", { length: 100 }),
    rev_cvm_mom: varchar("rev_cvm_mom", { length: 100 }),

    rev_pv_m: varchar("rev_pv_m", { length: 100 }),
    rev_pv_contr: varchar("rev_pv_contr", { length: 100 }),
    rev_pv_mom: varchar("rev_pv_mom", { length: 100 }),

    rev_no_data_pack_m: varchar("rev_no_data_pack_m", { length: 100 }),
    rev_no_data_pack_contr: varchar("rev_no_data_pack_contr", { length: 100 }),
    rev_no_data_pack_mom: varchar("rev_no_data_pack_mom", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),

    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_total_mom: varchar("rev_total_mom", { length: 100 }),
})

export const summarySoAllKabupaten = honaiPuma.table('summary_so_all_kabupaten', {
    tgl: varchar("tgl", { length: 20 }),
    area: varchar("area", { length: 20 }),
    regional: varchar("regional", { length: 200 }),
    branch: varchar("branch", { length: 200 }),
    subbranch: varchar("subbranch", { length: 200 }),
    cluster: varchar("cluster", { length: 200 }),
    kabupaten: varchar("kabupaten", { length: 200 }),

    trx_core_m: varchar("trx_core_m", { length: 100 }),
    trx_core_contr: varchar("trx_core_contr", { length: 100 }),
    trx_core_mom: varchar("trx_core_mom", { length: 100 }),

    trx_acq_m: varchar("trx_acq_m", { length: 100 }),
    trx_acq_contr: varchar("trx_acq_contr", { length: 100 }),
    trx_acq_mom: varchar("trx_acq_mom", { length: 100 }),

    trx_cvm_m: varchar("trx_cvm_m", { length: 100 }),
    trx_cvm_contr: varchar("trx_cvm_contr", { length: 100 }),
    trx_cvm_mom: varchar("trx_cvm_mom", { length: 100 }),

    trx_pv_m: varchar("trx_pv_m", { length: 100 }),
    trx_pv_contr: varchar("trx_pv_contr", { length: 100 }),
    trx_pv_mom: varchar("trx_pv_mom", { length: 100 }),

    trx_no_data_pack_m: varchar("trx_no_data_pack_m", { length: 100 }),
    trx_no_data_pack_contr: varchar("trx_no_data_pack_contr", { length: 100 }),
    trx_no_data_pack_mom: varchar("trx_no_data_pack_mom", { length: 100 }),

    trx_others_m: varchar("trx_others_m", { length: 100 }),
    trx_others_contr: varchar("trx_others_contr", { length: 100 }),
    trx_others_mom: varchar("trx_others_mom", { length: 100 }),

    trx_all_m: varchar("trx_all_m", { length: 100 }),
    trx_total_mom: varchar("trx_total_mom", { length: 100 }),

    rev_core_m: varchar("rev_core_m", { length: 100 }),
    rev_core_contr: varchar("rev_core_contr", { length: 100 }),
    rev_core_mom: varchar("rev_core_mom", { length: 100 }),

    rev_acq_m: varchar("rev_acq_m", { length: 100 }),
    rev_acq_contr: varchar("rev_acq_contr", { length: 100 }),
    rev_acq_mom: varchar("rev_acq_mom", { length: 100 }),

    rev_cvm_m: varchar("rev_cvm_m", { length: 100 }),
    rev_cvm_contr: varchar("rev_cvm_contr", { length: 100 }),
    rev_cvm_mom: varchar("rev_cvm_mom", { length: 100 }),

    rev_pv_m: varchar("rev_pv_m", { length: 100 }),
    rev_pv_contr: varchar("rev_pv_contr", { length: 100 }),
    rev_pv_mom: varchar("rev_pv_mom", { length: 100 }),

    rev_no_data_pack_m: varchar("rev_no_data_pack_m", { length: 100 }),
    rev_no_data_pack_contr: varchar("rev_no_data_pack_contr", { length: 100 }),
    rev_no_data_pack_mom: varchar("rev_no_data_pack_mom", { length: 100 }),

    rev_others_m: varchar("rev_others_m", { length: 100 }),
    rev_others_contr: varchar("rev_others_contr", { length: 100 }),
    rev_others_mom: varchar("rev_others_mom", { length: 100 }),

    rev_all_m: varchar("rev_all_m", { length: 100 }),
    rev_total_mom: varchar("rev_total_mom", { length: 100 }),
})

export const summaryRevAllByLosRegional = honaiPuma.table('summary_rev_all_by_los_regional', {
    tgl: varchar('tgl', { length: 20 }),
    area: varchar('area', { length: 20 }),
    regional: varchar('regional', { length: 30 }),
    rev_all_m: varchar('rev_all_m', { length: 30 }),
    rev_all_mom: varchar('rev_all_mom', { length: 100 }),
    rev_all_absolut: varchar('rev_all_absolut', { length: 100 }),
    rev_all_yoy: varchar('rev_all_yoy', { length: 100 }),
    rev_all_ytd: varchar('rev_all_ytd', { length: 100 }),
    rev_all_qoq: varchar('rev_all_qoq', { length: 100 }),

    rev_existing_m: varchar('rev_existing_m', { length: 100 }),
    rev_existing_mom: varchar('rev_existing_mom', { length: 100 }),
    rev_existing_absolut: varchar('rev_existing_absolut', { length: 100 }),
    rev_existing_yoy: varchar('rev_existing_yoy', { length: 100 }),
    rev_existing_ytd: varchar('rev_existing_ytd', { length: 100 }),
    rev_existing_qoq: varchar('rev_existing_qoq', { length: 100 }),

    rev_new_sales_m: varchar('rev_new_sales_m', { length: 100 }),
    rev_new_sales_mom: varchar('rev_new_sales_mom', { length: 100 }),
    rev_new_sales_absolut: varchar('rev_new_sales_absolut', { length: 100 }),
    rev_new_sales_yoy: varchar('rev_new_sales_yoy', { length: 100 }),
    rev_new_sales_ytd: varchar('rev_new_sales_ytd', { length: 100 }),
    rev_new_sales_qoq: varchar('rev_new_sales_qoq', { length: 100 }),

    rev_bb_existing_m: varchar('rev_bb_existing_m', { length: 100 }),
    rev_bb_existing_mom: varchar('rev_bb_existing_mom', { length: 100 }),
    rev_bb_existing_absolut: varchar('rev_bb_existing_absolut', { length: 100 }),
    rev_bb_existing_yoy: varchar('rev_bb_existing_yoy', { length: 100 }),
    rev_bb_existing_ytd: varchar('rev_bb_existing_ytd', { length: 100 }),
    rev_bb_existing_qoq: varchar('rev_bb_existing_qoq', { length: 100 }),

    rev_voice_existing_m: varchar('rev_voice_existing_m', { length: 100 }),
    rev_voice_existing_mom: varchar('rev_voice_existing_mom', { length: 100 }),
    rev_voice_existing_absolut: varchar('rev_voice_existing_absolut', { length: 100 }),
    rev_voice_existing_yoy: varchar('rev_voice_existing_yoy', { length: 100 }),
    rev_voice_existing_ytd: varchar('rev_voice_existing_ytd', { length: 100 }),
    rev_voice_existing_qoq: varchar('rev_voice_existing_qoq', { length: 100 }),

    rev_digital_existing_m: varchar('rev_digital_existing_m', { length: 100 }),
    rev_digital_existing_mom: varchar('rev_digital_existing_mom', { length: 100 }),
    rev_digital_existing_absolut: varchar('rev_digital_existing_absolut', { length: 100 }),
    rev_digital_existing_yoy: varchar('rev_digital_existing_yoy', { length: 100 }),
    rev_digital_existing_ytd: varchar('rev_digital_existing_ytd', { length: 100 }),
    rev_digital_existing_qoq: varchar('rev_digital_existing_qoq', { length: 100 }),

    rev_bb_new_sales_m: varchar('rev_bb_new_sales_m', { length: 100 }),
    rev_bb_new_sales_mom: varchar('rev_bb_new_sales_mom', { length: 100 }),
    rev_bb_new_sales_absolut: varchar('rev_bb_new_sales_absolut', { length: 100 }),
    rev_bb_new_sales_yoy: varchar('rev_bb_new_sales_yoy', { length: 100 }),
    rev_bb_new_sales_ytd: varchar('rev_bb_new_sales_ytd', { length: 100 }),
    rev_bb_new_sales_qoq: varchar('rev_bb_new_sales_qoq', { length: 100 }),

    rev_voice_new_sales_m: varchar('rev_voice_new_sales_m', { length: 100 }),
    rev_voice_new_sales_mom: varchar('rev_voice_new_sales_mom', { length: 100 }),
    rev_voice_new_sales_absolut: varchar('rev_voice_new_sales_absolut', { length: 100 }),
    rev_voice_new_sales_yoy: varchar('rev_voice_new_sales_yoy', { length: 100 }),
    rev_voice_new_sales_ytd: varchar('rev_voice_new_sales_ytd', { length: 100 }),
    rev_voice_new_sales_qoq: varchar('rev_voice_new_sales_qoq', { length: 100 }),

    rev_digital_new_sales_m: varchar('rev_digital_new_sales_m', { length: 100 }),
    rev_digital_new_sales_mom: varchar('rev_digital_new_sales_mom', { length: 100 }),
    rev_digital_new_sales_absolut: varchar('rev_digital_new_sales_absolut', { length: 100 }),
    rev_digital_new_sales_yoy: varchar('rev_digital_new_sales_yoy', { length: 100 }),
    rev_digital_new_sales_ytd: varchar('rev_digital_new_sales_ytd', { length: 100 }),
    rev_digital_new_sales_qoq: varchar('rev_digital_new_sales_qoq', { length: 100 }),
});

export const summaryRevAllByLosBranch = honaiPuma.table('summary_rev_all_by_los_branch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),

    rev_all_m: decimal('rev_all_m', { precision: 19, scale: 0 }),
    rev_all_mom: decimal('rev_all_mom', { precision: 19, scale: 2 }),
    rev_all_absolut: decimal('rev_all_absolut', { precision: 19, scale: 0 }),
    rev_all_yoy: decimal('rev_all_yoy', { precision: 19, scale: 2 }),
    rev_all_ytd: decimal('rev_all_ytd', { precision: 19, scale: 2 }),
    rev_all_qoq: decimal('rev_all_qoq', { precision: 19, scale: 2 }),

    rev_existing_m: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    rev_existing_mom: decimal('rev_existing_mom', { precision: 19, scale: 2 }),
    rev_existing_absolut: decimal('rev_existing_absolut', { precision: 19, scale: 0 }),
    rev_existing_yoy: decimal('rev_existing_yoy', { precision: 19, scale: 2 }),
    rev_existing_ytd: decimal('rev_existing_ytd', { precision: 19, scale: 2 }),
    rev_existing_qoq: decimal('rev_existing_qoq', { precision: 19, scale: 2 }),

    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 2 }),
    rev_new_sales_absolut: decimal('rev_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_new_sales_qoq: decimal('rev_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_bb_existing_m: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    rev_bb_existing_mom: decimal('rev_bb_existing_mom', { precision: 19, scale: 2 }),
    rev_bb_existing_absolut: decimal('rev_bb_existing_absolut', { precision: 19, scale: 0 }),
    rev_bb_existing_yoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 2 }),
    rev_bb_existing_ytd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 2 }),
    rev_bb_existing_qoq: decimal('rev_bb_existing_qoq', { precision: 19, scale: 2 }),

    rev_voice_existing_m: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    rev_voice_existing_mom: decimal('rev_voice_existing_mom', { precision: 19, scale: 2 }),
    rev_voice_existing_absolut: decimal('rev_voice_existing_absolut', { precision: 19, scale: 0 }),
    rev_voice_existing_yoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 2 }),
    rev_voice_existing_ytd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 2 }),
    rev_voice_existing_qoq: decimal('rev_voice_existing_qoq', { precision: 19, scale: 2 }),

    rev_digital_existing_m: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    rev_digital_existing_mom: decimal('rev_digital_existing_mom', { precision: 19, scale: 2 }),
    rev_digital_existing_absolut: decimal('rev_digital_existing_absolut', { precision: 19, scale: 0 }),
    rev_digital_existing_yoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 2 }),
    rev_digital_existing_ytd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 2 }),
    rev_digital_existing_qoq: decimal('rev_digital_existing_qoq', { precision: 19, scale: 2 }),

    rev_bb_new_sales_m: decimal('rev_bb_new_sales_m', { precision: 19, scale: 0 }),
    rev_bb_new_sales_mom: decimal('rev_bb_new_sales_mom', { precision: 19, scale: 2 }),
    rev_bb_new_sales_absolut: decimal('rev_bb_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_bb_new_sales_yoy: decimal('rev_bb_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_bb_new_sales_ytd: decimal('rev_bb_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_bb_new_sales_qoq: decimal('rev_bb_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_voice_new_sales_m: decimal('rev_voice_new_sales_m', { precision: 19, scale: 0 }),
    rev_voice_new_sales_mom: decimal('rev_voice_new_sales_mom', { precision: 19, scale: 2 }),
    rev_voice_new_sales_absolut: decimal('rev_voice_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_voice_new_sales_yoy: decimal('rev_voice_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_voice_new_sales_ytd: decimal('rev_voice_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_voice_new_sales_qoq: decimal('rev_voice_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_digital_new_sales_m: decimal('rev_digital_new_sales_m', { precision: 19, scale: 0 }),
    rev_digital_new_sales_mom: decimal('rev_digital_new_sales_mom', { precision: 19, scale: 2 }),
    rev_digital_new_sales_absolut: decimal('rev_digital_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_digital_new_sales_yoy: decimal('rev_digital_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_digital_new_sales_ytd: decimal('rev_digital_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_digital_new_sales_qoq: decimal('rev_digital_new_sales_qoq', { precision: 19, scale: 2 }),
});

export const summaryRevAllByLosSubbranch = honaiPuma.table('summary_rev_all_by_los_subbranch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),

    rev_all_m: decimal('rev_all_m', { precision: 19, scale: 0 }),
    rev_all_mom: decimal('rev_all_mom', { precision: 19, scale: 2 }),
    rev_all_absolut: decimal('rev_all_absolut', { precision: 19, scale: 0 }),
    rev_all_yoy: decimal('rev_all_yoy', { precision: 19, scale: 2 }),
    rev_all_ytd: decimal('rev_all_ytd', { precision: 19, scale: 2 }),
    rev_all_qoq: decimal('rev_all_qoq', { precision: 19, scale: 2 }),

    rev_existing_m: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    rev_existing_mom: decimal('rev_existing_mom', { precision: 19, scale: 2 }),
    rev_existing_absolut: decimal('rev_existing_absolut', { precision: 19, scale: 0 }),
    rev_existing_yoy: decimal('rev_existing_yoy', { precision: 19, scale: 2 }),
    rev_existing_ytd: decimal('rev_existing_ytd', { precision: 19, scale: 2 }),
    rev_existing_qoq: decimal('rev_existing_qoq', { precision: 19, scale: 2 }),

    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 2 }),
    rev_new_sales_absolut: decimal('rev_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_new_sales_qoq: decimal('rev_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_bb_existing_m: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    rev_bb_existing_mom: decimal('rev_bb_existing_mom', { precision: 19, scale: 2 }),
    rev_bb_existing_absolut: decimal('rev_bb_existing_absolut', { precision: 19, scale: 0 }),
    rev_bb_existing_yoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 2 }),
    rev_bb_existing_ytd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 2 }),
    rev_bb_existing_qoq: decimal('rev_bb_existing_qoq', { precision: 19, scale: 2 }),

    rev_voice_existing_m: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    rev_voice_existing_mom: decimal('rev_voice_existing_mom', { precision: 19, scale: 2 }),
    rev_voice_existing_absolut: decimal('rev_voice_existing_absolut', { precision: 19, scale: 0 }),
    rev_voice_existing_yoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 2 }),
    rev_voice_existing_ytd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 2 }),
    rev_voice_existing_qoq: decimal('rev_voice_existing_qoq', { precision: 19, scale: 2 }),

    rev_digital_existing_m: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    rev_digital_existing_mom: decimal('rev_digital_existing_mom', { precision: 19, scale: 2 }),
    rev_digital_existing_absolut: decimal('rev_digital_existing_absolut', { precision: 19, scale: 0 }),
    rev_digital_existing_yoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 2 }),
    rev_digital_existing_ytd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 2 }),
    rev_digital_existing_qoq: decimal('rev_digital_existing_qoq', { precision: 19, scale: 2 }),

    rev_bb_new_sales_m: decimal('rev_bb_new_sales_m', { precision: 19, scale: 0 }),
    rev_bb_new_sales_mom: decimal('rev_bb_new_sales_mom', { precision: 19, scale: 2 }),
    rev_bb_new_sales_absolut: decimal('rev_bb_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_bb_new_sales_yoy: decimal('rev_bb_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_bb_new_sales_ytd: decimal('rev_bb_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_bb_new_sales_qoq: decimal('rev_bb_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_voice_new_sales_m: decimal('rev_voice_new_sales_m', { precision: 19, scale: 0 }),
    rev_voice_new_sales_mom: decimal('rev_voice_new_sales_mom', { precision: 19, scale: 2 }),
    rev_voice_new_sales_absolut: decimal('rev_voice_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_voice_new_sales_yoy: decimal('rev_voice_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_voice_new_sales_ytd: decimal('rev_voice_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_voice_new_sales_qoq: decimal('rev_voice_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_digital_new_sales_m: decimal('rev_digital_new_sales_m', { precision: 19, scale: 0 }),
    rev_digital_new_sales_mom: decimal('rev_digital_new_sales_mom', { precision: 19, scale: 2 }),
    rev_digital_new_sales_absolut: decimal('rev_digital_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_digital_new_sales_yoy: decimal('rev_digital_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_digital_new_sales_ytd: decimal('rev_digital_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_digital_new_sales_qoq: decimal('rev_digital_new_sales_qoq', { precision: 19, scale: 2 }),
});

export const summaryRevAllByLosCluster = honaiPuma.table('summary_rev_all_by_los_cluster', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),
    cluster: varchar('cluster', { length: 100 }),

    rev_all_m: decimal('rev_all_m', { precision: 19, scale: 0 }),
    rev_all_mom: decimal('rev_all_mom', { precision: 19, scale: 2 }),
    rev_all_absolut: decimal('rev_all_absolut', { precision: 19, scale: 0 }),
    rev_all_yoy: decimal('rev_all_yoy', { precision: 19, scale: 2 }),
    rev_all_ytd: decimal('rev_all_ytd', { precision: 19, scale: 2 }),
    rev_all_qoq: decimal('rev_all_qoq', { precision: 19, scale: 2 }),

    rev_existing_m: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    rev_existing_mom: decimal('rev_existing_mom', { precision: 19, scale: 2 }),
    rev_existing_absolut: decimal('rev_existing_absolut', { precision: 19, scale: 0 }),
    rev_existing_yoy: decimal('rev_existing_yoy', { precision: 19, scale: 2 }),
    rev_existing_ytd: decimal('rev_existing_ytd', { precision: 19, scale: 2 }),
    rev_existing_qoq: decimal('rev_existing_qoq', { precision: 19, scale: 2 }),

    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 2 }),
    rev_new_sales_absolut: decimal('rev_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_new_sales_qoq: decimal('rev_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_bb_existing_m: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    rev_bb_existing_mom: decimal('rev_bb_existing_mom', { precision: 19, scale: 2 }),
    rev_bb_existing_absolut: decimal('rev_bb_existing_absolut', { precision: 19, scale: 0 }),
    rev_bb_existing_yoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 2 }),
    rev_bb_existing_ytd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 2 }),
    rev_bb_existing_qoq: decimal('rev_bb_existing_qoq', { precision: 19, scale: 2 }),

    rev_voice_existing_m: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    rev_voice_existing_mom: decimal('rev_voice_existing_mom', { precision: 19, scale: 2 }),
    rev_voice_existing_absolut: decimal('rev_voice_existing_absolut', { precision: 19, scale: 0 }),
    rev_voice_existing_yoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 2 }),
    rev_voice_existing_ytd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 2 }),
    rev_voice_existing_qoq: decimal('rev_voice_existing_qoq', { precision: 19, scale: 2 }),

    rev_digital_existing_m: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    rev_digital_existing_mom: decimal('rev_digital_existing_mom', { precision: 19, scale: 2 }),
    rev_digital_existing_absolut: decimal('rev_digital_existing_absolut', { precision: 19, scale: 0 }),
    rev_digital_existing_yoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 2 }),
    rev_digital_existing_ytd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 2 }),
    rev_digital_existing_qoq: decimal('rev_digital_existing_qoq', { precision: 19, scale: 2 }),

    rev_bb_new_sales_m: decimal('rev_bb_new_sales_m', { precision: 19, scale: 0 }),
    rev_bb_new_sales_mom: decimal('rev_bb_new_sales_mom', { precision: 19, scale: 2 }),
    rev_bb_new_sales_absolut: decimal('rev_bb_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_bb_new_sales_yoy: decimal('rev_bb_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_bb_new_sales_ytd: decimal('rev_bb_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_bb_new_sales_qoq: decimal('rev_bb_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_voice_new_sales_m: decimal('rev_voice_new_sales_m', { precision: 19, scale: 0 }),
    rev_voice_new_sales_mom: decimal('rev_voice_new_sales_mom', { precision: 19, scale: 2 }),
    rev_voice_new_sales_absolut: decimal('rev_voice_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_voice_new_sales_yoy: decimal('rev_voice_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_voice_new_sales_ytd: decimal('rev_voice_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_voice_new_sales_qoq: decimal('rev_voice_new_sales_qoq', { precision: 19, scale: 2 }),

    rev_digital_new_sales_m: decimal('rev_digital_new_sales_m', { precision: 19, scale: 0 }),
    rev_digital_new_sales_mom: decimal('rev_digital_new_sales_mom', { precision: 19, scale: 2 }),
    rev_digital_new_sales_absolut: decimal('rev_digital_new_sales_absolut', { precision: 19, scale: 0 }),
    rev_digital_new_sales_yoy: decimal('rev_digital_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_digital_new_sales_ytd: decimal('rev_digital_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_digital_new_sales_qoq: decimal('rev_digital_new_sales_qoq', { precision: 19, scale: 2 }),
});

export const summaryRevAllByLosKabupaten = honaiPuma.table('summary_rev_all_by_los_kabupaten', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),
    cluster: varchar('cluster', { length: 100 }),
    kabupaten: varchar('kabupaten', { length: 100 }),

    // rev_all fields
    revAllM: decimal('rev_all_m', { precision: 19, scale: 0 }),
    revAllM1: decimal('rev_all_m1', { precision: 19, scale: 0 }),
    revAllM12: decimal('rev_all_m12', { precision: 19, scale: 0 }),
    revAllY: decimal('rev_all_y', { precision: 19, scale: 0 }),
    revAllY1: decimal('rev_all_y1', { precision: 19, scale: 0 }),
    revAllQ: decimal('rev_all_q', { precision: 19, scale: 0 }),
    revAllQ1: decimal('rev_all_q1', { precision: 19, scale: 0 }),
    revAllMom: decimal('rev_all_mom', { precision: 19, scale: 2 }),
    revAllAbsolut: decimal('rev_all_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    revAllYoy: decimal('rev_all_yoy', { precision: 19, scale: 2 }),
    revAllYtd: decimal('rev_all_ytd', { precision: 19, scale: 2 }),
    revAllQoq: decimal('rev_all_qoq', { precision: 19, scale: 2 }),

    // rev_existing fields
    revExistingM: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    revExistingM1: decimal('rev_existing_m1', { precision: 19, scale: 0 }),
    revExistingM12: decimal('rev_existing_m12', { precision: 19, scale: 0 }),
    revExistingY: decimal('rev_existing_y', { precision: 19, scale: 0 }),
    revExistingY1: decimal('rev_existing_y1', { precision: 19, scale: 0 }),
    revExistingQ: decimal('rev_existing_q', { precision: 19, scale: 0 }),
    revExistingQ1: decimal('rev_existing_q1', { precision: 19, scale: 0 }),
    revExistingMom: decimal('rev_existing_mom', { precision: 19, scale: 2 }),
    revExistingAbsolut: decimal('rev_existing_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    revExistingYoy: decimal('rev_existing_yoy', { precision: 19, scale: 2 }),
    revExistingYtd: decimal('rev_existing_ytd', { precision: 19, scale: 2 }),
    revExistingQoq: decimal('rev_existing_qoq', { precision: 19, scale: 2 }),

    // rev_new_sales fields
    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_m1: decimal('rev_new_sales_m1', { precision: 19, scale: 0 }),
    rev_new_sales_m12: decimal('rev_new_sales_m12', { precision: 19, scale: 0 }),
    rev_new_sales_y: decimal('rev_new_sales_y', { precision: 19, scale: 0 }),
    rev_new_sales_y1: decimal('rev_new_sales_y1', { precision: 19, scale: 0 }),
    rev_new_sales_q: decimal('rev_new_sales_q', { precision: 19, scale: 0 }),
    rev_new_sales_q1: decimal('rev_new_sales_q1', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 2 }),
    rev_new_sales_absolut: decimal('rev_new_sales_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 2 }),
    rev_new_sales_qoq: decimal('rev_new_sales_qoq', { precision: 19, scale: 2 }),

    // rev_bb_existing fields
    revBbExistingM: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    revBbExistingM1: decimal('rev_bb_existing_m1', { precision: 19, scale: 0 }),
    revBbExistingM12: decimal('rev_bb_existing_m12', { precision: 19, scale: 0 }),
    revBbExistingY: decimal('rev_bb_existing_y', { precision: 19, scale: 0 }),
    revBbExistingY1: decimal('rev_bb_existing_y1', { precision: 19, scale: 0 }),
    revBbExistingQ: decimal('rev_bb_existing_q', { precision: 19, scale: 0 }),
    revBbExistingQ1: decimal('rev_bb_existing_q1', { precision: 19, scale: 0 }),
    revBbExistingMom: decimal('rev_bb_existing_mom', { precision: 19, scale: 2 }),
    revBbExistingAbsolut: decimal('rev_bb_existing_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    revBbExistingYoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 2 }),
    revBbExistingYtd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 2 }),
    revBbExistingQoq: decimal('rev_bb_existing_qoq', { precision: 19, scale: 2 }),

    // rev_voice_existing fields
    revVoiceExistingM: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    revVoiceExistingM1: decimal('rev_voice_existing_m1', { precision: 19, scale: 0 }),
    revVoiceExistingM12: decimal('rev_voice_existing_m12', { precision: 19, scale: 0 }),
    revVoiceExistingY: decimal('rev_voice_existing_y', { precision: 19, scale: 0 }),
    revVoiceExistingY1: decimal('rev_voice_existing_y1', { precision: 19, scale: 0 }),
    revVoiceExistingQ: decimal('rev_voice_existing_q', { precision: 19, scale: 0 }),
    revVoiceExistingQ1: decimal('rev_voice_existing_q1', { precision: 19, scale: 0 }),
    revVoiceExistingMom: decimal('rev_voice_existing_mom', { precision: 19, scale: 2 }),
    revVoiceExistingAbsolut: decimal('rev_voice_existing_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    revVoiceExistingYoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 2 }),
    revVoiceExistingYtd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 2 }),
    revVoiceExistingQoq: decimal('rev_voice_existing_qoq', { precision: 19, scale: 2 }),

    // rev_digital_existing fields
    revDigitalExistingM: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    revDigitalExistingM1: decimal('rev_digital_existing_m1', { precision: 19, scale: 0 }),
    revDigitalExistingM12: decimal('rev_digital_existing_m12', { precision: 19, scale: 0 }),
    revDigitalExistingY: decimal('rev_digital_existing_y', { precision: 19, scale: 0 }),
    revDigitalExistingY1: decimal('rev_digital_existing_y1', { precision: 19, scale: 0 }),
    revDigitalExistingQ: decimal('rev_digital_existing_q', { precision: 19, scale: 0 }),
    revDigitalExistingQ1: decimal('rev_digital_existing_q1', { precision: 19, scale: 0 }),
    revDigitalExistingMom: decimal('rev_digital_existing_mom', { precision: 19, scale: 2 }),
    revDigitalExistingAbsolut: decimal('rev_digital_existing_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    revDigitalExistingYoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 2 }),
    revDigitalExistingYtd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 2 }),
    revDigitalExistingQoq: decimal('rev_digital_existing_qoq', { precision: 19, scale: 2 }),

    // rev_bb_new_sales fields
    revBbNewSalesM: decimal('rev_bb_new_sales_m', { precision: 19, scale: 0 }),
    revBbNewSalesM1: decimal('rev_bb_new_sales_m1', { precision: 19, scale: 0 }),
    revBbNewSalesM12: decimal('rev_bb_new_sales_m12', { precision: 19, scale: 0 }),
    revBbNewSalesY: decimal('rev_bb_new_sales_y', { precision: 19, scale: 0 }),
    revBbNewSalesY1: decimal('rev_bb_new_sales_y1', { precision: 19, scale: 0 }),
    revBbNewSalesQ: decimal('rev_bb_new_sales_q', { precision: 19, scale: 0 }),
    revBbNewSalesQ1: decimal('rev_bb_new_sales_q1', { precision: 19, scale: 0 }),
    revBbNewSalesMom: decimal('rev_bb_new_sales_mom', { precision: 19, scale: 2 }),
    revBbNewSalesAbsolut: decimal('rev_bb_new_sales_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    revBbNewSalesYoy: decimal('rev_bb_new_sales_yoy', { precision: 19, scale: 2 }),
    revBbNewSalesYtd: decimal('rev_bb_new_sales_ytd', { precision: 19, scale: 2 }),
    revBbNewSalesQoq: decimal('rev_bb_new_sales_qoq', { precision: 19, scale: 2 }),

    // rev_voice_new_sales fields
    revVoiceNewSalesM: decimal('rev_voice_new_sales_m', { precision: 19, scale: 0 }),
    revVoiceNewSalesM1: decimal('rev_voice_new_sales_m1', { precision: 19, scale: 0 }),
    revVoiceNewSalesM12: decimal('rev_voice_new_sales_m12', { precision: 19, scale: 0 }),
    revVoiceNewSalesY: decimal('rev_voice_new_sales_y', { precision: 19, scale: 0 }),
    revVoiceNewSalesY1: decimal('rev_voice_new_sales_y1', { precision: 19, scale: 0 }),
    revVoiceNewSalesQ: decimal('rev_voice_new_sales_q', { precision: 19, scale: 0 }),
    revVoiceNewSalesQ1: decimal('rev_voice_new_sales_q1', { precision: 19, scale: 0 }),
    revVoiceNewSalesMom: decimal('rev_voice_new_sales_mom', { precision: 19, scale: 2 }),
    revVoiceNewSalesAbsolut: decimal('rev_voice_new_sales_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    revVoiceNewSalesYoy: decimal('rev_voice_new_sales_yoy', { precision: 19, scale: 2 }),
    revVoiceNewSalesYtd: decimal('rev_voice_new_sales_ytd', { precision: 19, scale: 2 }),
    revVoiceNewSalesQoq: decimal('rev_voice_new_sales_qoq', { precision: 19, scale: 2 }),

    // rev_digital_new_sales fields
    revDigitalNewSalesM: decimal('rev_digital_new_sales_m', { precision: 19, scale: 0 }),
    revDigitalNewSalesM1: decimal('rev_digital_new_sales_m1', { precision: 19, scale: 0 }),
    revDigitalNewSalesM12: decimal('rev_digital_new_sales_m12', { precision: 19, scale: 0 }),
    revDigitalNewSalesY: decimal('rev_digital_new_sales_y', { precision: 19, scale: 0 }),
    revDigitalNewSalesY1: decimal('rev_digital_new_sales_y1', { precision: 19, scale: 0 }),
    revDigitalNewSalesQ: decimal('rev_digital_new_sales_q', { precision: 19, scale: 0 }),
    revDigitalNewSalesQ1: decimal('rev_digital_new_sales_q1', { precision: 19, scale: 0 }),
    revDigitalNewSalesMom: decimal('rev_digital_new_sales_mom', { precision: 19, scale: 2 }),
    revDigitalNewSalesAbsolut: decimal('rev_digital_new_sales_absolut', { precision: 19, scale: 0 }), // Changed scale to 0 based on provided SQL
    revDigitalNewSalesYoy: decimal('rev_digital_new_sales_yoy', { precision: 19, scale: 2 }),
    revDigitalNewSalesYtd: decimal('rev_digital_new_sales_ytd', { precision: 19, scale: 2 }),
    revDigitalNewSalesQoq: decimal('rev_digital_new_sales_qoq', { precision: 19, scale: 2 }),
}, (table) => {
    return {
        areaIdx: index('area').on(table.area),
        branchIdx: index('branch').on(table.branch),
        clusterIdx: index('cluster').on(table.cluster),
        kabupatenIdx: index('kabupaten').on(table.kabupaten),
        regionalIdx: index('regional').on(table.regional),
        subbranchIdx: index('subbranch').on(table.subbranch),
        tglIdx: index('tgl').on(table.tgl),
    };
});

export const summaryRevByuByLosRegional = honaiPuma.table('summary_rev_byu_by_los_regional', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    rev_all_m: decimal('rev_all_m', { precision: 19, scale: 0 }),
    rev_all_mom: decimal('rev_all_mom', { precision: 19, scale: 0 }),
    rev_all_yoy: decimal('rev_all_yoy', { precision: 19, scale: 0 }),
    rev_all_ytd: decimal('rev_all_ytd', { precision: 19, scale: 0 }),

    rev_existing_m: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    rev_existing_mom: decimal('rev_existing_mom', { precision: 19, scale: 0 }),
    rev_existing_yoy: decimal('rev_existing_yoy', { precision: 19, scale: 0 }),
    rev_existing_ytd: decimal('rev_existing_ytd', { precision: 19, scale: 0 }),

    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 0 }),
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 0 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 0 }),

    rev_bb_existing_m: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    rev_bb_existing_mom: decimal('rev_bb_existing_mom', { precision: 19, scale: 0 }),
    rev_bb_existing_yoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 0 }),
    rev_bb_existing_ytd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 0 }),

    rev_voice_existing_m: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    rev_voice_existing_mom: decimal('rev_voice_existing_mom', { precision: 19, scale: 0 }),
    rev_voice_existing_yoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 0 }),
    rev_voice_existing_ytd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 0 }),

    rev_digital_existing_m: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    rev_digital_existing_mom: decimal('rev_digital_existing_mom', { precision: 19, scale: 0 }),
    rev_digital_existing_yoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 0 }),
    rev_digital_existing_ytd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 0 }),
});

export const summaryRevByuByLosBranch = honaiPuma.table('summary_rev_byu_by_los_branch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    rev_all_m: decimal('rev_all_m', { precision: 19, scale: 0 }),
    rev_all_mom: decimal('rev_all_mom', { precision: 19, scale: 0 }),
    rev_all_yoy: decimal('rev_all_yoy', { precision: 19, scale: 0 }),
    rev_all_ytd: decimal('rev_all_ytd', { precision: 19, scale: 0 }),

    rev_existing_m: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    rev_existing_mom: decimal('rev_existing_mom', { precision: 19, scale: 0 }),
    rev_existing_yoy: decimal('rev_existing_yoy', { precision: 19, scale: 0 }),
    rev_existing_ytd: decimal('rev_existing_ytd', { precision: 19, scale: 0 }),

    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 0 }),
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 0 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 0 }),

    rev_bb_existing_m: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    rev_bb_existing_mom: decimal('rev_bb_existing_mom', { precision: 19, scale: 0 }),
    rev_bb_existing_yoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 0 }),
    rev_bb_existing_ytd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 0 }),

    rev_voice_existing_m: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    rev_voice_existing_mom: decimal('rev_voice_existing_mom', { precision: 19, scale: 0 }),
    rev_voice_existing_yoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 0 }),
    rev_voice_existing_ytd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 0 }),

    rev_digital_existing_m: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    rev_digital_existing_mom: decimal('rev_digital_existing_mom', { precision: 19, scale: 0 }),
    rev_digital_existing_yoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 0 }),
    rev_digital_existing_ytd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 0 }),
});

export const summaryRevByuByLosSubbranch = honaiPuma.table('summary_rev_byu_by_los_subbranch', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),
    rev_all_m: decimal('rev_all_m', { precision: 19, scale: 0 }),
    rev_all_mom: decimal('rev_all_mom', { precision: 19, scale: 0 }),
    rev_all_yoy: decimal('rev_all_yoy', { precision: 19, scale: 0 }),
    rev_all_ytd: decimal('rev_all_ytd', { precision: 19, scale: 0 }),

    rev_existing_m: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    rev_existing_mom: decimal('rev_existing_mom', { precision: 19, scale: 0 }),
    rev_existing_yoy: decimal('rev_existing_yoy', { precision: 19, scale: 0 }),
    rev_existing_ytd: decimal('rev_existing_ytd', { precision: 19, scale: 0 }),

    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 0 }),
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 0 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 0 }),

    rev_bb_existing_m: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    rev_bb_existing_mom: decimal('rev_bb_existing_mom', { precision: 19, scale: 0 }),
    rev_bb_existing_yoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 0 }),
    rev_bb_existing_ytd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 0 }),

    rev_voice_existing_m: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    rev_voice_existing_mom: decimal('rev_voice_existing_mom', { precision: 19, scale: 0 }),
    rev_voice_existing_yoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 0 }),
    rev_voice_existing_ytd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 0 }),

    rev_digital_existing_m: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    rev_digital_existing_mom: decimal('rev_digital_existing_mom', { precision: 19, scale: 0 }),
    rev_digital_existing_yoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 0 }),
    rev_digital_existing_ytd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 0 }),
});

export const summaryRevByuByLosCluster = honaiPuma.table('summary_rev_byu_by_los_cluster', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),
    cluster: varchar('cluster', { length: 100 }),
    rev_all_m: decimal('rev_all_m', { precision: 19, scale: 0 }),
    rev_all_mom: decimal('rev_all_mom', { precision: 19, scale: 0 }),
    rev_all_yoy: decimal('rev_all_yoy', { precision: 19, scale: 0 }),
    rev_all_ytd: decimal('rev_all_ytd', { precision: 19, scale: 0 }),

    rev_existing_m: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    rev_existing_mom: decimal('rev_existing_mom', { precision: 19, scale: 0 }),
    rev_existing_yoy: decimal('rev_existing_yoy', { precision: 19, scale: 0 }),
    rev_existing_ytd: decimal('rev_existing_ytd', { precision: 19, scale: 0 }),

    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 0 }),
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 0 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 0 }),

    rev_bb_existing_m: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    rev_bb_existing_mom: decimal('rev_bb_existing_mom', { precision: 19, scale: 0 }),
    rev_bb_existing_yoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 0 }),
    rev_bb_existing_ytd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 0 }),

    rev_voice_existing_m: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    rev_voice_existing_mom: decimal('rev_voice_existing_mom', { precision: 19, scale: 0 }),
    rev_voice_existing_yoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 0 }),
    rev_voice_existing_ytd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 0 }),

    rev_digital_existing_m: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    rev_digital_existing_mom: decimal('rev_digital_existing_mom', { precision: 19, scale: 0 }),
    rev_digital_existing_yoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 0 }),
    rev_digital_existing_ytd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 0 }),
});

export const summaryRevByuByLosKabupaten = honaiPuma.table('summary_rev_byu_by_los_kabupaten', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 100 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    subbranch: varchar('subbranch', { length: 100 }),
    cluster: varchar('cluster', { length: 100 }),
    kabupaten: varchar('kabupaten', { length: 100 }),

    // rev_all fields
    revAllM: decimal('rev_all_m', { precision: 19, scale: 0 }),
    revAllM1: decimal('rev_all_m1', { precision: 19, scale: 0 }),
    revAllM12: decimal('rev_all_m12', { precision: 19, scale: 0 }),
    revAllY: decimal('rev_all_y', { precision: 19, scale: 0 }),
    revAllY1: decimal('rev_all_y1', { precision: 19, scale: 0 }),
    revAllMom: decimal('rev_all_mom', { precision: 19, scale: 2 }),
    revAllYoy: decimal('rev_all_yoy', { precision: 19, scale: 2 }),
    revAllYtd: decimal('rev_all_ytd', { precision: 19, scale: 2 }),

    // rev_existing fields
    revExistingM: decimal('rev_existing_m', { precision: 19, scale: 0 }),
    revExistingM1: decimal('rev_existing_m1', { precision: 19, scale: 0 }),
    revExistingM12: decimal('rev_existing_m12', { precision: 19, scale: 0 }),
    revExistingY: decimal('rev_existing_y', { precision: 19, scale: 0 }),
    revExistingY1: decimal('rev_existing_y1', { precision: 19, scale: 0 }),
    revExistingMom: decimal('rev_existing_mom', { precision: 19, scale: 2 }),
    revExistingYoy: decimal('rev_existing_yoy', { precision: 19, scale: 2 }),
    revExistingYtd: decimal('rev_existing_ytd', { precision: 19, scale: 2 }),

    // rev_new_sales fields
    rev_new_sales_m: decimal('rev_new_sales_m', { precision: 19, scale: 0 }),
    rev_new_sales_m1: decimal('rev_new_sales_m1', { precision: 19, scale: 0 }),
    rev_new_sales_m12: decimal('rev_new_sales_m12', { precision: 19, scale: 0 }),
    rev_new_sales_y: decimal('rev_new_sales_y', { precision: 19, scale: 0 }),
    rev_new_sales_y1: decimal('rev_new_sales_y1', { precision: 19, scale: 0 }),
    rev_new_sales_mom: decimal('rev_new_sales_mom', { precision: 19, scale: 2 }),
    rev_new_sales_yoy: decimal('rev_new_sales_yoy', { precision: 19, scale: 2 }),
    rev_new_sales_ytd: decimal('rev_new_sales_ytd', { precision: 19, scale: 2 }),

    // rev_bb_existing fields
    revBbExistingM: decimal('rev_bb_existing_m', { precision: 19, scale: 0 }),
    revBbExistingM1: decimal('rev_bb_existing_m1', { precision: 19, scale: 0 }),
    revBbExistingM12: decimal('rev_bb_existing_m12', { precision: 19, scale: 0 }),
    revBbExistingY: decimal('rev_bb_existing_y', { precision: 19, scale: 0 }),
    revBbExistingY1: decimal('rev_bb_existing_y1', { precision: 19, scale: 0 }),
    revBbExistingMom: decimal('rev_bb_existing_mom', { precision: 19, scale: 2 }),
    revBbExistingYoy: decimal('rev_bb_existing_yoy', { precision: 19, scale: 2 }),
    revBbExistingYtd: decimal('rev_bb_existing_ytd', { precision: 19, scale: 2 }),

    // rev_voice_existing fields
    revVoiceExistingM: decimal('rev_voice_existing_m', { precision: 19, scale: 0 }),
    revVoiceExistingM1: decimal('rev_voice_existing_m1', { precision: 19, scale: 0 }),
    revVoiceExistingM12: decimal('rev_voice_existing_m12', { precision: 19, scale: 0 }),
    revVoiceExistingY: decimal('rev_voice_existing_y', { precision: 19, scale: 0 }),
    revVoiceExistingY1: decimal('rev_voice_existing_y1', { precision: 19, scale: 0 }),
    revVoiceExistingMom: decimal('rev_voice_existing_mom', { precision: 19, scale: 2 }),
    revVoiceExistingYoy: decimal('rev_voice_existing_yoy', { precision: 19, scale: 2 }),
    revVoiceExistingYtd: decimal('rev_voice_existing_ytd', { precision: 19, scale: 2 }),

    // rev_digital_existing fields
    revDigitalExistingM: decimal('rev_digital_existing_m', { precision: 19, scale: 0 }),
    revDigitalExistingM1: decimal('rev_digital_existing_m1', { precision: 19, scale: 0 }),
    revDigitalExistingM12: decimal('rev_digital_existing_m12', { precision: 19, scale: 0 }),
    revDigitalExistingY: decimal('rev_digital_existing_y', { precision: 19, scale: 0 }),
    revDigitalExistingY1: decimal('rev_digital_existing_y1', { precision: 19, scale: 0 }),
    revDigitalExistingMom: decimal('rev_digital_existing_mom', { precision: 19, scale: 2 }),
    revDigitalExistingYoy: decimal('rev_digital_existing_yoy', { precision: 19, scale: 2 }),
    revDigitalExistingYtd: decimal('rev_digital_existing_ytd', { precision: 19, scale: 2 }),
});

export const summaryIoRePsRegional = honaiPuma.table('summary_hadoop_io_re_ps_regional', {
    event_date: varchar('event_date', { length: 10 }),
    area: varchar('area', { length: 20 }),
    regional: varchar('regional', { length: 100 }),
    channel: varchar('channel', { length: 100 }),
    package: varchar('package', { length: 100 }),
    io_m: varchar('io_m', { length: 100 }),
    io_m1: varchar('io_m1', { length: 100 }),
    io_mom: varchar('io_mom', { length: 100 }),
    io_gap_daily: varchar('io_gap_daily', { length: 100 }),
    re_m: varchar('re_m', { length: 100 }),
    re_m1: varchar('re_m1', { length: 100 }),
    re_mom: varchar('re_mom', { length: 100 }),
    re_gap_daily: varchar('re_gap_daily', { length: 100 }),
    ps_m: varchar('ps_m', { length: 100 }),
    ps_m1: varchar('ps_m1', { length: 100 }),
    ps_mom: varchar('ps_mom', { length: 100 }),
    ps_gap_daily: varchar('ps_gap_daily', { length: 100 }),
    ps_to_io: varchar('ps_to_io', { length: 100 }),
    ps_to_re: varchar('ps_to_re', { length: 100 }),
});

export const summaryIoRePsBranch = honaiPuma.table('summary_hadoop_io_re_ps_branch', {
    event_date: varchar('event_date', { length: 10 }),
    area: varchar('area', { length: 20 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    channel: varchar('channel', { length: 100 }),
    package: varchar('package', { length: 100 }),
    io_m: varchar('io_m', { length: 100 }),
    io_m1: varchar('io_m1', { length: 100 }),
    io_mom: varchar('io_mom', { length: 100 }),
    io_gap_daily: varchar('io_gap_daily', { length: 100 }),
    re_m: varchar('re_m', { length: 100 }),
    re_m1: varchar('re_m1', { length: 100 }),
    re_mom: varchar('re_mom', { length: 100 }),
    re_gap_daily: varchar('re_gap_daily', { length: 100 }),
    ps_m: varchar('ps_m', { length: 100 }),
    ps_m1: varchar('ps_m1', { length: 100 }),
    ps_mom: varchar('ps_mom', { length: 100 }),
    ps_gap_daily: varchar('ps_gap_daily', { length: 100 }),
    ps_to_io: varchar('ps_to_io', { length: 100 }),
    ps_to_re: varchar('ps_to_re', { length: 100 }),
});

export const summaryIoRePsWok = honaiPuma.table('summary_hadoop_io_re_ps_wok', {
    event_date: varchar('event_date', { length: 10 }),
    area: varchar('area', { length: 20 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    wok: varchar('wok', { length: 100 }),
    channel: varchar('channel', { length: 100 }),
    package: varchar('package', { length: 100 }),
    io_m: varchar('io_m', { length: 100 }),
    io_m1: varchar('io_m1', { length: 100 }),
    io_mom: varchar('io_mom', { length: 100 }),
    io_gap_daily: varchar('io_gap_daily', { length: 100 }),
    re_m: varchar('re_m', { length: 100 }),
    re_m1: varchar('re_m1', { length: 100 }),
    re_mom: varchar('re_mom', { length: 100 }),
    re_gap_daily: varchar('re_gap_daily', { length: 100 }),
    ps_m: varchar('ps_m', { length: 100 }),
    ps_m1: varchar('ps_m1', { length: 100 }),
    ps_mom: varchar('ps_mom', { length: 100 }),
    ps_gap_daily: varchar('ps_gap_daily', { length: 100 }),
    ps_to_io: varchar('ps_to_io', { length: 100 }),
    ps_to_re: varchar('ps_to_re', { length: 100 }),
});

export const summaryIoRePsSto = honaiPuma.table('summary_hadoop_io_re_ps_sto', {
    event_date: varchar('event_date', { length: 10 }),
    area: varchar('area', { length: 20 }),
    regional: varchar('regional', { length: 100 }),
    branch: varchar('branch', { length: 100 }),
    wok: varchar('wok', { length: 100 }),
    sto: varchar('sto', { length: 100 }),
    code_nama_sto: varchar('code_nama_sto', { length: 100 }),
    channel: varchar('channel', { length: 100 }),
    package: varchar('package', { length: 100 }),
    io_m: varchar('io_m', { length: 100 }),
    io_m1: varchar('io_m1', { length: 100 }),
    io_mom: varchar('io_mom', { length: 100 }),
    io_gap_daily: varchar('io_gap_daily', { length: 100 }),
    re_m: varchar('re_m', { length: 100 }),
    re_m1: varchar('re_m1', { length: 100 }),
    re_mom: varchar('re_mom', { length: 100 }),
    re_gap_daily: varchar('re_gap_daily', { length: 100 }),
    ps_m: varchar('ps_m', { length: 100 }),
    ps_m1: varchar('ps_m1', { length: 100 }),
    ps_mom: varchar('ps_mom', { length: 100 }),
    ps_gap_daily: varchar('ps_gap_daily', { length: 100 }),
    ps_to_io: varchar('ps_to_io', { length: 100 }),
    ps_to_re: varchar('ps_to_re', { length: 100 }),
});

export const summaryHouseholdC3mrRegional = honaiPuma.table('summary_household_c3mr_regional', {
    event_date: varchar('event_date', { length: 20 }),
    regional: varchar('regional', { length: 20 }),
    billing_category: varchar('billing_category', { length: 20 }),
    los_category: varchar('los_category', { length: 20 }),
    bill_amount: varchar('bill_amount', { length: 50 }),
    subs_paid: int('subs_paid'),
    amount_paid: varchar('amount_paid', { length: 50 }),
    subs_paid_pctg: double('subs_paid_pctg'),
    amount_paid_pctg: double('amount_paid_pctg'),
    amount_unpaid: varchar('amount_unpaid', { length: 50 }),
    subs_unpaid: int('subs_unpaid'),
    subs: int('subs'),
})

export const summaryHouseholdC3mrBranch = honaiPuma.table('summary_household_c3mr_branch', {
    event_date: varchar('event_date', { length: 20 }),
    regional: varchar('regional', { length: 20 }),
    branch: varchar('branch', { length: 30 }),
    billing_category: varchar('billing_category', { length: 20 }),
    los_category: varchar('los_category', { length: 20 }),
    bill_amount: varchar('bill_amount', { length: 50 }),
    subs_paid: int('subs_paid'),
    amount_paid: varchar('amount_paid', { length: 50 }),
    subs_paid_pctg: double('subs_paid_pctg'),
    amount_paid_pctg: double('amount_paid_pctg'),
    amount_unpaid: varchar('amount_unpaid', { length: 50 }),
    subs_unpaid: int('subs_unpaid'),
    subs: int('subs'),
})

export const summaryHouseholdC3mrCluster = honaiPuma.table('summary_household_c3mr_cluster', {
    event_date: varchar('event_date', { length: 20 }),
    regional: varchar('regional', { length: 20 }),
    branch: varchar('branch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    billing_category: varchar('billing_category', { length: 20 }),
    los_category: varchar('los_category', { length: 20 }),
    bill_amount: varchar('bill_amount', { length: 50 }),
    subs_paid: int('subs_paid'),
    amount_paid: varchar('amount_paid', { length: 50 }),
    subs_paid_pctg: double('subs_paid_pctg'),
    amount_paid_pctg: double('amount_paid_pctg'),
    amount_unpaid: varchar('amount_unpaid', { length: 50 }),
    subs_unpaid: int('subs_unpaid'),
    subs: int('subs'),
})

export const summaryHouseholdC3mrCity = honaiPuma.table('summary_household_c3mr_city', {
    event_date: varchar('event_date', { length: 20 }),
    regional: varchar('regional', { length: 20 }),
    branch: varchar('branch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    city: varchar('city', { length: 30 }),
    billing_category: varchar('billing_category', { length: 20 }),
    los_category: varchar('los_category', { length: 20 }),
    bill_amount: varchar('bill_amount', { length: 50 }),
    subs_paid: int('subs_paid'),
    amount_paid: varchar('amount_paid', { length: 50 }),
    subs_paid_pctg: double('subs_paid_pctg'),
    amount_paid_pctg: double('amount_paid_pctg'),
    amount_unpaid: varchar('amount_unpaid', { length: 50 }),
    subs_unpaid: int('subs_unpaid'),
    subs: int('subs'),
})

export const summaryHouseholdC3mrSto = honaiPuma.table('summary_household_c3mr_sto', {
    event_date: varchar('event_date', { length: 20 }),
    regional: varchar('regional', { length: 20 }),
    branch: varchar('branch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    city: varchar('city', { length: 30 }),
    sto: varchar('sto', { length: 5 }),
    billing_category: varchar('billing_category', { length: 20 }),
    los_category: varchar('los_category', { length: 20 }),
    bill_amount: varchar('bill_amount', { length: 50 }),
    subs_paid: int('subs_paid'),
    amount_paid: int('amount_paid'),
    subs_paid_pctg: double('subs_paid_pctg'),
    amount_paid_pctg: double('amount_paid_pctg'),
    amount_unpaid: int('amount_unpaid'),
    subs_unpaid: int('subs_unpaid'),
    subs: int('subs'),
})

export const summaryTrxNsAllKabupaten = honaiPuma.table('summary_trx_ns_all_kabupaten', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    branch: varchar('branch', { length: 30 }),
    regional: varchar('regional', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    kabupaten: varchar('kabupaten', { length: 30 }),
    new_abc_strategy: varchar('new_abc_strategy', { length: 80 }),
    trx_all_m: varchar('trx_all_m', { length: 100 }),
    trx_all_m1: varchar('trx_all_m1', { length: 100 }),
    trx_all_m12: varchar('trx_all_m12', { length: 100 }),
    trx_all_y: varchar('trx_all_y', { length: 100 }),
    trx_all_y1: varchar('trx_all_y1', { length: 100 }),
    trx_all_mom: varchar('trx_all_mom', { length: 100 }),
    trx_all_absolut: varchar('trx_all_absolut', { length: 100 }),
    trx_all_yoy: varchar('trx_all_yoy', { length: 100 }),
    trx_all_ytd: varchar('trx_all_ytd', { length: 100 }),
    trx_bb_m: varchar('trx_bb_m', { length: 100 }),
    trx_bb_m1: varchar('trx_bb_m1', { length: 100 }),
    trx_bb_m12: varchar('trx_bb_m12', { length: 100 }),
    trx_bb_y: varchar('trx_bb_y', { length: 100 }),
    trx_bb_y1: varchar('trx_bb_y1', { length: 100 }),
    trx_bb_mom: varchar('trx_bb_mom', { length: 100 }),
    trx_bb_absolut: varchar('trx_bb_absolut', { length: 100 }),
    trx_bb_yoy: varchar('trx_bb_yoy', { length: 100 }),
    trx_bb_ytd: varchar('trx_bb_ytd', { length: 100 }),
    trx_bb_contr: varchar('trx_bb_contr', { length: 100 }),
    trx_sms_m: varchar('trx_sms_m', { length: 100 }),
    trx_sms_m1: varchar('trx_sms_m1', { length: 100 }),
    trx_sms_m12: varchar('trx_sms_m12', { length: 100 }),
    trx_sms_y: varchar('trx_sms_y', { length: 100 }),
    trx_sms_y1: varchar('trx_sms_y1', { length: 100 }),
    trx_sms_mom: varchar('trx_sms_mom', { length: 100 }),
    trx_sms_absolut: varchar('trx_sms_absolut', { length: 100 }),
    trx_sms_yoy: varchar('trx_sms_yoy', { length: 100 }),
    trx_sms_ytd: varchar('trx_sms_ytd', { length: 100 }),
    trx_sms_contr: varchar('trx_sms_contr', { length: 100 }),
    trx_voice_m: varchar('trx_voice_m', { length: 100 }),
    trx_voice_m1: varchar('trx_voice_m1', { length: 100 }),
    trx_voice_m12: varchar('trx_voice_m12', { length: 100 }),
    trx_voice_y: varchar('trx_voice_y', { length: 100 }),
    trx_voice_y1: varchar('trx_voice_y1', { length: 100 }),
    trx_voice_mom: varchar('trx_voice_mom', { length: 100 }),
    trx_voice_absolut: varchar('trx_voice_absolut', { length: 100 }),
    trx_voice_yoy: varchar('trx_voice_yoy', { length: 100 }),
    trx_voice_ytd: varchar('trx_voice_ytd', { length: 100 }),
    trx_voice_contr: varchar('trx_voice_contr', { length: 100 }),
    trx_digital_m: varchar('trx_digital_m', { length: 100 }),
    trx_digital_m1: varchar('trx_digital_m1', { length: 100 }),
    trx_digital_m12: varchar('trx_digital_m12', { length: 100 }),
    trx_digital_y: varchar('trx_digital_y', { length: 100 }),
    trx_digital_y1: varchar('trx_digital_y1', { length: 100 }),
    trx_digital_mom: varchar('trx_digital_mom', { length: 100 }),
    trx_digital_absolut: varchar('trx_digital_absolut', { length: 100 }),
    trx_digital_yoy: varchar('trx_digital_yoy', { length: 100 }),
    trx_digital_ytd: varchar('trx_digital_ytd', { length: 100 }),
    trx_digital_contr: varchar('trx_digital_contr', { length: 100 }),
    trx_ir_m: varchar('trx_ir_m', { length: 100 }),
    trx_ir_m1: varchar('trx_ir_m1', { length: 100 }),
    trx_ir_m12: varchar('trx_ir_m12', { length: 100 }),
    trx_ir_y: varchar('trx_ir_y', { length: 100 }),
    trx_ir_y1: varchar('trx_ir_y1', { length: 100 }),
    trx_ir_mom: varchar('trx_ir_mom', { length: 100 }),
    trx_ir_absolut: varchar('trx_ir_absolut', { length: 100 }),
    trx_ir_yoy: varchar('trx_ir_yoy', { length: 100 }),
    trx_ir_ytd: varchar('trx_ir_ytd', { length: 100 }),
    trx_ir_contr: varchar('trx_ir_contr', { length: 100 }),
    trx_others_m: varchar('trx_others_m', { length: 100 }),
    trx_others_m1: varchar('trx_others_m1', { length: 100 }),
    trx_others_m12: varchar('trx_others_m12', { length: 100 }),
    trx_others_y: varchar('trx_others_y', { length: 100 }),
    trx_others_y1: varchar('trx_others_y1', { length: 100 }),
    trx_others_mom: varchar('trx_others_mom', { length: 100 }),
    trx_others_absolut: varchar('trx_others_absolut', { length: 100 }),
    trx_others_yoy: varchar('trx_others_yoy', { length: 100 }),
    trx_others_ytd: varchar('trx_others_ytd', { length: 100 }),
    trx_others_contr: varchar('trx_others_contr', { length: 100 }),
})

export const summaryTrxNsPrabayarKabupaten = honaiPuma.table('summary_trx_ns_prabayar_kabupaten', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    branch: varchar('branch', { length: 30 }),
    regional: varchar('regional', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    kabupaten: varchar('kabupaten', { length: 30 }),
    new_abc_strategy: varchar('new_abc_strategy', { length: 80 }),
    trx_all_m: varchar('trx_all_m', { length: 100 }),
    trx_all_m1: varchar('trx_all_m1', { length: 100 }),
    trx_all_m12: varchar('trx_all_m12', { length: 100 }),
    trx_all_y: varchar('trx_all_y', { length: 100 }),
    trx_all_y1: varchar('trx_all_y1', { length: 100 }),
    trx_all_mom: varchar('trx_all_mom', { length: 100 }),
    trx_all_absolut: varchar('trx_all_absolut', { length: 100 }),
    trx_all_yoy: varchar('trx_all_yoy', { length: 100 }),
    trx_all_ytd: varchar('trx_all_ytd', { length: 100 }),
    trx_bb_m: varchar('trx_bb_m', { length: 100 }),
    trx_bb_m1: varchar('trx_bb_m1', { length: 100 }),
    trx_bb_m12: varchar('trx_bb_m12', { length: 100 }),
    trx_bb_y: varchar('trx_bb_y', { length: 100 }),
    trx_bb_y1: varchar('trx_bb_y1', { length: 100 }),
    trx_bb_mom: varchar('trx_bb_mom', { length: 100 }),
    trx_bb_absolut: varchar('trx_bb_absolut', { length: 100 }),
    trx_bb_yoy: varchar('trx_bb_yoy', { length: 100 }),
    trx_bb_ytd: varchar('trx_bb_ytd', { length: 100 }),
    trx_bb_contr: varchar('trx_bb_contr', { length: 100 }),
    trx_sms_m: varchar('trx_sms_m', { length: 100 }),
    trx_sms_m1: varchar('trx_sms_m1', { length: 100 }),
    trx_sms_m12: varchar('trx_sms_m12', { length: 100 }),
    trx_sms_y: varchar('trx_sms_y', { length: 100 }),
    trx_sms_y1: varchar('trx_sms_y1', { length: 100 }),
    trx_sms_mom: varchar('trx_sms_mom', { length: 100 }),
    trx_sms_absolut: varchar('trx_sms_absolut', { length: 100 }),
    trx_sms_yoy: varchar('trx_sms_yoy', { length: 100 }),
    trx_sms_ytd: varchar('trx_sms_ytd', { length: 100 }),
    trx_sms_contr: varchar('trx_sms_contr', { length: 100 }),
    trx_voice_m: varchar('trx_voice_m', { length: 100 }),
    trx_voice_m1: varchar('trx_voice_m1', { length: 100 }),
    trx_voice_m12: varchar('trx_voice_m12', { length: 100 }),
    trx_voice_y: varchar('trx_voice_y', { length: 100 }),
    trx_voice_y1: varchar('trx_voice_y1', { length: 100 }),
    trx_voice_mom: varchar('trx_voice_mom', { length: 100 }),
    trx_voice_absolut: varchar('trx_voice_absolut', { length: 100 }),
    trx_voice_yoy: varchar('trx_voice_yoy', { length: 100 }),
    trx_voice_ytd: varchar('trx_voice_ytd', { length: 100 }),
    trx_voice_contr: varchar('trx_voice_contr', { length: 100 }),
    trx_digital_m: varchar('trx_digital_m', { length: 100 }),
    trx_digital_m1: varchar('trx_digital_m1', { length: 100 }),
    trx_digital_m12: varchar('trx_digital_m12', { length: 100 }),
    trx_digital_y: varchar('trx_digital_y', { length: 100 }),
    trx_digital_y1: varchar('trx_digital_y1', { length: 100 }),
    trx_digital_mom: varchar('trx_digital_mom', { length: 100 }),
    trx_digital_absolut: varchar('trx_digital_absolut', { length: 100 }),
    trx_digital_yoy: varchar('trx_digital_yoy', { length: 100 }),
    trx_digital_ytd: varchar('trx_digital_ytd', { length: 100 }),
    trx_digital_contr: varchar('trx_digital_contr', { length: 100 }),
    trx_ir_m: varchar('trx_ir_m', { length: 100 }),
    trx_ir_m1: varchar('trx_ir_m1', { length: 100 }),
    trx_ir_m12: varchar('trx_ir_m12', { length: 100 }),
    trx_ir_y: varchar('trx_ir_y', { length: 100 }),
    trx_ir_y1: varchar('trx_ir_y1', { length: 100 }),
    trx_ir_mom: varchar('trx_ir_mom', { length: 100 }),
    trx_ir_absolut: varchar('trx_ir_absolut', { length: 100 }),
    trx_ir_yoy: varchar('trx_ir_yoy', { length: 100 }),
    trx_ir_ytd: varchar('trx_ir_ytd', { length: 100 }),
    trx_ir_contr: varchar('trx_ir_contr', { length: 100 }),
    trx_others_m: varchar('trx_others_m', { length: 100 }),
    trx_others_m1: varchar('trx_others_m1', { length: 100 }),
    trx_others_m12: varchar('trx_others_m12', { length: 100 }),
    trx_others_y: varchar('trx_others_y', { length: 100 }),
    trx_others_y1: varchar('trx_others_y1', { length: 100 }),
    trx_others_mom: varchar('trx_others_mom', { length: 100 }),
    trx_others_absolut: varchar('trx_others_absolut', { length: 100 }),
    trx_others_yoy: varchar('trx_others_yoy', { length: 100 }),
    trx_others_ytd: varchar('trx_others_ytd', { length: 100 }),
    trx_others_contr: varchar('trx_others_contr', { length: 100 }),
})

export const summaryTrxNsByuKabupaten = honaiPuma.table('summary_trx_ns_byu_kabupaten', {
    tgl: varchar('tgl', { length: 10 }),
    area: varchar('area', { length: 10 }),
    branch: varchar('branch', { length: 30 }),
    regional: varchar('regional', { length: 30 }),
    subbranch: varchar('subbranch', { length: 30 }),
    cluster: varchar('cluster', { length: 30 }),
    kabupaten: varchar('kabupaten', { length: 30 }),
    new_abc_strategy: varchar('new_abc_strategy', { length: 80 }),
    trx_all_m: varchar('trx_all_m', { length: 100 }),
    trx_all_m1: varchar('trx_all_m1', { length: 100 }),
    trx_all_m12: varchar('trx_all_m12', { length: 100 }),
    trx_all_y: varchar('trx_all_y', { length: 100 }),
    trx_all_y1: varchar('trx_all_y1', { length: 100 }),
    trx_all_mom: varchar('trx_all_mom', { length: 100 }),
    trx_all_absolut: varchar('trx_all_absolut', { length: 100 }),
    trx_all_yoy: varchar('trx_all_yoy', { length: 100 }),
    trx_all_ytd: varchar('trx_all_ytd', { length: 100 }),
    trx_bb_m: varchar('trx_bb_m', { length: 100 }),
    trx_bb_m1: varchar('trx_bb_m1', { length: 100 }),
    trx_bb_m12: varchar('trx_bb_m12', { length: 100 }),
    trx_bb_y: varchar('trx_bb_y', { length: 100 }),
    trx_bb_y1: varchar('trx_bb_y1', { length: 100 }),
    trx_bb_mom: varchar('trx_bb_mom', { length: 100 }),
    trx_bb_absolut: varchar('trx_bb_absolut', { length: 100 }),
    trx_bb_yoy: varchar('trx_bb_yoy', { length: 100 }),
    trx_bb_ytd: varchar('trx_bb_ytd', { length: 100 }),
    trx_bb_contr: varchar('trx_bb_contr', { length: 100 }),
    trx_sms_m: varchar('trx_sms_m', { length: 100 }),
    trx_sms_m1: varchar('trx_sms_m1', { length: 100 }),
    trx_sms_m12: varchar('trx_sms_m12', { length: 100 }),
    trx_sms_y: varchar('trx_sms_y', { length: 100 }),
    trx_sms_y1: varchar('trx_sms_y1', { length: 100 }),
    trx_sms_mom: varchar('trx_sms_mom', { length: 100 }),
    trx_sms_absolut: varchar('trx_sms_absolut', { length: 100 }),
    trx_sms_yoy: varchar('trx_sms_yoy', { length: 100 }),
    trx_sms_ytd: varchar('trx_sms_ytd', { length: 100 }),
    trx_sms_contr: varchar('trx_sms_contr', { length: 100 }),
    trx_voice_m: varchar('trx_voice_m', { length: 100 }),
    trx_voice_m1: varchar('trx_voice_m1', { length: 100 }),
    trx_voice_m12: varchar('trx_voice_m12', { length: 100 }),
    trx_voice_y: varchar('trx_voice_y', { length: 100 }),
    trx_voice_y1: varchar('trx_voice_y1', { length: 100 }),
    trx_voice_mom: varchar('trx_voice_mom', { length: 100 }),
    trx_voice_absolut: varchar('trx_voice_absolut', { length: 100 }),
    trx_voice_yoy: varchar('trx_voice_yoy', { length: 100 }),
    trx_voice_ytd: varchar('trx_voice_ytd', { length: 100 }),
    trx_voice_contr: varchar('trx_voice_contr', { length: 100 }),
    trx_digital_m: varchar('trx_digital_m', { length: 100 }),
    trx_digital_m1: varchar('trx_digital_m1', { length: 100 }),
    trx_digital_m12: varchar('trx_digital_m12', { length: 100 }),
    trx_digital_y: varchar('trx_digital_y', { length: 100 }),
    trx_digital_y1: varchar('trx_digital_y1', { length: 100 }),
    trx_digital_mom: varchar('trx_digital_mom', { length: 100 }),
    trx_digital_absolut: varchar('trx_digital_absolut', { length: 100 }),
    trx_digital_yoy: varchar('trx_digital_yoy', { length: 100 }),
    trx_digital_ytd: varchar('trx_digital_ytd', { length: 100 }),
    trx_digital_contr: varchar('trx_digital_contr', { length: 100 }),
    trx_ir_m: varchar('trx_ir_m', { length: 100 }),
    trx_ir_m1: varchar('trx_ir_m1', { length: 100 }),
    trx_ir_m12: varchar('trx_ir_m12', { length: 100 }),
    trx_ir_y: varchar('trx_ir_y', { length: 100 }),
    trx_ir_y1: varchar('trx_ir_y1', { length: 100 }),
    trx_ir_mom: varchar('trx_ir_mom', { length: 100 }),
    trx_ir_absolut: varchar('trx_ir_absolut', { length: 100 }),
    trx_ir_yoy: varchar('trx_ir_yoy', { length: 100 }),
    trx_ir_ytd: varchar('trx_ir_ytd', { length: 100 }),
    trx_ir_contr: varchar('trx_ir_contr', { length: 100 }),
    trx_others_m: varchar('trx_others_m', { length: 100 }),
    trx_others_m1: varchar('trx_others_m1', { length: 100 }),
    trx_others_m12: varchar('trx_others_m12', { length: 100 }),
    trx_others_y: varchar('trx_others_y', { length: 100 }),
    trx_others_y1: varchar('trx_others_y1', { length: 100 }),
    trx_others_mom: varchar('trx_others_mom', { length: 100 }),
    trx_others_absolut: varchar('trx_others_absolut', { length: 100 }),
    trx_others_yoy: varchar('trx_others_yoy', { length: 100 }),
    trx_others_ytd: varchar('trx_others_ytd', { length: 100 }),
    trx_others_contr: varchar('trx_others_contr', { length: 100 }),
})