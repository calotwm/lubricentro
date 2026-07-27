"""
Export all data from SQLite to PostgreSQL.

Usage:
    set DATABASE_URL=postgresql://user:pass@host:5432/dbname
    python export_to_postgres.py
"""

import os
import sys

import psycopg2
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SQLITE_PATH = os.path.join(
    os.path.dirname(__file__), "..", "backend", "lubricentro.db"
)

# ---------------------------------------------------------------------------
# Table copy order (respects FK dependencies)
# ---------------------------------------------------------------------------
# Tables with ON CONFLICT (unique by name)
CONFLICT_TABLES = {
    "categories": "name",
    "brands": "name",
}

# Tables that get TRUNCATE + INSERT (in FK-safe order)
TRUNCATE_TABLES = [
    "sale_items",
    "stock_movements",
    "sales",
    "products",
]

ALL_TABLES = ["categories", "brands", "products", "stock_movements", "sales", "sale_items"]


def get_sqlite_engine():
    db_path = os.path.abspath(SQLITE_PATH)
    if not os.path.exists(db_path):
        print(f"ERROR: SQLite database not found at {db_path}")
        sys.exit(1)
    return create_engine(f"sqlite:///{db_path}")


def get_pg_connection():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("  Example: set DATABASE_URL=postgresql://user:pass@host:5432/dbname")
        sys.exit(1)
    return psycopg2.connect(database_url)


def fetch_all_rows(session, table_name):
    """Return list of dicts for every row in a SQLite table."""
    result = session.execute(text(f"SELECT * FROM {table_name}"))
    columns = list(result.keys())
    return [dict(zip(columns, row)) for row in result.fetchall()]


def build_insert_sql(table_name, columns, conflict_column=None):
    """Build an INSERT statement with optional ON CONFLICT DO NOTHING."""
    cols = ", ".join(columns)
    placeholders = ", ".join([f"%({c})s" for c in columns])
    sql = f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders})"
    if conflict_column:
        sql += f" ON CONFLICT ({conflict_column}) DO NOTHING"
    return sql


def main():
    print("=" * 60)
    print("  SQLite → PostgreSQL Data Migration")
    print("=" * 60)

    # --- Connect ---
    sqlite_engine = get_sqlite_engine()
    print(f"\n[OK] SQLite: {os.path.abspath(SQLITE_PATH)}")

    pg_conn = get_pg_connection()
    pg_conn.autocommit = False
    print(f"[OK] PostgreSQL: connected")

    summary = {}

    try:
        with Session(sqlite_engine) as sqlite_session:
            pg_cur = pg_conn.cursor()

            # --- Phase 1: TRUNCATE target tables (FK-safe order) ---
            print("\n--- Truncating target tables ---")
            for table in TRUNCATE_TABLES:
                pg_cur.execute(f"TRUNCATE {table} RESTART IDENTITY CASCADE")
                print(f"  TRUNCATE {table}")
            pg_conn.commit()

            # --- Phase 2: Copy data ---
            print("\n--- Copying data ---")
            for table in ALL_TABLES:
                rows = fetch_all_rows(sqlite_session, table)
                if not rows:
                    summary[table] = 0
                    print(f"  {table}: 0 rows (empty)")
                    continue

                columns = list(rows[0].keys())
                conflict_col = CONFLICT_TABLES.get(table)
                insert_sql = build_insert_sql(table, columns, conflict_col)

                inserted = 0
                for row in rows:
                    try:
                        pg_cur.execute(insert_sql, row)
                        inserted += 1
                    except Exception as e:
                        pg_conn.rollback()
                        print(f"  ERROR on {table} row {row.get('id', '?')}: {e}")
                        raise

                pg_conn.commit()
                summary[table] = inserted
                action = "UPSERT" if conflict_col else "INSERT"
                print(f"  {table}: {inserted} rows ({action})")

            # --- Phase 3: Reset sequences ---
            print("\n--- Resetting ID sequences ---")
            for table in ALL_TABLES:
                try:
                    pg_cur.execute(
                        f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                        f"COALESCE((SELECT MAX(id) FROM {table}), 1))"
                    )
                    print(f"  {table}: sequence updated")
                except Exception:
                    pg_conn.rollback()
                    print(f"  {table}: sequence reset skipped (no id column or table empty)")
                    pg_conn.rollback()
            pg_conn.commit()

        pg_cur.close()
    except Exception as e:
        pg_conn.rollback()
        print(f"\nFATAL: {e}")
        sys.exit(1)
    finally:
        pg_conn.close()

    # --- Summary ---
    print("\n" + "=" * 60)
    print("  Migration Summary")
    print("=" * 60)
    total = 0
    for table, count in summary.items():
        print(f"  {table:20s} {count:>6d} rows")
        total += count
    print(f"  {'TOTAL':20s} {total:>6d} rows")
    print("=" * 60)
    print("\nDone.")


if __name__ == "__main__":
    main()
