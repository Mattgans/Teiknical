import sqlite3
import pandas as pd

conn = sqlite3.connect('cell_count.db')

df = pd.read_sql_query("SELECT * FROM cell_counts", conn)

conn.close()
# print(df.head())

df["total_count"] = df.groupby("sample")["count"].transform("sum")

# print(df["total_count"])

df["percent"] = df["count"] / df["total_count"]
df["percent"] *= 100
print(df["percent"])



# # sql version if needed

# conn = sqlite3.connect("cell_count.db")
# query = """
# SELECT
#     sample,
#     SUM(count) OVER (PARTITION BY sample) AS total_count,
#     cell_type as population,
#     count,
#     100.0 * count / SUM(count) OVER (PARTITION BY sample) AS percentage
# FROM cell_counts
# """

# df = pd.read_sql_query(query, conn)
# conn.close
# print(df)