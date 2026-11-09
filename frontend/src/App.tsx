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
} from "lucide-react";
import {analyze, history, deleteAnalysis} from "./api";
import type {Analysis, History as HistoryData} from "./types";

const dateLabel = (d: string) => new Date(d).toLocaleString();
function Score({value}: {value: number}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="relative grid h-20 w-20 place-items-center rounded-full"
                style={{background: `conic-gradient(#2563eb ${value * 3.6}deg,#e8edf5 0)`}}
            >
                <div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white text-xl font-bold">
                    {value}
                </div>
            </div>
            <div>
                <div className="font-semibold text-slate-800">Match score</div>
                <div className="text-sm text-slate-500">Evidence-based relevance estimate</div>
            </div>
        </div>
    );
}
function ReportView({item, back}: {item: Analysis; back: () => void}) {
    const r = item.report;
    return (
        <div className="space-y-5">
            <button onClick={back} className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                <ArrowLeft size={16} /> Back
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                            Assessment report #{item.id}
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">{r.candidate_name}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Created {dateLabel(item.created_at)} · Provider: {item.provider}
                        </p>
                    </div>
                    <Score value={r.match_score} />
                </div>
                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                    <h3 className="font-semibold">Assessment summary</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{r.score_rationale}</p>
                </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="text-emerald-600" size={18} /> Matching skills
                    </h3>
                    <div className="space-y-4">
                        {r.matching_skills.map((x, i) => (
                            <div key={i}>
                                <div className="font-medium">{x.skill}</div>
                                <p className="mt-1 text-sm text-slate-500">{x.evidence}</p>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-2xl border bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                        <AlertCircle className="text-amber-600" size={18} /> Gaps / not evidenced
                    </h3>
                    <div className="space-y-4">
                        {r.skill_gaps.map((x, i) => (
                            <div key={i}>
                                <div className="font-medium">{x.skill}</div>
                                <p className="mt-1 text-sm text-slate-500">{x.evidence}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            <section className="rounded-2xl border bg-white p-5">
                <h3 className="mb-4 font-semibold">Suggested interview questions</h3>
                <div className="space-y-4">
                    {r.interview_questions.map((x, i) => (
                        <div key={i} className="flex gap-3">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700">
                                {i + 1}
                            </span>
                            <div>
                                <p className="font-medium">{x.question}</p>
                                <p className="mt-1 text-sm text-slate-500">{x.rationale}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <p className="text-xs leading-5 text-slate-500">
                Decision-support only. Verify evidence and apply consistent, job-related human review. A missing resume
                signal does not prove the candidate lacks a skill.
            </p>
        </div>
    );
}
export default function App() {
    const [page, setPage] = useState<"new" | "history">("new");
    // const [jd,setJd] = useState(''), [resume,setResume] = useState(''), [file,setFile] = useState<File>()
    const [jd, setJd] = useState("");
    const [jdFile, setJdFile] = useState<File>();
    const [resume, setResume] = useState("");
    const [file, setFile] = useState<File>();
    const [loading, setLoading] = useState(false),
        [error, setError] = useState("");
    const [selected, setSelected] = useState<Analysis | null>(null);
    const [items, setItems] = useState<HistoryData | null>(null);
    const [query, setQuery] = useState(""),
        [min, setMin] = useState(""),
        [max, setMax] = useState("");
    const [notice, setNotice] = useState("");
    // async function submit(e: React.FormEvent) {
    //   e.preventDefault(); setError(''); setNotice('')
    //   if (jd.trim().length < 30) return setError('Add a job description with at least 30 characters.')
    //   if (!resume.trim() && !file) return setError('Paste resume text or upload a PDF.')
    //   setLoading(true)
    //   try { const result = await analyze(jd,resume,file); setSelected(result); setNotice('Analysis saved to history.') }
    //   catch(err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please retry.') }
    //   finally { setLoading(false) }
    // }
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (jd.trim().length < 30 && !jdFile) {
            return setError("Paste a job description with at least 30 characters or upload a PDF/DOCX.");
        }

        if (!resume.trim() && !file) {
            return setError("Paste resume text or upload a PDF.");
        }

        setLoading(true);

        try {
            const result = await analyze(jd, resume, file, jdFile);
            setSelected(result);
            setNotice("Analysis saved to history.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please retry.");
        } finally {
            setLoading(false);
        }
    }
    async function loadHistory() {
        const p = new URLSearchParams({query, limit: "50", offset: "0"});
        if (min) p.set("min_score", min);
        if (max) p.set("max_score", max);
        try {
            setItems(await history(p));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load history.");
        }
    }
    useEffect(() => {
        if (page === "history") loadHistory();
    }, [page]);
    async function remove(id: number) {
        if (!confirm("Delete this analysis?")) return;
        await deleteAnalysis(id);
        loadHistory();
    }
    const nav = (
        <aside className="w-full border-b bg-white p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 px-2 py-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                    <BriefcaseBusiness size={20} />
                </div>
                <div>
                    <div className="font-bold">Synthweb</div>
                    <div className="text-xs text-slate-500">Resume Screener</div>
                </div>
            </div>
            <nav className="mt-5 flex gap-2 lg:flex-col">
                <button
                    onClick={() => {
                        setPage("new");
                        setSelected(null);
                        setError("");
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                        page === "new" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    <Sparkles size={18} /> New assessment
                </button>
                <button
                    onClick={() => {
                        setPage("history");
                        setSelected(null);
                        setError("");
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                        page === "history" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    <HistoryIcon size={18} /> Analysis history
                </button>
            </nav>
            <div className="mt-8 hidden rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 lg:block">
                <ShieldCheck size={18} className="mb-2 text-emerald-600" />
                <b className="block text-slate-700">Privacy first</b>Documents are processed for analysis and not stored
                by this app. Only the generated report is saved.
            </div>
        </aside>
    );
    return (
        <div className="min-h-screen lg:flex">
            {nav}
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
                <header className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">
                        People operations · Internal tool
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {page === "new" ? "Candidate assessment" : "Analysis history"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        {page === "new"
                            ? "Compare candidate experience with the role requirements."
                            : "Review, search and filter previous assessments."}
                    </p>
                </header>
                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                {notice && (
                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                        {notice}
                    </div>
                )}
                {selected ? (
                    <ReportView item={selected} back={() => setSelected(null)} />
                ) : page === "new" ? (
                    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
                        {/* <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                                    <BriefcaseBusiness size={18} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Job description</h2>
                                    <p className="text-xs text-slate-500">Paste the full role requirements</p>
                                </div>
                            </div>
                            <textarea
                                value={jd}
                                onChange={(e) => setJd(e.target.value)}
                                required
                                minLength={30}
                                placeholder="Paste job title, responsibilities, required skills and qualifications..."
                                className="h-80 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <div className="mt-2 text-right text-xs text-slate-400">
                                {jd.length.toLocaleString()} characters
                            </div>
                        </section> */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                                    <BriefcaseBusiness size={18} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Job description</h2>
                                    <p className="text-xs text-slate-500">
                                        Paste the role requirements or upload a document
                                    </p>
                                </div>
                            </div>

                            <textarea
                                value={jd}
                                onChange={(e) => {
                                    setJd(e.target.value);
                                    if (e.target.value) setJdFile(undefined);
                                }}
                                placeholder="Paste job title, responsibilities, required skills and qualifications..."
                                className="h-64 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                            <div className="mt-2 text-right text-xs text-slate-400">
                                {jd.length.toLocaleString()} characters
                            </div>

                            <div className="my-4 flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-100" />
                                <span className="text-xs text-slate-400">OR UPLOAD DOCUMENT</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 hover:border-blue-400 hover:bg-blue-50/40">
                                <Upload className="text-slate-500" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium">
                                        {jdFile?.name || "Choose a job description"}
                                    </div>
                                    <div className="text-xs text-slate-400">PDF or DOCX · Max 10 MB (configurable)</div>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="hidden"
                                    onChange={(e) => {
                                        const selectedFile = e.target.files?.[0];
                                        setJdFile(selectedFile);
                                        if (selectedFile) setJd("");
                                    }}
                                />
                            </label>
                        </section>
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-700">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Candidate resume</h2>
                                    <p className="text-xs text-slate-500">Paste text or upload a PDF</p>
                                </div>
                            </div>
                            <textarea
                                value={resume}
                                onChange={(e) => {
                                    setResume(e.target.value);
                                    if (e.target.value) setFile(undefined);
                                }}
                                placeholder="Paste resume content here..."
                                className="h-52 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <div className="my-4 flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-100" />
                                <span className="text-xs text-slate-400">OR UPLOAD PDF</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 hover:border-blue-400 hover:bg-blue-50/40">
                                <Upload className="text-slate-500" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium">{file?.name || "Choose a resume PDF"}</div>
                                    <div className="text-xs text-slate-400">PDF only · Max 10 MB (configurable)</div>
                                </div>
                                <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        setFile(e.target.files?.[0]);
                                        if (e.target.files?.[0]) setResume("");
                                    }}
                                />
                            </label>
                        </section>
                        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl bg-slate-900 p-5 text-white sm:flex-row sm:items-center lg:col-span-2">
                            <div>
                                <div className="font-semibold">Ready to evaluate?</div>
                                <p className="mt-1 text-xs text-slate-300">
                                    AI analysis usually takes a few seconds. The report is saved automatically.
                                </p>
                            </div>
                            <button
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                <Sparkles size={17} />
                                {loading ? "Analyzing..." : "Generate match report"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-2xl border bg-white p-4">
                            <div className="grid gap-3 md:grid-cols-4">
                                <label className="relative md:col-span-2">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={17} />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && loadHistory()}
                                        placeholder="Search candidate name..."
                                        className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm"
                                    />
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={min}
                                    onChange={(e) => setMin(e.target.value)}
                                    placeholder="Min score"
                                    className="rounded-lg border px-3 py-2.5 text-sm"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={max}
                                    onChange={(e) => setMax(e.target.value)}
                                    placeholder="Max score"
                                    className="rounded-lg border px-3 py-2.5 text-sm"
                                />
                            </div>
                            <button
                                onClick={loadHistory}
                                className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                            >
                                Apply filters
                            </button>
                        </div>
                        <div className="overflow-hidden rounded-2xl border bg-white">
                            {items?.items.length ? (
                                items.items.map((x) => (
                                    <div
                                        key={x.id}
                                        className="flex flex-wrap items-center gap-4 border-b p-4 last:border-0"
                                    >
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 font-semibold text-blue-700">
                                            {x.candidate_name.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold">{x.candidate_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {dateLabel(x.created_at)} · #{x.id}
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold">
                                            {x.match_score}/100
                                        </div>
                                        <button
                                            onClick={() => setSelected(x)}
                                            className="text-sm font-semibold text-blue-700"
                                        >
                                            View report
                                        </button>
                                        <button
                                            onClick={() => remove(x.id)}
                                            title="Delete"
                                            className="text-slate-400 hover:text-red-600"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-sm text-slate-500">
                                    No analyses found. Run your first assessment to see it here.
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">{items?.total ?? 0} total records</p>
                    </div>
                )}
                <footer className="mt-10 border-t pt-5 text-xs leading-5 text-slate-400">
                    Synthweb · Resume Screener Assistant · AI-generated assessments are advisory and require human
                    review.
                </footer>
            </main>
        </div>
    );
}
