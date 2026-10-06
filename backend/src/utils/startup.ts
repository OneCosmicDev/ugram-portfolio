type MigrationStatus = 'pending' | 'running' | 'done' | 'failed';

export const startup = {
    migrationStatus: 'pending' as MigrationStatus,
    migrationError: null as string | null,
};
