import { useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJob, setSelectedJob] = useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setEmail("");
    setPassword("");
    setResumes([]);
    setJobs([]);
    setSelectedResume("");
    setSelectedJob("");
    setResult(null);
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const loginResponse = await fetch(
        "http://127.0.0.1:8000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        alert(loginData.detail || "Login failed");
        return;
      }

      const token = loginData.access_token;

      localStorage.setItem("access_token", token);

      // Get resumes
      const resumeResponse = await fetch(
        "http://127.0.0.1:8000/resumes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const resumeData = await resumeResponse.json();

      if (!resumeResponse.ok) {
        alert(resumeData.detail || "Could not load resumes");
        return;
      }

      setResumes(resumeData);

      // Get jobs
      const jobResponse = await fetch(
        "http://127.0.0.1:8000/jobs",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const jobData = await jobResponse.json();

      if (!jobResponse.ok) {
        alert(jobData.detail || "Could not load jobs");
        return;
      }

      setJobs(jobData);

      alert("Login successful!");
    } catch (error) {
      console.error(error);
      alert("Could not connect to the server");
    } finally {
      setLoading(false);
    }
  };

  // Resume matching
  const handleMatch = async () => {
    if (!selectedResume || !selectedJob) {
      alert("Please select a resume and a job");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `http://127.0.0.1:8000/match/${selectedResume}/${selectedJob}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Matching failed");
        return;
      }

      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Could not connect to the server");
    } finally {
      setLoading(false);
    }
  };

  // Result page
  if (result) {
    return (
      <div className="result-page">
        <div className="result-card">

          <h1>Resume Match Analysis</h1>

          <h2>{result.job_title}</h2>

          <div className="match-score">
            {result.match_percentage}%
          </div>

          <p className="score-label">
            Match Percentage
          </p>

          <div className="skills-container">

            {/* Required Skills */}
            <div className="skills-section">
              <h3>Required Skills</h3>

              {result.job_skills.map((skill) => (
                <div
                  className="skill required"
                  key={skill}
                >
                  {skill}
                </div>
              ))}
            </div>

            {/* Matched Skills */}
            <div className="skills-section">
              <h3>Matched Skills</h3>

              {result.matched_skills.map((skill) => (
                <div
                  className="skill matched"
                  key={skill}
                >
                  ✓ {skill}
                </div>
              ))}
            </div>

            {/* Missing Skills */}
            <div className="skills-section">
              <h3>Missing Skills</h3>

              {result.missing_skills.length > 0 ? (
                result.missing_skills.map((skill) => (
                  <div
                    className="skill missing"
                    key={skill}
                  >
                    ⚠ {skill}
                  </div>
                ))
              ) : (
                <p>No missing skills</p>
              )}
            </div>

          </div>

          <button
            className="back-button"
            onClick={() => setResult(null)}
          >
            Analyze Another
          </button>

        </div>
      </div>
    );
  }

  // Resume and Job selection page
  if (resumes.length > 0 && jobs.length > 0) {
    return (
      <div className="selection-page">

        <div className="selection-card">

          {/* Header + Logout */}
          <div className="top-bar">
            <h1>Resume Matcher</h1>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <p className="subtitle">
            Select a resume and job to analyze the skill match
          </p>

          {/* Resume Selection */}
          <label>Select Resume</label>

          <select
            value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}
          >
            <option value="">
              Choose a resume
            </option>

            {resumes.map((resume) => (
              <option
                key={resume.id}
                value={resume.id}
              >
                {resume.filename}
              </option>
            ))}
          </select>

          {/* Job Selection */}
          <label>Select Job</label>

          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
          >
            <option value="">
              Choose a job
            </option>

            {jobs.map((job) => (
              <option
                key={job.id}
                value={job.id}
              >
                {job.title}
              </option>
            ))}
          </select>

          {/* Analyze Button */}
          <button
            onClick={handleMatch}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

        </div>
      </div>
    );
  }

  // Login page
  return (
    <div className="login-page">

      <div className="login-card">

        <h1>Resume Matcher</h1>

        <p className="subtitle">
          Login to analyze your resume against job requirements
        </p>

        <form onSubmit={handleLogin}>

          {/* Email */}
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password */}
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default App;