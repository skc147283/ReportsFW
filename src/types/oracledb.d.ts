declare module "oracledb" {
  export interface Connection {
    execute<T = unknown>(
      sql: string,
      binds?: Record<string, unknown> | unknown[],
      options?: {
        outFormat?: number;
      },
    ): Promise<{
      rows?: T[];
    }>;
    commit(): Promise<void>;
    close(): Promise<void>;
  }

  export interface OracleDb {
    OUT_FORMAT_OBJECT: number;
    getConnection(config: {
      user: string;
      password: string;
      connectionString: string;
    }): Promise<Connection>;
  }

  const oracledb: OracleDb;

  export default oracledb;
}