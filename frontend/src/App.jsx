import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Resumes from "./components/Resumes";

const API_URL = import.meta.env.VITE_API_URL || "https://job-resume-matcher-hwz2.onrender.com";
const HISTORY_KEY = "resumeai_match_history";

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join("; ") : data.detail;
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return data;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setToken(null); setUser(null); setResumes([]); setJobs([]);
    setResult(null); setSelectedResume(""); setSelectedJob(""); setError("");
  }, []);

  const request = useCallback(async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (response.status === 401) {
      logout();
      throw new Error("Your session expired. Please sign in again.");
    }
    return readResponse(response);
  }, [token, logout]);

  const refreshData = useCallback(async () => {
    const [me, resumeList, jobList] = await Promise.all([
      request("/auth/me"), request("/resumes"), request("/jobs"),
    ]);
    setUser(me); setResumes(resumeList); setJobs(jobList);
  }, [request]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      Promise.all([request("/auth/me"), request("/resumes"), request("/jobs")])
        .then(([me, resumeList, jobList]) => {
          if (active) { setUser(me); setResumes(resumeList); setJobs(jobList); }
        })
        .catch((err) => { if (active) setError(err.message); })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, [token, request]);

  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }, [history]);

  const handleLogin = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      if (registering) {
        await readResponse(await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        }));
      }
      const form = new URLSearchParams({ username: email, password });
      const data = await readResponse(await fetch(`${API_URL}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form,
      }));
      localStorage.setItem("access_token", data.access_token);
      setToken(data.access_token); setPassword("");
    } catch (err) { setError(err.message || "Could not connect to the server."); }
    finally { setLoading(false); }
  };

  const handleMatch = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const data = await request(`/match/${selectedResume}/${selectedJob}`, { method: "POST" });
      const match = { ...data, owner_id: user?.id, completedAt: new Date().toISOString(), resume_filename: resumes.find((item) => item.id === data.resume_id)?.filename };
      setResult(match); setHistory((items) => [match, ...items]); setActivePage("results");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const userHistory = useMemo(() => history.filter((item) => item.owner_id === user?.id), [history, user?.id]);
  const average = useMemo(() => userHistory.length ? userHistory.reduce((sum, item) => sum + Number(item.match_percentage || 0), 0) / userHistory.length : null, [userHistory]);

  if (!token) return <div className="login-page"><form className="login-card" onSubmit={handleLogin}>
    <h1>ResumeAI</h1><p className="subtitle">{registering ? "Create an account to get started." : "Sign in to analyze resumes against job requirements."}</p>
    {error && <p className="error-message" role="alert">{error}</p>}
    {registering && <><label htmlFor="name">Name</label><input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required /></>}
    <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
    <label htmlFor="password">Password</label><input id="password" type="password" autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={registering ? 8 : undefined} required />
    <button type="button" className="secondary-button auth-toggle" onClick={() => { setRegistering((value) => !value); setError(""); }}>{registering ? "I already have an account" : "Create an account"}</button>
    <button type="submit" disabled={loading}>{loading ? "Please wait…" : registering ? "Create account" : "Sign in"}</button>
  </form></div>;

  const runAction = async (action) => {
    setError(""); setLoading(true);
    try { await action(); return true; } catch (err) { setError(err.message); return false; }
    finally { setLoading(false); }
  };

  return <div className="dashboard-layout">
    <Sidebar activePage={activePage} setActivePage={(page) => { setError(""); setActivePage(page); }} />
    <main className="dashboard-main">
      <header className="dashboard-topbar"><span>Welcome{user?.name ? `, ${user.name}` : " to ResumeAI"}</span><button className="logout-button" onClick={logout}>Logout</button></header>
      {error && <p className="error-message page-error" role="alert">{error}</p>}
      {loading && <p className="loading-message" role="status">Loading…</p>}
      {activePage === "dashboard" && <Dashboard resumes={resumes} jobs={jobs} matches={userHistory} average={average} onUpload={() => setActivePage("resumes")} onOpenResumes={() => setActivePage("resumes")} onOpenJobs={() => setActivePage("jobs")} onOpenMatches={() => setActivePage("analytics")} />}
      {activePage === "resumes" && <Resumes resumes={resumes} loading={loading} onUpload={(file) => runAction(async () => {
        const body = new FormData(); body.append("file", file);
        await request("/resumes/upload", { method: "POST", body }); await refreshData();
      })} onDelete={(id) => runAction(async () => { await request(`/resumes/${id}`, { method: "DELETE" }); await refreshData(); })} />}
      {activePage === "jobs" && <JobsPage jobs={jobs} loading={loading} onCreate={(title, description) => runAction(async () => {
        await request("/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description }) }); await refreshData();
      })} onDelete={(id) => runAction(async () => { await request(`/jobs/${id}`, { method: "DELETE" }); await refreshData(); })} />}
      {activePage === "matching" && <section className="content-card"><h1>Resume Matching</h1><p className="subtitle">Choose a resume and job description to compare skills.</p>
        {!resumes.length || !jobs.length ? <p>Add at least one resume and one job description before matching.</p> : <form className="form-stack" onSubmit={handleMatch}>
          <label htmlFor="resume-select">Resume</label><select id="resume-select" value={selectedResume} onChange={(event) => setSelectedResume(event.target.value)} required><option value="">Choose a resume</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.filename}</option>)}</select>
          <label htmlFor="job-select">Job description</label><select id="job-select" value={selectedJob} onChange={(event) => setSelectedJob(event.target.value)} required><option value="">Choose a job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select>
          <button disabled={loading}>{loading ? "Analyzing…" : "Analyze resume"}</button></form>}</section>}
      {activePage === "results" && <Results result={result} onBack={() => setActivePage("matching")} />}
      {activePage === "analytics" && <><Analytics resumes={resumes} jobs={jobs} history={userHistory} average={average} /><AnalyticsSkills history={userHistory} /></>}
      {activePage === "settings" && <section className="content-card"><h1>Settings</h1><p className="subtitle">Account details and session controls.</p><dl className="account-details"><dt>Name</dt><dd>{user?.name || "Unavailable"}</dd><dt>Email</dt><dd>{user?.email || "Unavailable"}</dd><dt>Account ID</dt><dd>{user?.id ?? "Unavailable"}</dd></dl><button className="danger-button" onClick={logout}>Logout</button></section>}
    </main>
  </div>;
}

function JobsPage({ jobs, onCreate, onDelete, loading }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const submit = async (event) => { event.preventDefault(); if (await onCreate(title, description)) { setTitle(""); setDescription(""); } };
  return <section className="content-card"><div className="section-heading"><div><h1>Job Descriptions</h1><p>Create and manage the roles you want to match.</p></div></div>
    <form className="form-stack job-form" onSubmit={submit}><label htmlFor="job-title">Job title</label><input id="job-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength="255" required />
      <label htmlFor="job-description">Job description</label><textarea id="job-description" value={description} onChange={(event) => setDescription(event.target.value)} rows="5" required /><button disabled={loading}>Create job</button></form>
    <h2>Available jobs ({jobs.length})</h2>{jobs.length ? <div className="item-list">{jobs.map((job) => <article className="list-item" key={job.id}><div><h3>{job.title}</h3><p>Job ID: {job.id}</p><p className="description-text">{job.description}</p><div className="job-skills" aria-label="Required skills">{job.required_skills?.length ? job.required_skills.map((skill) => <span className="skill required" key={skill}>{skill}</span>) : <span className="empty-note">No recognized skills found</span>}</div></div><button type="button" className="text-danger" disabled={loading} onClick={() => onDelete(job.id)}>Delete</button></article>)}</div> : <p>No job descriptions yet.</p>}
  </section>;
}

function Results({ result, onBack }) {
  if (!result) return <section className="content-card"><h1>Matching Results</h1><p>Run an analysis to see results here.</p><button onClick={onBack}>Go to matching</button></section>;
  return <section className="content-card"><div className="section-heading"><div><h1>Resume Match Analysis</h1><p>{result.job_title} · {result.resume_filename || `Resume ${result.resume_id}`}</p></div><button className="secondary-button" onClick={onBack}>Back to matching</button></div><div className="result-overview"><strong>{result.match_percentage}%</strong><span>Skill match</span></div><div className="skills-container">{[["Required skills", result.job_skills, "required"], ["Matched skills", result.matched_skills, "matched"], ["Missing skills", result.missing_skills, "missing"]].map(([heading, skills, style]) => <div className="skills-section" key={heading}><h3>{heading} ({skills?.length || 0})</h3>{skills?.length ? skills.map((skill) => <span className={`skill ${style}`} key={skill}>{skill}</span>) : <p>None identified</p>}</div>)}</div></section>;
}

function Analytics({ resumes, jobs, history, average }) {
  const gaps = history.flatMap((item) => item.missing_skills || []).reduce((counts, skill) => ({ ...counts, [skill]: (counts[skill] || 0) + 1 }), {});
  return <section className="content-card"><h1>Analytics</h1><p className="subtitle">Based on your resumes, jobs, and completed analyses in this browser.</p><div className="stats-container"><Stat title="Total resumes" value={resumes.length} /><Stat title="Total jobs" value={jobs.length} /><Stat title="Matches completed" value={history.length} /><Stat title="Average match" value={average === null ? "Unavailable" : `${average.toFixed(1)}%`} /></div><h2>Matching activity</h2>{history.length ? <div className="item-list">{history.map((item, index) => <article className="list-item" key={`${item.completedAt}-${index}`}><div><h3>{item.job_title}</h3><p>{item.resume_filename || `Resume ${item.resume_id}`} · {new Date(item.completedAt).toLocaleString()}</p></div><strong>{item.match_percentage}%</strong></article>)}</div> : <p>No matching activity recorded yet.</p>}<h2>Skill gaps</h2>{Object.keys(gaps).length ? <div className="skill-gap-list">{Object.entries(gaps).sort((a, b) => b[1] - a[1]).map(([skill, count]) => <span className="skill missing" key={skill}>{skill} · {count}</span>)}</div> : <p>No missing skills recorded yet.</p>}</section>;
}

function AnalyticsSkills({ history }) {
  const counts = {};
  history.forEach((match) => (match.matched_skills || []).forEach((skill) => { counts[skill] = (counts[skill] || 0) + 1; }));
  const frequent = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return <section className="content-card"><h2>Frequently matched skills</h2>{frequent.length ? <div className="skill-gap-list">{frequent.map(([skill, count]) => <span className="skill matched" key={skill}>{skill} — {count}</span>)}</div> : <p>No matched skills recorded yet.</p>}</section>;
}

function Stat({ title, value }) { return <article className="stat-card"><h3>{title}</h3><strong>{value}</strong></article>; }

export default App;
