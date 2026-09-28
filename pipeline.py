"""Run the complete database-to-dashboard pipeline without opening plot windows."""
import csv
import shutil
import sqlite3
import subprocess
import sys

if __name__ == "__main__":
    for script in ("load_data.py", "Inital_analysis.py", "stat_analysis.py", "subset_analyze.py"):
        subprocess.run([sys.executable, script], check=True)

    # Analysis scripts save CSVs in data/results/.
    # Copy their outputs to the folder served by Vite.
    for filename in (
        "cell_frequencies.csv", "stat_results.csv", "subject_freq.csv",
        "baseline_samples.csv", "project_counts.csv", "response_counts.csv",
        "sex_counts.csv", "b_cell_answer.csv",
    ):
        shutil.copyfile("data/results/" + filename, "dashboard/public/data/" + filename)

    conn = sqlite3.connect("cell_count.db")
    summary = conn.execute("""
        SELECT
            (SELECT COUNT(*) FROM subjects),
            (SELECT COUNT(*) FROM samples),
            (SELECT COUNT(*) FROM cell_counts),
            (SELECT COUNT(DISTINCT cell_type) FROM cell_counts),
            (SELECT COUNT(DISTINCT project) FROM subjects)
    """).fetchone()
    conn.close()
    with open("data/results/database_summary.csv", "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["subjects", "samples", "measurements", "populations", "projects"])
        writer.writerow(summary)
    shutil.copyfile("data/results/database_summary.csv", "dashboard/public/data/database_summary.csv")
