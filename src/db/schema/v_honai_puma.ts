import { mysqlSchema, varchar, double } from "drizzle-orm/mysql-core";

export const honaiPuma = mysqlSchema('v_honai_puma')

export const revenueCVM = honaiPuma.table("summary_revenue_cvm", {
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
    transactionDate: varchar("transaction_date", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const revenueGross = honaiPuma.table("summary_revenue_gross", {
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
    transactionDate: varchar("transaction_date", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const revenueGrossPrabayar = honaiPuma.table("summary_revenue_gross_prabayar", {
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
    transactionDate: varchar("transaction_date", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const revenueNewSales = honaiPuma.table("summary_revenue_new_sales", {
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
    transactionDate: varchar("transaction_date", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const revenueNewSalesPrabayar = honaiPuma.table("summary_revenue_new_sales_prabayar", {
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
    transactionDate: varchar("transaction_date", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const trxNewSales = honaiPuma.table("summary_trx_new_sales", {
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
    transactionDate: varchar("transaction_date", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const trxNewSalesPrabayar = honaiPuma.table("summary_trx_new_sales_prabayar", {
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
    transactionDate: varchar("transaction_date", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});

export const revenueRedeemPV = honaiPuma.table("summary_revenue_redeem_pv", {
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
    transactionDate: varchar("transaction_date", { length: 20 }),
    processingDate: varchar("processing_date", { length: 20 }),
});
