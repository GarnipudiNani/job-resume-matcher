import "./Dashboard.css";

function Dashboard({ resumes, jobs, matches, average, onUpload, onOpenResumes, onOpenJobs, onOpenMatches }) {
  const recentResumes = [...resumes].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
  const recentJobs = [...jobs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
  const recentMatches = matches.slice(0, 5);
  return <div className="dashboard"><div className="dashboard-header"><div><h1>Dashboard Overview</h1><p>Your resume matching workspace at a glance.</p></div><button className="add-resume-btn" onClick={onUpload}>+ Upload Resume</button></div>
    <div className="stats-container"><Stat title="Total Resumes" value={resumes.length} note="Uploaded resumes" /><Stat title="Total Jobs" value={jobs.length} note="Job descriptions" /><Stat title="Matches Completed" value={matches.length} note="Saved in this browser" /><Stat title="Average Match Score" value={average === null ? "Unavailable" : `${average.toFixed(1)}%`} note={average === null ? "Complete an analysis to calculate" : "Across saved analyses"} /></div>
    <div className="dashboard-recent-grid">
      <RecentSection title="Recent resumes" empty="No resumes uploaded yet." onOpen={onOpenResumes}>
        {recentResumes.map((resume) => <RecentItem key={resume.id} title={resume.filename} detail={resume.created_at ? new Date(resume.created_at).toLocaleDateString() : "Upload date unavailable"} />)}
      </RecentSection>
      <RecentSection title="Recent jobs" empty="No job descriptions yet." onOpen={onOpenJobs}>
        {recentJobs.map((job) => <RecentItem key={job.id} title={job.title} detail={job.created_at ? new Date(job.created_at).toLocaleDateString() : "Date unavailable"} />)}
      </RecentSection>
      <RecentSection title="Recent matching activity" empty="No matching activity recorded in this browser." onOpen={onOpenMatches}>
        {recentMatches.map((match) => <RecentItem key={`${match.completedAt}-${match.resume_id}-${match.job_id}`} title={match.job_title} detail={`${match.resume_filename || `Resume ${match.resume_id}`} · ${match.match_percentage}% · ${new Date(match.completedAt).toLocaleDateString()}`} />)}
      </RecentSection>
    </div>
    <div className="welcome-card"><h2>Start Your Recruitment Analysis</h2><p>Upload resumes, add job descriptions and compare candidate skills with role requirements.</p></div>
  </div>;
}

function RecentSection({ title, empty, onOpen, children }) {
  return <section className="recent-card"><div className="recent-heading"><h2>{title}</h2><button type="button" className="text-link" onClick={onOpen}>View all</button></div>{children.length ? <div className="recent-list">{children}</div> : <p className="empty-note">{empty}</p>}</section>;
}

function RecentItem({ title, detail }) { return <article className="recent-item"><strong>{title}</strong><span>{detail}</span></article>; }

function Stat({ title, value, note }) { return <article className="stat-card"><h3>{title}</h3><strong>{value}</strong><p>{note}</p></article>; }
export default Dashboard;
