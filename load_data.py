import sqlite3 as sq
import csv


csv_file_path = 'cell-count.csv'

connect = sq.connect('cell_count.db')
connect.execute("PRAGMA foreign_keys = ON")
cursor = connect.cursor()

connect.execute("""
CREATE TABLE IF NOT EXISTS subjects (
    subject TEXT PRIMARY KEY,
    project TEXT,
    condition TEXT,
    age INTEGER,
    sex TEXT,
    treatment TEXT,
    response TEXT,
    sample_type TEXT
)
""")

connect.execute("""
CREATE TABLE IF NOT EXISTS samples (
    sample TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    time_from_treatment_start INTEGER,
    FOREIGN KEY (subject) REFERENCES subjects(subject)
)
""")

connect.execute("""
CREATE TABLE IF NOT EXISTS cell_counts (
    sample TEXT NOT NULL,
    cell_type TEXT NOT NULL,
    count INTEGER,
    PRIMARY KEY (sample, cell_type),
    FOREIGN KEY (sample) REFERENCES samples(sample)
)
""")


cell_types = [
    "b_cell",
    "cd8_t_cell",
    "cd4_t_cell",
    "nk_cell",
    "monocyte"
]

with open(csv_file_path, 'r', newline = '') as file:
    reader = csv.DictReader(file)
    for row in reader:
        cursor.execute("""
        INSERT OR IGNORE INTO subjects (
            subject,
            project,
            condition,
            age,
            sex,
            treatment,
            response,
            sample_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)    
        """, (
            row['subject'], 
            row['project'], 
            row['condition'], 
            int(row['age']), 
            row['sex'], 
            row['treatment'], 
            row['response'], 
            row['sample_type']
        ))
        cursor.execute("""
        INSERT OR REPLACE INTO samples (
            sample,
            subject,
            time_from_treatment_start
        )
        VALUES (?, ?, ?)
        """, (
            row["sample"],
            row["subject"],
            int(row["time_from_treatment_start"])
        ))
        for cell_type in cell_types:
            cursor.execute("""
            INSERT OR REPLACE INTO cell_counts (
                sample,
                cell_type,
                count
            )
            VALUES (?, ?, ?)
            """, (
                row["sample"],
                cell_type,
                int(row[cell_type])
            ))

connect.commit()
connect.close()