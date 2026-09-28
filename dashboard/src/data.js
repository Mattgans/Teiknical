import Papa from 'papaparse';

// These are the CSV files written by the four Python scripts.
const files = {
  overview: ['database_summary.csv', 'samples'],
  frequencies: ['cell_frequencies.csv', 'percentage'],
  statistics: ['stat_results.csv', 'adj_p'],
  subjects: ['subject_freq.csv', 'mean_percentage'],
  baseline: ['baseline_samples.csv', 'sample'],
  projects: ['project_counts.csv', 'sample_count'],
  responses: ['response_counts.csv', 'subject_count'],
  sexes: ['sex_counts.csv', 'subject_count'],
  bCells: ['b_cell_answer.csv', 'mean_b_cells'],
};

export async function loadData(signal) {
  const entries = await Promise.all(Object.entries(files).map(async ([key, [file, column]]) => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`, { signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load ${file}`);
    const parsed = Papa.parse(await response.text(), {
      header: true, dynamicTyping: true, skipEmptyLines: true,
      // pandas writes booleans as True/False; normalize before type conversion.
      transform: (value) => value === 'True' ? 'true' : value === 'False' ? 'false' : value,
    });
    if (parsed.errors.length || !parsed.meta.fields.includes(column) || !parsed.data.length) {
      throw new Error(`Missing or invalid data in ${file}`);
    }
    return [key, parsed.data];
  }));
  return Object.fromEntries(entries);
}

// Only plot geometry is calculated here. Tests and group means come from Python.
export function boxSummary(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const quantile = (p) => {
    const index = (sorted.length - 1) * p;
    const low = Math.floor(index);
    return sorted[low] + (sorted[Math.ceil(index)] - sorted[low]) * (index - low);
  };
  const q1 = quantile(0.25), median = quantile(0.5), q3 = quantile(0.75);
  const iqr = q3 - q1;
  const inside = sorted.filter((value) => value >= q1 - 1.5 * iqr && value <= q3 + 1.5 * iqr);
  const low = inside[0], high = inside[inside.length - 1];
  return { n: sorted.length, q1, median, q3, low, high, outliers: sorted.filter((value) => value < low || value > high) };
}
