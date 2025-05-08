export interface RevenueBase {
    name: string;
    currMonthRevenue: number;
    currMonthTarget: number;
    currYtdRevenue: number;
    prevYtdRevenue: number;
    prevMonthRevenue: number;
    prevYearCurrMonthRevenue: number;
}

export interface Kabupaten extends RevenueBase { }

export interface Cluster extends RevenueBase {
    kabupatens: Kabupaten[]
}

export interface Subbranch extends RevenueBase {
    clusters: Cluster[];
};

export interface Branch extends RevenueBase {
    subbranches: Subbranch[];
};

export interface Regional extends RevenueBase {
    branches: Branch[];
};

export interface RevenueBaseFMC {
    name: string;
    revMtd: number;
    revM1: number;
    revM2: number;
    revM3: number;
    drMtd: number;
    drM1: number;
    drM2: number;
    drM3: number;
    subs: number;
    subsM1: number;
    subsM2: number;
    subsM3: number;
    payload: number;
    payloadM1: number;
    rgbAll: number;
    rgbVoice: number;
    rgbDigital: number;
    rgbData: number;
    rgbAllM1: number;
    rgbVoiceM1: number;
    rgbDigitalM1: number;
    rgbDataM1: number;
    rgbAllM2: number;
    rgbVoiceM2: number;
    rgbDigitalM2: number;
    rgbDataM2: number;
    rgbAllM3: number;
    rgbVoiceM3: number;
    rgbDigitalM3: number;
    rgbDataM3: number;
    arpu: number;
    arpuM1: number;
    arpuM2: number;
    arpuM3: number;
}

// STO (Store) level entity
export interface StoEntity extends RevenueBaseFMC {
    // No additional nested structures at the STO level
}

// WOK level entity
export interface WokEntity extends RevenueBaseFMC {
    stos: StoEntity[];
}

// Branch level entity
export interface BranchEntity extends RevenueBaseFMC {
    woks: WokEntity[];
}

// Region level entity (top level)
export interface RegionEntity extends RevenueBaseFMC {
    branches: BranchEntity[];
}