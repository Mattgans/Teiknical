import sqlite3
import pandas as pd

conn = sqlite3.connect('cell_count.db')

df = pd.read_sql_query("SELECT * FROM subjects", conn)

conn.close()
# print(df.head())

print(df)