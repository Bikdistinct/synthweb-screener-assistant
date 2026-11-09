import {useEffect, useState} from "react";
import {
    FileText,
    History as HistoryIcon,
    Sparkles,
    Search,
    Upload,
    ArrowLeft,
    Trash2,
    CheckCircle2,
    AlertCircle,
    BriefcaseBusiness,
    ShieldCheck,
    X,
    FileCheck,
    Filter,
    RefreshCw,
    ChevronRight,
    Menu,
} from "lucide-react";

import {analyze, history, deleteAnalysis} from "./api";
import type {Analysis, History as HistoryData} from "./types";

const dateLabel = (d: string) => new Date(d).toLocaleString();

function Score({value}: {value: number}) {
    const color = value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";

    return (
        <div className="flex items-center gap-4">
            <div
                className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full shadow-inner"
                style={{
                    background: `conic-gradient(${color} ${value * 3.6}deg, #e2e8f0 0deg)`,
                }}
            >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm">
                    <span className="text-xl font-black text-slate-900">{value}</span>
                </div>
            </div>

            <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Match score</div>
                <div className="text-sm font-semibold text-slate-800">
                    {value >= 75 ? "Strong Candidate Fit" : value >= 50 ? "Moderate Match" : "Substantial Gaps"}
                </div>
                <div className="text-[11px] text-slate-500">Based on evaluated criteria</div>
            </div>
        </div>
    );
}

