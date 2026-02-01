import sqlite3 from 'sqlite3';
import { promisify } from 'util';

/**
 * DatabaseService - SQLite wrapper with async/await support
 * Provides query, queryOne, execute, and transaction methods
 */
export class DatabaseService {
	private db: sqlite3.Database | null = null;
	private dbPath: string;

	constructor(dbPath: string) {
		this.dbPath = dbPath;
	}

	/**
	 * Initialize database connection
	 */
	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db = new sqlite3.Database(this.dbPath, (err) => {
				if (err) {
					reject(new Error(`Failed to connect to database: ${err.message}`));
				} else {
					console.log(`Connected to SQLite database: ${this.dbPath}`);
					resolve();
				}
			});
		});
	}

	/**
	 * Close database connection
	 */
	async close(): Promise<void> {
		if (!this.db) return;

		return new Promise((resolve, reject) => {
			this.db!.close((err) => {
				if (err) {
					reject(new Error(`Failed to close database: ${err.message}`));
				} else {
					console.log('Database connection closed');
					resolve();
				}
			});
		});
	}

	/**
	 * Execute a SELECT query and return all rows
	 * @param sql - SQL query string
	 * @param params - Query parameters
	 * @returns Array of result rows
	 */
	async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
		if (!this.db) {
			throw new Error('Database not connected');
		}

		return new Promise((resolve, reject) => {
			this.db!.all(sql, params, (err, rows) => {
				if (err) {
					reject(new Error(`Query failed: ${err.message}`));
				} else {
					resolve(rows as T[]);
				}
			});
		});
	}

	/**
	 * Execute a SELECT query and return a single row
	 * @param sql - SQL query string
	 * @param params - Query parameters
	 * @returns Single result row or null
	 */
	async queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
		if (!this.db) {
			throw new Error('Database not connected');
		}

		return new Promise((resolve, reject) => {
			this.db!.get(sql, params, (err, row) => {
				if (err) {
					reject(new Error(`Query failed: ${err.message}`));
				} else {
					resolve((row as T) || null);
				}
			});
		});
	}

	/**
	 * Execute an INSERT, UPDATE, or DELETE query
	 * @param sql - SQL query string
	 * @param params - Query parameters
	 */
	async execute(sql: string, params: unknown[] = []): Promise<void> {
		if (!this.db) {
			throw new Error('Database not connected');
		}

		return new Promise((resolve, reject) => {
			this.db!.run(sql, params, function (err) {
				if (err) {
					reject(new Error(`Execute failed: ${err.message}`));
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Execute a function within a transaction
	 * Automatically commits on success, rolls back on error
	 * @param fn - Function that performs database operations
	 */
	async transaction<T>(fn: (db: DatabaseService) => Promise<T>): Promise<T> {
		if (!this.db) {
			throw new Error('Database not connected');
		}

		await this.execute('BEGIN TRANSACTION');

		try {
			const result = await fn(this);
			await this.execute('COMMIT');
			return result;
		} catch (error) {
			await this.execute('ROLLBACK');
			throw error;
		}
	}

	/**
	 * Get the last inserted row ID (for INSERT operations)
	 */
	async getLastInsertId(): Promise<number> {
		const result = await this.queryOne<{ id: number }>('SELECT last_insert_rowid() as id');
		return result?.id || 0;
	}

	/**
	 * Check if database is connected
	 */
	isConnected(): boolean {
		return this.db !== null;
	}
}
