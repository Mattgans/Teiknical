import sqlite3
import pandas as pd

conn = sqlite3.connect("cell_count.db")

baseline = """
  SELECT
      s.sample,
      s.subject,
      s.time_from_treatment_start,
      u.project,
      u.response,
      u.sex
  FROM samples AS s
  JOIN subjects AS u ON s.subject = u.subject
  WHERE u.condition = 'melanoma'
      AND u.treatment = 'miraclib'
      AND u.sample_type = 'PBMC'
      AND s.time_from_treatment_start = 0
"""

baseline_df = pd.read_sql_query(baseline, conn)
# print(baseline_df)

project = f"""
WITH baseline AS ({baseline})
SELECT
    project,
    COUNT(*) AS sample_count
FROM baseline
GROUP BY project
ORDER BY project
"""



response = f"""
WITH baseline AS ({baseline})
SELECT
    response,
    COUNT(DISTINCT subject) AS subject_count
FROM baseline
GROUP BY response
ORDER BY response
"""

sex = f"""
WITH baseline AS ({baseline})
SELECT
    sex,
    COUNT(DISTINCT subject) AS subject_count
FROM baseline
GROUP BY sex
ORDER BY sex
"""

project_df = pd.read_sql_query(project, conn)
response_df = pd.read_sql_query(response, conn)
sex_df = pd.read_sql_query(sex, conn)
print(project_df)
print(response_df)
print(sex_df)

# Separate question: include ALL sample types and treatments.
b_cell_query = """
SELECT AVG(c.count) AS mean_b_cells, COUNT(*) AS sample_count
FROM cell_counts AS c
JOIN samples AS s ON c.sample = s.sample
JOIN subjects AS u ON s.subject = u.subject
WHERE u.condition = 'melanoma'
  AND u.sex = 'M'
  AND u.response = 'yes'
  AND s.time_from_treatment_start = 0
  AND c.cell_type = 'b_cell'
"""
b_cell_df = pd.read_sql_query(b_cell_query, conn)

baseline_df.to_csv("data/results/baseline_samples.csv", index=False)
project_df.to_csv("data/results/project_counts.csv", index=False)
response_df.to_csv("data/results/response_counts.csv", index=False)
sex_df.to_csv("data/results/sex_counts.csv", index=False)
b_cell_df.to_csv("data/results/b_cell_answer.csv", index=False)

conn.close()
