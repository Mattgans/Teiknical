import matplotlib.pyplot as plt
import sqlite3
import pandas as pd

conn = sqlite3.connect("cell_count.db")
# need to use sql approach for rest as instructions ask us to do it later in part 4 so just keep it as is.

# compare diff in cell pop relative freq of mela receiving miraclib (reponse vs nonrespons) (goal predict response)
# if we just wnat to predict response logistic regression? (just cuz binary output)
# only inclue PBMC samples

query = """
SELECT
    s.sample,
    s.subject,
    s.time_from_treatment_start,
    u.response,
    c.cell_type AS population,
    c.count,
    SUM(c.count) OVER (
        PARTITION BY s.sample
        ) AS total_count, 
        100.0 * c.count / NULLIF( SUM(c.count) OVER (PARTITION BY s.sample),0) AS percentage
From samples AS s
JOIN subjects AS u ON s.subject = u.subject
JOIN cell_counts AS c ON s.sample = c.sample
WHERE u.condition = 'melanoma'
    AND u.treatment = 'miraclib'
    AND u.sample_type = 'PBMC'
    AND u.response IN ('yes','no')
ORDER BY s.sample, c.cell_type
"""
df = pd.read_sql_query(query,conn)
# print(df.head())


subject_query = f"""
WITH sample_freq AS ({query})
SELECT
    subject,
    response,
    population,
    AVG(percentage) AS mean_percentage
FROM sample_freq
GROUP BY subject, response, population
ORDER BY subject, population
"""

subject_df = pd.read_sql_query(subject_query,conn)
print(subject_df.head())

# compare differences

pops = ["b_cell", "cd8_t_cell", "cd4_t_cell", "nk_cell", "monocyte"]

fig,axes = plt.subplots(1,5,figsize = (16,5), sharey=True)
for ax, population in zip(axes,pops):
    population_df = subject_df[subject_df["population"] == population]
    responders_df = population_df[population_df["response"] == "yes"]["mean_percentage"]
    non_response_df = population_df[population_df["response"] == "no"]["mean_percentage"]
    ax.boxplot([responders_df,non_response_df])
    ax.set_xticks([1,2])
    ax.set_xticklabels(["Reponse", "Non-Response"])
    ax.set_title(population.replace("_", " ").title())

axes[0].set_ylabel("Mean rel freq per subject (%)")
plt.tight_layout()
plt.show()
