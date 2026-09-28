import sqlite3
import pandas as pd

conn = sqlite3.connect('cell_count.db')

df = pd.read_sql_query("SELECT * FROM cell_counts", conn)
conn.close()

df["total_count"] = df.groupby("sample")["count"].transform("sum")
df["percent"] = df["count"] / df["total_count"]
df["percent"] *= 100

# Match the required summary columns when displaying and exporting the results.
summary_df = df.rename(columns={"cell_type": "population", "percent": "percentage"})
summary_df = summary_df[["sample", "total_count", "population", "count", "percentage"]]
print(summary_df)
summary_df.to_csv("data/results/cell_frequencies.csv", index=False)

# SQL alternative for the same calculation:
# conn = sqlite3.connect("cell_count.db")
# query = """
# SELECT
#     sample,
#     SUM(count) OVER (PARTITION BY sample) AS total_count,
#     cell_type AS population,
#     count,
#     100.0 * count / NULLIF(SUM(count) OVER (PARTITION BY sample), 0) AS percentage
# FROM cell_counts
# """
# summary_df = pd.read_sql_query(query, conn)
# conn.close()
# print(summary_df)
