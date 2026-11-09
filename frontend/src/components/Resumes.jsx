import { useRef } from "react";
import "./Resumes.css";

function Resumes({ resumes, onUpload, onDelete, loading }) {
  const inputRef = useRef(null);
  const upload = (event) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  };
  return <section className="resumes-page content-card">
    <div className="resumes-header"><div><h1>Resume Management</h1><p>Upload and manage your PDF and DOCX resumes.</p></div>
      <button className="upload-resume-btn" disabled={loading} onClick={() => inputRef.current?.click()}>{loading ? "Uploading…" : "+ Upload Resume"}</button>
      <input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={upload} />
    </div>
    <div className="resume-summary"><h3>Total Resumes</h3><h2>{resumes.length}</h2></div>
    <div className="resume-list"><h2>Uploaded Resumes</h2>
      {resumes.length ? resumes.map((resume) => <article className="resume-item" key={resume.id}><div><h3>{resume.filename}</h3><p>Resume ID: {resume.id}</p><p>Uploaded {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : "date unavailable"}</p></div><button className="text-danger" disabled={loading} onClick={() => onDelete(resume.id)}>Delete</button></article>) : <p>No resumes uploaded yet.</p>}
    </div>
  </section>;
}

export default Resumes;
