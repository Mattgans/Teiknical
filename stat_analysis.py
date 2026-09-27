import matplotlib.pyplot as plt
import sqlite3
import pandas as pd
from scipy.stats import ttest_ind
from statsmodels.stats.multitest import multipletests

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
# print(subject_df.head())

# compare differences

pops = ["b_cell", "cd8_t_cell", "cd4_t_cell", "nk_cell", "monocyte"]
results = []
fig,axes = plt.subplots(1,5,figsize = (16,5), sharey=True)
for ax, population in zip(axes,pops):
    population_df = subject_df[subject_df["population"] == population]
    responders_df = population_df[population_df["response"] == "yes"]["mean_percentage"]
    non_response_df = population_df[population_df["response"] == "no"]["mean_percentage"]
    ax.boxplot([responders_df,non_response_df])
    ax.set_xticks([1,2])
    ax.set_xticklabels(["Reponse", "Non-Response"])
    ax.set_title(population.replace("_", " ").title())
    # since checking for difference of means simple t test can be done, use whelches because the variances might not be equal
    test = ttest_ind(responders_df,non_response_df,equal_var = False)
    # print(f"{population}: p-val = {test.pvalue:.6g}")
    results.append({
      "population": population,
      "responder_mean": responders_df.mean(),
      "nonresponder_mean": non_response_df.mean(),
      "difference_pp": responders_df.mean() - non_response_df.mean(),
      "p_value": test.pvalue
    })

result_df = pd.DataFrame(results)
# holm adjustment becuase of the 5 groups and want to repot which group was higher to each other as well
significant, adj_p, _, _ = multipletests(result_df["p_value"],alpha = 0.05, method= "holm")
result_df["adj_p"] = adj_p
result_df["significance"] = significant
print(result_df)
axes[0].set_ylabel("Mean rel freq per subject (%)")
plt.tight_layout()
plt.show()

conn.close()

result_df.to_csv("stat_results.csv", index = False)
subject_df.to_csv("subject_freq.csv", index = False)


