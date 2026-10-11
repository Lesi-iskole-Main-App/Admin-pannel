import React, { useMemo, useState } from "react";
import { useGetAllClassesQuery } from "../api/classApi";
import {
  useGetCatalogAdminQuery, useAddCatalogVideoMutation,
  useEditCatalogVideoMutation, useArchiveCatalogVideoMutation,
  useRenameCatalogLessonMutation, useRenameCatalogSubMutation,
  useReorderCatalogMutation,
} from "../api/lessonApi";

const field = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";
const blue = "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40";
const small = "rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-40";
const keyOf = (item) => String(item.key ?? item._id);
const displayError = (problem) => {
  if (problem?.status === 401 || problem?.status === 403) {
    return "Your admin session has expired or this account cannot edit lessons. Sign in with an admin account and retry.";
  }
  return problem?.data?.message || problem?.error || "Could not load lessons. Please retry.";
};

export default function LMSPage() {
  const [classId, setClassId] = useState("");
  const [lessonChoice, setLessonChoice] = useState("new");
  const [subChoice, setSubChoice] = useState("new");
  const [lessonTitle, setLessonTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [watchStart, setWatchStart] = useState("");
  const [watchEnd, setWatchEnd] = useState("");
  const [rangeEdits, setRangeEdits] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: classesRes, isLoading: classesLoading, error: classesError,
    refetch: refetchClasses } = useGetAllClassesQuery();
  const { data, isLoading, isError, error: catalogError, refetch } =
    useGetCatalogAdminQuery(classId, { skip: !classId, refetchOnMountOrArgChange: true });
  const classes = classesRes?.classes || [];
  const lessons = data?.lessons || [];
  const selectedLesson = lessons.find((g) => g.key === lessonChoice);
  const selectableSubs = selectedLesson?.sublessons || [];
  const allSubs = useMemo(() => lessons.flatMap((g) => g.sublessons.map((s) => ({
    lessonKey: g.key, subKey: s.key, label: `${g.title} / ${s.title}`,
  }))), [lessons]);

  const [addVideo] = useAddCatalogVideoMutation();
  const [editVideo] = useEditCatalogVideoMutation();
  const [archiveVideo] = useArchiveCatalogVideoMutation();
  const [renameLesson] = useRenameCatalogLessonMutation();
  const [renameSub] = useRenameCatalogSubMutation();
  const [reorder] = useReorderCatalogMutation();

  const run = async (request, done, successText = "Saved") => {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request.unwrap();
      const refreshed = await refetch();
      if (done) done();
      if (refreshed?.error) {
        setError(`Saved, but the list could not refresh. ${displayError(refreshed.error)}`);
      } else {
        setNotice(successText);
      }
    } catch (e) {
      setError(displayError(e));
    } finally { setBusy(false); }
  };
  const move = (kind, group, sub, rows, index, step) => {
    const next = index + step;
    if (next < 0 || next >= rows.length) return;
    const keys = rows.map(keyOf);
    [keys[index], keys[next]] = [keys[next], keys[index]];
    run(reorder({ kind, classId, lessonKey: group?.key, subKey: sub?.key, keys }), null, "Order updated");
  };
  const promptName = (current, save) => {
    const title = window.prompt("New name", current);
    if (title !== null && title.trim() && title.trim() !== current) save(title.trim());
  };
  const createVideo = (event) => {
    event.preventDefault();
    if (!classId || !youtubeUrl.trim()) return;
    if (Boolean(watchStart) !== Boolean(watchEnd) || (watchStart && watchStart > watchEnd)) {
      setError("Select both From and To dates, or leave both empty."); return;
    }
    const body = {
      classId, youtubeUrl: youtubeUrl.trim(), watchStart, watchEnd,
      ...(lessonChoice === "new" ? { lessonTitle: lessonTitle.trim() } : { lessonKey: lessonChoice }),
      ...(lessonChoice === "new" || subChoice === "new"
        ? { subTitle: subTitle.trim() } : { subKey: subChoice }),
    };
    run(addVideo(body), () => {
      setYoutubeUrl(""); setWatchStart(""); setWatchEnd("");
      if (lessonChoice === "new") setLessonTitle("");
      if (subChoice === "new" || lessonChoice === "new") setSubTitle("");
    }, "Video assigned");
  };
  const updateRange = (id, video, fieldName, value) => {
    setRangeEdits((old) => ({ ...old,
      [id]: { watchStart: old[id]?.watchStart ?? video.watchStart,
        watchEnd: old[id]?.watchEnd ?? video.watchEnd, [fieldName]: value },
    }));
  };
  const saveRange = (video) => {
    const id = String(video._id);
    const dates = rangeEdits[id] || { watchStart: video.watchStart, watchEnd: video.watchEnd };
    if (Boolean(dates.watchStart) !== Boolean(dates.watchEnd) ||
        (dates.watchStart && dates.watchStart > dates.watchEnd)) {
      setError("Select a valid From–To date range."); return;
    }
    run(editVideo({ id, body: dates }), () => setRangeEdits((old) => {
      const copy = { ...old }; delete copy[id]; return copy;
    }), "This Week button schedule updated");
  };

  return <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 text-slate-900">
    <div>
      <h1 className="text-2xl font-bold">Lessons / Sub-lessons / Videos</h1>
      <p className="text-sm text-slate-600">Set an inclusive From–To date range for each video (Sri Lanka calendar dates). Students see the This Week popup button while the range is active.</p>
    </div>
    <label className="flex max-w-xl flex-col gap-2 text-sm font-semibold">Class
      <select className={field} value={classId} disabled={classesLoading || busy} onChange={(e) => {
        setClassId(e.target.value); setLessonChoice("new"); setSubChoice("new");
        setError(""); setNotice("");
      }}>
        <option value="">Select a class</option>
        {classes.map((c) => <option key={c._id} value={c._id}>
          {c.className} · {c.subjectName || c.alSubjectName || c.subject || "Subject"} · {c.batchNumber || ""}
        </option>)}
      </select>
    </label>
    {classesError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
      {displayError(classesError)} <button type="button" className={small}
        onClick={() => refetchClasses()}>Retry classes</button>
    </div>}
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{notice}</div>}
    {classId && <form onSubmit={createVideo} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
      <h2 className="sm:col-span-2 text-lg font-bold">Assign a video</h2>
      <label className="flex flex-col gap-1 text-sm">Lesson
        <select className={field} value={lessonChoice} disabled={busy} onChange={(e) => {
          setLessonChoice(e.target.value); setSubChoice("new");
        }}>
          <option value="new">+ New lesson</option>
          {lessons.map((g) => <option key={g.key} value={g.key}>{g.title}</option>)}
        </select>
      </label>
      {lessonChoice === "new" && <label className="flex flex-col gap-1 text-sm">New lesson name
        <input className={field} value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required />
      </label>}
      {lessonChoice !== "new" && <span className="hidden sm:block" />}
      <label className="flex flex-col gap-1 text-sm">Sub-lesson
        <select className={field} value={subChoice} disabled={busy || lessonChoice === "new"}
          onChange={(e) => setSubChoice(e.target.value)}>
          <option value="new">+ New sub-lesson</option>
          {selectableSubs.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
        </select>
      </label>
      {(lessonChoice === "new" || subChoice === "new") &&
        <label className="flex flex-col gap-1 text-sm">New sub-lesson name
          <input className={field} value={subTitle} onChange={(e) => setSubTitle(e.target.value)} required />
        </label>}
      <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Video URL
        <input type="url" className={field} value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtu.be/..." required />
      </label>
      <label className="flex flex-col gap-1 text-sm">Show This Week from
        <input type="date" className={field} value={watchStart}
          onChange={(e) => setWatchStart(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">Show This Week until
        <input type="date" className={field} value={watchEnd}
          onChange={(e) => setWatchEnd(e.target.value)} />
      </label>
      <button type="submit" disabled={busy} className={`${blue} sm:col-span-2`}>+ Assign video</button>
    </form>}
    {classId && isLoading && <p>Loading lessons…</p>}
    {classId && isError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
      {displayError(catalogError)} <button type="button" className={small}
        onClick={() => refetch()}>Retry lessons</button>
    </div>}
    {classId && data && lessons.length === 0 && <p className="rounded-xl border p-4">No videos assigned yet.</p>}
    {lessons.map((group, gi) => <section key={group.key} className="space-y-3 rounded-xl border border-blue-100 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Lesson {gi + 1}</span>
        <h2 className="min-w-0 flex-1 text-lg font-bold">{group.title}</h2>
        {group.mustWatch && <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-white">This Week</span>}
        <button className={small} disabled={busy || gi === 0} onClick={() => move("lessons", null, null, lessons, gi, -1)}>↑</button>
        <button className={small} disabled={busy || gi === lessons.length - 1} onClick={() => move("lessons", null, null, lessons, gi, 1)}>↓</button>
        <button className={small} disabled={busy} onClick={() => promptName(group.title, (title) =>
          run(renameLesson({ classId, lessonKey: group.key, title })))}>Rename</button>
      </div>
      {group.sublessons.map((sub, si) => <div key={sub.key} className="space-y-3 rounded-lg border bg-slate-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-blue-600">{si + 1}.</span>
          <h3 className="min-w-0 flex-1 font-semibold">{sub.title}</h3>
          {sub.mustWatch && <span className="text-sm font-bold text-orange-600">This Week</span>}
          <button className={small} disabled={busy || si === 0} onClick={() => move("sublessons", group, null, group.sublessons, si, -1)}>↑</button>
          <button className={small} disabled={busy || si === group.sublessons.length - 1} onClick={() => move("sublessons", group, null, group.sublessons, si, 1)}>↓</button>
          <button className={small} disabled={busy} onClick={() => promptName(sub.title, (title) =>
            run(renameSub({ classId, lessonKey: group.key, subKey: sub.key, title })))}>Rename</button>
        </div>
        {sub.videos.map((video, vi) => {
          const id = String(video._id);
          const dates = rangeEdits[id] || { watchStart: video.watchStart, watchEnd: video.watchEnd };
          return <div key={id} className="space-y-2 rounded-lg border bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong>Video {vi + 1}</strong>
              <a className="min-w-0 flex-1 truncate text-blue-700 underline" href={video.youtubeUrl}
                target="_blank" rel="noreferrer">{video.youtubeUrl}</a>
              {video.mustWatch && <span className="rounded-full bg-orange-500 px-2 py-1 font-bold text-white">This Week</span>}
              <button className={small} disabled={busy || vi === 0} onClick={() => move("videos", group, sub, sub.videos, vi, -1)}>↑</button>
              <button className={small} disabled={busy || vi === sub.videos.length - 1} onClick={() => move("videos", group, sub, sub.videos, vi, 1)}>↓</button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">From
                <input type="date" className={field} value={dates.watchStart || ""}
                  onChange={(e) => updateRange(id, video, "watchStart", e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">Until
                <input type="date" className={field} value={dates.watchEnd || ""}
                  onChange={(e) => updateRange(id, video, "watchEnd", e.target.value)} />
              </label>
              <button className={blue} disabled={busy} onClick={() => saveRange(video)}>Save range</button>
              <button className={small} disabled={busy} onClick={() => run(editVideo({ id,
                body: { watchStart: "", watchEnd: "" } }), () => setRangeEdits((old) => {
                  const copy = { ...old }; delete copy[id]; return copy;
                }), "This Week range cleared")}>Clear</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex flex-1 flex-col gap-1">Move to lesson / sub-lesson
                <select className={field} value={`${group.key}|${sub.key}`} disabled={busy}
                  onChange={(e) => {
                    const target = allSubs.find((x) => `${x.lessonKey}|${x.subKey}` === e.target.value);
                    if (target) run(editVideo({ id, body: target }), null, "Video moved");
                  }}>
                  {allSubs.map((item) => <option key={`${item.lessonKey}|${item.subKey}`}
                    value={`${item.lessonKey}|${item.subKey}`}>{item.label}</option>)}
                </select>
              </label>
              <button className={small} disabled={busy} onClick={() => promptName(video.youtubeUrl, (newUrl) =>
                run(editVideo({ id, body: { youtubeUrl: newUrl } })))}>Edit link</button>
              <button className={small} disabled={busy} onClick={() => {
                if (window.confirm("Archive this video?")) run(archiveVideo(id), null, "Video archived");
              }}>Archive</button>
            </div>
          </div>;
        })}
      </div>)}
    </section>)}
  </main>;
}