function ScoreBadge({score}: {score: number}) {
    const style =
        score >= 75
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : score >= 50
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-red-50 text-red-700 border-red-200";

    return <span className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${style}`}>{score}/100</span>;
}

function ReportView({item, back}: {item: Analysis; back: () => void}) {
    const r = item.report;

    return (
        <div className="animate-in fade-in space-y-6 duration-200">
            <button
                onClick={back}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
                <ArrowLeft size={15} />
                Back to assessments
            </button>

            {/* Overview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            Assessment Report #{item.id}
                        </span>

                        <h2 className="mt-1 text-2xl font-black text-slate-900">{r.candidate_name}</h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Evaluated on {dateLabel(item.created_at)} · Engine: {item.provider}
                        </p>
                    </div>

                    <Score value={r.match_score} />
                </div>

                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Assessment Rationale & Synthesis
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{r.score_rationale}</p>
                </div>
            </div>

            {/* Skills */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        Matching Skills (Top {r.matching_skills.length})
                    </div>

                    <div className="space-y-3.5">
                        {r.matching_skills.map((x, i) => (
                            <div key={i} className="rounded-xl border border-emerald-100/60 bg-emerald-50/50 p-3">
                                <div className="text-xs font-semibold text-emerald-950">{x.skill}</div>
                                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{x.evidence}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <AlertCircle size={18} className="text-amber-600" />
                        Skill Gaps / Not Evidenced (Top {r.skill_gaps.length})
                    </div>

                    <div className="space-y-3.5">
                        {r.skill_gaps.map((x, i) => (
                            <div key={i} className="rounded-xl border border-amber-100/60 bg-amber-50/50 p-3">
                                <div className="text-xs font-semibold text-amber-950">{x.skill}</div>
                                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{x.evidence}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Interview Questions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Sparkles size={16} className="text-blue-600" />
                    Tailored Interview Questions ({r.interview_questions.length})
                </h3>

                <div className="space-y-4">
                    {r.interview_questions.map((x, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                        >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                                {i + 1}
                            </span>

                            <div className="min-w-0">
                                <p className="text-xs font-semibold leading-snug text-slate-900 sm:text-sm">
                                    {x.question}
                                </p>
                                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                                    <span className="font-semibold text-slate-700">Rationale: </span>
                                    {x.rationale}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                <b>Notice:</b> AI scoring and question generation are advisory. Missing resume evidence does not
                definitively prove the absence of a skill. Apply consistent, structured human review.
            </div>
        </div>
    );
}

export default function App() {
    const [page, setPage] = useState<"new" | "history">("new");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [jd, setJd] = useState("");
    const [jdFile, setJdFile] = useState<File>();
    const [resume, setResume] = useState("");
    const [file, setFile] = useState<File>();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<Analysis | null>(null);
    const [items, setItems] = useState<HistoryData | null>(null);

    const [query, setQuery] = useState("");
    const [min, setMin] = useState("");
    const [max, setMax] = useState("");

    const [notice, setNotice] = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (jd.trim().length < 30 && !jdFile) {
            return setError("Please paste a job description (30+ characters) or upload a PDF/DOCX file.");
        }

        if (!resume.trim() && !file) {
            return setError("Please paste candidate resume text or upload a PDF file.");
        }

        setLoading(true);

        try {
            const result = await analyze(jd, resume, file, jdFile);
            setSelected(result);
            setNotice("Assessment complete and saved to history.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please retry.");
        } finally {
            setLoading(false);
        }
    }

    async function loadHistory() {
        const p = new URLSearchParams({
            query,
            limit: "50",
            offset: "0",
        });

        if (min) p.set("min_score", min);
        if (max) p.set("max_score", max);

        try {
            setItems(await history(p));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load history.");
        }
    }

    useEffect(() => {
        if (page === "history") {
            loadHistory();
        }
    }, [page]);

    async function remove(id: number) {
        if (!confirm("Delete this analysis?")) return;

        try {
            await deleteAnalysis(id);
            await loadHistory();

            if (selected?.id === id) {
                setSelected(null);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not delete this analysis.");
        }
    }

    const changePage = (next: "new" | "history") => {
        setPage(next);
        setSelected(null);
        setError("");
        setNotice("");
        setMobileMenuOpen(false);
    };

    const nav = (
        <aside className="hidden h-screen min-h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-5 lg:sticky lg:top-0 lg:flex">
            <div>
                <div className="mb-6 flex items-center gap-3 px-2 py-2">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                        <BriefcaseBusiness size={20} />
                    </div>

                    <div>
                        <div className="font-bold leading-tight text-slate-900">Synthweb</div>
                        <div className="text-xs font-medium text-slate-500">Resume Screener</div>
                    </div>
                </div>

                <nav className="space-y-1.5">
                    <button
                        onClick={() => changePage("new")}
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                            page === "new"
                                ? "bg-blue-50 font-semibold text-blue-700"
                                : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <Sparkles size={18} className={page === "new" ? "text-blue-600" : "text-slate-400"} />
                        New assessment
                    </button>

                    <button
                        onClick={() => changePage("history")}
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                            page === "history"
                                ? "bg-blue-50 font-semibold text-blue-700"
                                : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <HistoryIcon size={18} className={page === "history" ? "text-blue-600" : "text-slate-400"} />
                        Analysis history
                        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {items?.total ?? 0}
                        </span>
                    </button>
                </nav>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs leading-5 text-slate-500">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-800">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Privacy First
                </div>
                Documents are processed for analysis and not stored by this app. Only the generated report is saved.
            </div>
        </aside>
    );

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 antialiased lg:flex-row">
            {/* Mobile Header */}
            <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
                <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
                        <BriefcaseBusiness size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-bold leading-tight text-slate-900">Synthweb</div>
                        <div className="text-[11px] text-slate-500">Resume Screener</div>
                    </div>
                </div>

                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    aria-label="Toggle navigation"
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="z-30 space-y-2 border-b border-slate-200 bg-white px-4 py-3 shadow-md lg:hidden">
                    <button
                        onClick={() => changePage("new")}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                            page === "new" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <Sparkles size={18} />
                        New assessment
                    </button>

                    <button
                        onClick={() => changePage("history")}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                            page === "history" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <HistoryIcon size={18} />
                        Analysis history
                        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                            {items?.total ?? 0}
                        </span>
                    </button>
                </div>
            )}

            {nav}

            {/* Main Content */}
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
                <header className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                        Internal HR Tooling · Production Screener
                    </p>

                    <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        {page === "new" ? "Candidate assessment" : "Analysis history"}
                    </h1>

                    <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                        {page === "new"
                            ? "Evaluate candidate resumes against role requirements with structured validation."
                            : "Search, filter, and inspect previous candidate match reports."}
                    </p>
                </header>

                {/* Alerts */}
                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                        <div className="flex-1 font-medium">{error}</div>
                        <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {notice && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                        <div className="flex-1 font-medium">{notice}</div>
                        <button onClick={() => setNotice("")} className="text-emerald-500 hover:text-emerald-700">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {selected ? (
                    <ReportView item={selected} back={() => setSelected(null)} />
                ) : page === "new" ? (
                    /* Assessment Form */
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {/* Job Description */}
                            <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
                                            <BriefcaseBusiness size={16} />
                                        </div>

                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900">1. Job Description</h2>
                                            <p className="text-[11px] text-slate-500">
                                                Paste requirements or upload document
                                            </p>
                                        </div>
                                    </div>

                                    <span className="font-mono text-xs text-slate-400">
                                        {jd.length.toLocaleString()} chars
                                    </span>
                                </div>

                                <textarea
                                    rows={8}
                                    value={jd}
                                    onChange={(e) => {
                                        setJd(e.target.value);
                                        if (e.target.value) setJdFile(undefined);
                                    }}
                                    disabled={!!jdFile}
                                    placeholder="Paste role requirements, tech stack expectations, responsibilities..."
                                    className="w-full resize-y rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400 sm:text-sm"
                                />

                                <div className="my-3 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Or Upload File
                                    </span>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>

                                {jdFile ? (
                                    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <FileCheck size={18} className="shrink-0 text-blue-600" />
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-slate-800">
                                                    {jdFile.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {(jdFile.size / 1024).toFixed(1)} KB · Attached
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setJdFile(undefined)}
                                            className="ml-2 shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 transition hover:border-blue-400 hover:bg-blue-50/30">
                                        <Upload size={18} className="shrink-0 text-slate-400" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium text-slate-700">Choose JD file</div>
                                            <div className="text-[10px] text-slate-400">PDF or DOCX · Max 10 MB</div>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            className="hidden"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) {
                                                    setJdFile(f);
                                                    setJd("");
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </section>

                            {/* Candidate Resume */}
                            <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-700">
                                            <FileText size={16} />
                                        </div>

                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900">2. Candidate Resume</h2>
                                            <p className="text-[11px] text-slate-500">
                                                Paste text or attach candidate PDF
                                            </p>
                                        </div>
                                    </div>

                                    <span className="font-mono text-xs text-slate-400">
                                        {resume.length.toLocaleString()} chars
                                    </span>
                                </div>

                                <textarea
                                    rows={8}
                                    value={resume}
                                    onChange={(e) => {
                                        setResume(e.target.value);
                                        if (e.target.value) setFile(undefined);
                                    }}
                                    disabled={!!file}
                                    placeholder="Paste resume experience, skills, education or portfolio notes..."
                                    className="w-full resize-y rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400 sm:text-sm"
                                />

                                <div className="my-3 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Or Upload PDF
                                    </span>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>

                                {file ? (
                                    <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <FileCheck size={18} className="shrink-0 text-violet-600" />
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-slate-800">
                                                    {file.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {(file.size / 1024).toFixed(1)} KB · Attached
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setFile(undefined)}
                                            className="ml-2 shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 transition hover:border-violet-400 hover:bg-violet-50/30">
                                        <Upload size={18} className="shrink-0 text-slate-400" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium text-slate-700">Choose Resume PDF</div>
                                            <div className="text-[10px] text-slate-400">PDF Document · Max 10 MB</div>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            className="hidden"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) {
                                                    setFile(f);
                                                    setResume("");
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </section>
                        </div>

                        {/* Submit Bar */}
                        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-900 p-5 text-white shadow-md sm:flex-row">
                            <div>
                                <div className="text-sm font-semibold sm:text-base">Ready to evaluate match?</div>
                                <p className="mt-0.5 text-xs text-slate-300">
                                    Generates a match score, skill analysis, gaps and tailored interview questions.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-sm"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Generate Match Report
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* History Dashboard */
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                <div className="relative sm:col-span-2">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && loadHistory()}
                                        placeholder="Search candidate name..."
                                        className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 sm:text-sm"
                                    />
                                </div>

                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={min}
                                    onChange={(e) => setMin(e.target.value)}
                                    placeholder="Min score (0-100)"
                                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 sm:text-sm"
                                />

                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={max}
                                    onChange={(e) => setMax(e.target.value)}
                                    placeholder="Max score (0-100)"
                                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 sm:text-sm"
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={loadHistory}
                                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                    <Filter size={13} />
                                    Apply Filters
                                </button>

                                {(query || min || max) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery("");
                                            setMin("");
                                            setMax("");
                                            setTimeout(loadHistory, 0);
                                        }}
                                        className="text-xs font-medium text-slate-500 hover:text-slate-800"
                                    >
                                        Reset filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Candidate List */}
                        <div className="space-y-3">
                            {items?.items.length ? (
                                items.items.map((x) => (
                                    <div
                                        key={x.id}
                                        className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center"
                                    >
                                        <div className="flex min-w-0 items-start gap-3.5">
                                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                                                {x.candidate_name.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                                                        {x.candidate_name}
                                                    </h3>
                                                    <span className="font-mono text-[10px] text-slate-400">
                                                        #{x.id}
                                                    </span>
                                                </div>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {dateLabel(x.created_at)}
                                                </p>

                                                <div className="mt-1 text-[11px] text-slate-600">
                                                    <span className="font-medium text-slate-700">Provider:</span>{" "}
                                                    Assessment engine
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:justify-end sm:border-0 sm:pt-0">
                                            <ScoreBadge score={x.match_score} />

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(x)}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                >
                                                    View Report
                                                    <ChevronRight size={14} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => remove(x.id)}
                                                    title="Delete record"
                                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                                    <p className="font-medium text-slate-700">No records found.</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Try changing your search terms or score filters.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="text-right text-xs text-slate-400">
                            Showing {items?.items.length ?? 0} of {items?.total ?? 0} assessments
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs leading-5 text-slate-400">
                    Synthweb Resume Screener Assistant · Advisory evaluation system · Designed for Human-in-the-Loop HR
                    decisions.
                </footer>
            </main>
        </div>
    );
}
