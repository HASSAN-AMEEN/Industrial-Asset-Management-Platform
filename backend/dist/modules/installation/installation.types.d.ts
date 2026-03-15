export declare const INSTALLATION_STATUSES: readonly ["ACTIVE", "REMOVED", "MAINTENANCE"];
export type InstallationStatus = typeof INSTALLATION_STATUSES[number];
export interface CreateInstallationInput {
    machineId: string;
    clientId?: string;
    installedAt?: string;
    latitude?: number;
    longitude?: number;
    siteAddress?: string;
    siteNotes?: string;
}
export interface UpdateInstallationInput {
    clientId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    siteAddress?: string | null;
    siteNotes?: string | null;
    status?: InstallationStatus;
}
//# sourceMappingURL=installation.types.d.ts.map