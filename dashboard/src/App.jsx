import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, CircularProgress, MenuItem, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField,
} from '@mui/material';
import { boxSummary, loadData } from './data.js';

const labels = { b_cell: 'B cells', cd8_t_cell: 'CD8 T cells', cd4_t_cell: 'CD4 T cells', nk_cell: 'NK cells', monocyte: 'Monocytes' };
const number = (value, digits = 0) => Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pValue = (value) => value < 0.0001 ? value.toExponential(2) : value.toFixed(4);

function downloadCsv(filename, rows, columns) {
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [columns.map((c) => quote(c.key)).join(','), ...rows.map((row) => columns.map((c) => quote(row[c.key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DataTable({ rows, columns, filename }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => setPage(0), [rows]);
  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / pageSize) - 1));
  return <>
    {filename && <div className="table-actions"><span>{number(rows.length)} {rows.length === 1 ? 'row' : 'rows'}</span><Button size="small" onClick={() => downloadCsv(filename, rows, columns)}>Download CSV</Button></div>}
    <TableContainer><Table size="small">
      <TableHead><TableRow>{columns.map((c) => <TableCell key={c.key} align={c.numeric ? 'right' : 'left'}>{c.label}</TableCell>)}</TableRow></TableHead>
      <TableBody>{rows.slice(safePage * pageSize, (safePage + 1) * pageSize).map((row, index) => <TableRow key={index} hover>
        {columns.map((c) => <TableCell key={c.key} align={c.numeric ? 'right' : 'left'}>{c.render ? c.render(row[c.key]) : row[c.key]}</TableCell>)}
      </TableRow>)}
      {!rows.length && <TableRow><TableCell colSpan={columns.length}>No matching rows. Try a different filter.</TableCell></TableRow>}
      </TableBody>
    </Table></TableContainer>
    {rows.length > 10 && <TablePagination component="div" count={rows.length} page={safePage} rowsPerPage={pageSize}
      onPageChange={(_, value) => setPage(value)} rowsPerPageOptions={[10, 25, 50]}
      onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} />}
  </>;
}

function Overview({ data }) {
  const overview = data.overview[0];
  return <section><h2>1. Data management</h2><p>Source: cell-count.csv. Loaded into SQLite as subjects, samples, and cell counts.</p>
    <dl className="counts">{[['subjects', 'Subjects'], ['samples', 'Samples'], ['populations', 'Cell populations'], ['projects', 'Projects']].map(([key, label]) =>
      <div key={key}><dt>{label}</dt><dd>{number(overview[key])}</dd></div>
    )}</dl>
    <h3>Database structure</h3>
    <DataTable rows={[
      { table: 'subjects', key: 'subject', contains: 'Project, condition, age, sex, treatment, response, sample type' },
      { table: 'samples', key: 'sample', contains: 'Subject and time from treatment start' },
      { table: 'cell_counts', key: 'sample + cell_type', contains: 'Count for each population in each sample' },
    ]} columns={[{ key: 'table', label: 'Table' }, { key: 'key', label: 'Primary key' }, { key: 'contains', label: 'Contents' }]} />
    <p className="note">One subject has multiple samples. Each sample has five cell-population counts. The analysis scripts query this database and save CSV files for these tabs.</p>
  </section>;
}

function Frequencies({ data }) {
  const [search, setSearch] = useState('');
  const [population, setPopulation] = useState('all');
  const rows = useMemo(() => data.frequencies.filter((row) => row.sample.toLowerCase().includes(search.trim().toLowerCase()) && (population === 'all' || row.population === population)), [data, search, population]);
  return <section><h2>2. Cell frequencies</h2><p>Percentage = population count / total count across all five populations × 100.</p>
    <div className="filters"><TextField size="small" label="Search sample ID" value={search} onChange={(e) => setSearch(e.target.value)} />
      <TextField select size="small" label="Population" value={population} onChange={(e) => setPopulation(e.target.value)}><MenuItem value="all">All populations</MenuItem>{Object.entries(labels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
      <Button onClick={() => { setSearch(''); setPopulation('all'); }}>Reset</Button>
    </div>
    <DataTable rows={rows} filename="cell_frequencies.csv" columns={[
      { key: 'sample', label: 'Sample' }, { key: 'total_count', label: 'Total count', numeric: true, render: (v) => number(v) },
      { key: 'population', label: 'Population' }, { key: 'count', label: 'Count', numeric: true, render: (v) => number(v) },
      { key: 'percentage', label: 'Percentage', numeric: true, render: (v) => `${number(v, 2)}%` },
    ]} />
  </section>;
}

function Boxplot({ population, boxes, max }) {
  const y = (value) => 200 - value / max * 170;
  return <div className="boxplot"><h4>{labels[population]}</h4>
    <svg viewBox="0 0 220 255" role="img" aria-label={`${labels[population]} boxplots for responders and non-responders`}>
      {Array.from({ length: 5 }, (_, i) => max * i / 4).map((tick) => <g key={tick}>
        <line x1="37" x2="210" y1={y(tick)} y2={y(tick)} stroke="#e5e7eb" />
        <text x="30" y={y(tick) + 4} textAnchor="end" fontSize="10" fill="#666">{number(tick, tick % 1 ? 1 : 0)}%</text>
      </g>)}
      {boxes.map((box, i) => {
        const x = 87 + i * 78, color = i === 0 ? '#326a85' : '#9a7851';
        return <g key={i}><title>{`${i === 0 ? 'Responders' : 'Non-responders'}: n=${box.n}, median ${box.median.toFixed(2)}%, Q1 ${box.q1.toFixed(2)}%, Q3 ${box.q3.toFixed(2)}%`}</title>
          <line x1={x} x2={x} y1={y(box.low)} y2={y(box.high)} stroke={color} />
          {[box.low, box.high].map((v, j) => <line key={j} x1={x - 10} x2={x + 10} y1={y(v)} y2={y(v)} stroke={color} />)}
          <rect x={x - 21} y={y(box.q3)} width="42" height={Math.max(1, y(box.q1) - y(box.q3))} fill={color} fillOpacity="0.18" stroke={color} />
          <line x1={x - 21} x2={x + 21} y1={y(box.median)} y2={y(box.median)} stroke={color} strokeWidth="2" />
          {box.outliers.map((value, j) => <circle key={j} cx={x} cy={y(value)} r="2" fill={color}><title>{value.toFixed(2)}%</title></circle>)}
          <text x={x} y="225" textAnchor="middle" fontSize="10">{i === 0 ? 'Responders' : 'Non-resp.'}</text>
          <text x={x} y="241" textAnchor="middle" fontSize="10" fill="#666">n = {box.n}</text>
        </g>;
      })}
    </svg>
  </div>;
}

function Comparison({ data }) {
  const stats = data.statistics;
  const significant = stats.filter((row) => row.significance);
  const plots = useMemo(() => Object.keys(labels).map((population) => ({ population,
    boxes: ['yes', 'no'].map((response) => boxSummary(data.subjects.filter((row) => row.population === population && row.response === response).map((row) => row.mean_percentage))),
  })), [data]);
  const max = Math.ceil(Math.max(...data.subjects.map((row) => row.mean_percentage)) / 10) * 10;
  return <section><h2>3. Treatment response</h2><p>Melanoma / miraclib / PBMC. Each subject contributes one mean percentage per population, averaged across treatment days.</p>
    <p className="finding">{significant.length ? significant.map((row) => `${labels[row.population]} are ${number(Math.abs(row.difference_pp), 2)} percentage points ${row.difference_pp > 0 ? 'higher' : 'lower'} in responders (Holm p = ${pValue(row.adj_p)}).`).join(' ') : 'No significant differences after Holm correction.'}</p>
    <div className="boxplots">{plots.map((plot) => <Boxplot key={plot.population} {...plot} max={max} />)}</div>
    <p className="note">Subject mean relative frequency (%). Boxes show the middle 50%; lines show medians. Whiskers extend to observations within 1.5 × IQR; dots show outliers.</p>
    <DataTable rows={stats} filename="stat_results.csv" columns={[
      { key: 'population', label: 'Population', render: (v) => labels[v] },
      { key: 'responder_mean', label: 'Responder mean', numeric: true, render: (v) => `${number(v, 2)}%` },
      { key: 'nonresponder_mean', label: 'Non-responder mean', numeric: true, render: (v) => `${number(v, 2)}%` },
      { key: 'difference_pp', label: 'Difference (pp)', numeric: true, render: (v) => number(v, 2) },
      { key: 'p_value', label: 'Raw p', numeric: true, render: pValue },
      { key: 'adj_p', label: 'Holm p', numeric: true, render: pValue },
      { key: 'significance', label: 'Significant', render: (v) => v ? 'Yes' : 'No' },
    ]} />
    <p className="note">Two-sided Welch t-tests, Holm correction across five populations, α = 0.05. Difference = responders minus non-responders. These are exploratory associations, not validated predictions.</p>
  </section>;
}

function Baseline({ data }) {
  const [project, setProject] = useState('all');
  const rows = useMemo(() => data.baseline.filter((row) => project === 'all' || row.project === project), [data, project]);
  const names = { yes: 'Responders', no: 'Non-responders', M: 'Male', F: 'Female' };
  return <section><h2>4. Baseline analysis</h2><p>Melanoma / miraclib / PBMC samples at day 0. Summaries count all qualifying baseline samples or distinct subjects.</p>
    <div className="summaries">{[
      ['projects', 'project', 'sample_count', 'Samples by project'],
      ['responses', 'response', 'subject_count', 'Subjects by response'],
      ['sexes', 'sex', 'subject_count', 'Subjects by sex'],
    ].map(([key, field, count, title]) => <div key={key}><h3>{title}</h3><DataTable rows={data[key]} columns={[
      { key: field, label: field === 'sex' ? 'Sex' : field === 'response' ? 'Response' : 'Project', render: (v) => names[v] || v || 'Unknown' },
      { key: count, label: 'Count', numeric: true },
    ]} /></div>)}</div>
    <h3>Average B-cell count</h3>
    <p>Male melanoma responders at day 0, across <strong>all treatments and sample types</strong>: <strong className="answer">{data.bCells[0].mean_b_cells.toFixed(2)}</strong> cells ({number(data.bCells[0].sample_count)} samples).</p>
    <h3>Baseline samples</h3><div className="filters"><TextField select size="small" label="Project" value={project} onChange={(e) => setProject(e.target.value)}>
      <MenuItem value="all">All projects</MenuItem>{data.projects.map((row) => <MenuItem key={row.project} value={row.project}>{row.project}</MenuItem>)}
    </TextField><span className="note">Filter applies to the sample table only.</span></div>
    <DataTable rows={rows} filename="baseline_samples.csv" columns={[
      { key: 'sample', label: 'Sample' }, { key: 'subject', label: 'Subject' }, { key: 'project', label: 'Project' },
      { key: 'response', label: 'Response', render: (v) => names[v] || v || 'Unknown' },
      { key: 'sex', label: 'Sex', render: (v) => names[v] || v || 'Unknown' },
    ]} />
  </section>;
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal).then(setData).catch((reason) => {
      if (reason.name !== 'AbortError') setError('CSV results could not be loaded. Run python pipeline.py in the repository root, then refresh.');
    });
    return () => controller.abort();
  }, []);
  const parts = [Overview, Frequencies, Comparison, Baseline];
  const Part = parts[tab];
  return <main><h1>Immune cell analysis</h1>
    <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth" aria-label="Analysis parts">
      {[1, 2, 3, 4].map((part) => <Tab key={part} label={`Part ${part}`} id={`tab-${part}`} aria-controls={`panel-${part}`} />)}
    </Tabs>
    {error ? <Alert severity="error">{error}</Alert> : !data ? <div className="loading"><CircularProgress size={24} /><span>Loading CSV results...</span></div> :
      <div role="tabpanel" id={`panel-${tab + 1}`} aria-labelledby={`tab-${tab + 1}`} key={tab}><Part data={data} /></div>}
  </main>;
}
