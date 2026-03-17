import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetQuestionsByPaperQuery,
  useCreateQuestionMutation,
} from "../api/questionApi";
import { useUploadQuestionImageMutation } from "../api/uploadApi";

const norm = (v) => String(v || "").trim();

const Dropzone = ({ onFile }) => {
  const [drag, setDrag] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile?.(f);
      }}
      className={[
        "w-full border border-dashed px-4 py-4 text-sm transition",
        drag ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white",
      ].join(" ")}
    >
      <div className="text-sm font-medium text-gray-800">Drag and drop image here</div>
      <div className="mt-1 text-xs text-gray-500">or choose a file</div>

      <div className="mt-3">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700">
          Choose File
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile?.(f);
            }}
          />
        </label>
      </div>
    </div>
  );
};

export default function CreatePaperQuestionsPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useGetQuestionsByPaperQuery(paperId, {
    skip: !paperId,
  });
  const [createQuestion, { isLoading: isSaving }] = useCreateQuestionMutation();

  const [uploadQuestionImage, { isLoading: isUploading }] =
    useUploadQuestionImageMutation();

  const paper = data?.paper || null;
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const progress = data?.progress || null;

  const requiredCount = Number(
    progress?.requiredCount || paper?.questionCount || 0
  );

  const defaultAnswerCount = Number(
    progress?.oneQuestionAnswersCount || paper?.oneQuestionAnswersCount || 4
  );

  const nextNumber = useMemo(() => {
    const used = new Set(questions.map((q) => Number(q.questionNumber)));
    for (let i = 1; i <= requiredCount; i++) {
      if (!used.has(i)) return i;
    }
    return requiredCount + 1;
  }, [questions, requiredCount]);

  const isLast = nextNumber === requiredCount;

  const [form, setForm] = useState({
    question: "",
    lessonName: "",
    answers: [],
    correctAnswerIndexes: [],
    explanationVideoUrl: "",
    explanationText: "",
    imageUrl: "",
  });

  useEffect(() => {
    setForm((prev) => {
      const nextAnswers = Array.from(
        { length: Math.max(defaultAnswerCount, 1) },
        (_, i) => prev.answers?.[i] || ""
      );

      return {
        ...prev,
        answers: nextAnswers,
        correctAnswerIndexes: prev.correctAnswerIndexes || [],
      };
    });
  }, [defaultAnswerCount]);

  const toggleCorrect = (i) => {
    setForm((p) => {
      const set = new Set((p.correctAnswerIndexes || []).map(Number));
      if (set.has(i)) set.delete(i);
      else set.add(i);

      return {
        ...p,
        correctAnswerIndexes: Array.from(set).sort((a, b) => a - b),
      };
    });
  };

  const addAnswer = () => {
    setForm((p) => {
      const cur = Array.isArray(p.answers) ? p.answers : [];
      if (cur.length >= 6) return p;
      return { ...p, answers: [...cur, ""] };
    });
  };

  const removeAnswer = (indexToRemove) => {
    setForm((p) => {
      const cur = Array.isArray(p.answers) ? p.answers : [];
      if (cur.length <= 1) return p;

      const nextAnswers = cur.filter((_, i) => i !== indexToRemove);

      const nextCorrect = (p.correctAnswerIndexes || [])
        .map(Number)
        .filter((x) => Number.isFinite(x))
        .map((x) => {
          if (x === indexToRemove) return null;
          if (x > indexToRemove) return x - 1;
          return x;
        })
        .filter((x) => x !== null)
        .filter((x) => x >= 0 && x < nextAnswers.length);

      return {
        ...p,
        answers: nextAnswers,
        correctAnswerIndexes: [...new Set(nextCorrect)].sort((a, b) => a - b),
      };
    });
  };

  const canSave = useMemo(() => {
    if (!paperId) return false;
    if (!norm(form.question)) return false;

    const cleaned = (form.answers || []).map(norm).filter(Boolean);
    if (cleaned.length < 1 || cleaned.length > 6) return false;

    const idxs = (form.correctAnswerIndexes || [])
      .map(Number)
      .filter((x) => Number.isFinite(x))
      .filter((x) => x >= 0 && x < cleaned.length);

    if (idxs.length < 1) return false;

    return true;
  }, [paperId, form]);

  const resetForNext = () => {
    setForm({
      question: "",
      lessonName: "",
      answers: Array.from({ length: Math.max(defaultAnswerCount, 1) }, () => ""),
      correctAnswerIndexes: [],
      explanationVideoUrl: "",
      explanationText: "",
      imageUrl: "",
    });
  };

  const onUploadImage = async (file) => {
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await uploadQuestionImage(fd).unwrap();
      setForm((p) => ({ ...p, imageUrl: res?.url || "" }));
    } catch (e) {
      alert(e?.data?.message || "Upload failed");
    }
  };

  const onSave = async () => {
    if (!canSave) return;

    const cleanedAnswers = (form.answers || []).map(norm).filter(Boolean);

    const idxs = (form.correctAnswerIndexes || [])
      .map(Number)
      .filter((x) => Number.isFinite(x))
      .filter((x) => x >= 0 && x < cleanedAnswers.length);

    const payload = {
      paperId,
      questionNumber: nextNumber,
      lessonName: norm(form.lessonName),
      question: norm(form.question),
      answers: cleanedAnswers,
      correctAnswerIndexes: [...new Set(idxs)].sort((a, b) => a - b),
      explanationVideoUrl: norm(form.explanationVideoUrl),
      explanationText: norm(form.explanationText),
      imageUrl: norm(form.imageUrl),
    };

    try {
      await createQuestion(payload).unwrap();
      await refetch();

      if (isLast) navigate(`/paper/${paperId}/questions/view`);
      else resetForNext();
    } catch (e) {
      alert(e?.data?.message || "Failed to save question");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-3 py-6">
        <div className="w-full max-w-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-3 py-6">
        <div className="w-full max-w-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
          Paper not found
        </div>
      </div>
    );
  }

  const answerCount = (form.answers || []).length;

  return (
    <div className="flex w-full justify-center">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                  Create Questions
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Add questions, answers, images, and explanations for this paper.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
                  <div>
                    Paper:{" "}
                    <span className="font-medium text-gray-900">
                      {paper.paperTitle}
                    </span>
                  </div>
                  <div>
                    Progress:{" "}
                    <span className="font-medium text-gray-900">
                      {progress?.currentCount || 0}
                    </span>{" "}
                    /{" "}
                    <span className="font-medium text-gray-900">
                      {requiredCount}
                    </span>
                  </div>
                  <div>
                    Current Answer Count:{" "}
                    <span className="font-medium text-gray-900">{answerCount}</span>
                  </div>
                  <div>
                    Mode:{" "}
                    <span className="font-medium text-gray-900">
                      Multiple correct answers supported
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/paper/${paperId}/questions/view`)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                View All
              </button>
            </div>
          </div>

          <div className="mt-5 border border-gray-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-base font-medium text-gray-900">
                Question #{nextNumber} {isLast ? "- Final Question" : ""}
              </div>
              <div className="text-xs text-gray-500">
                Minimum 1 answer, maximum 6 answers
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Question
                </label>
                <textarea
                  rows={3}
                  value={form.question}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, question: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Enter the question"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lesson Name
                </label>
                <input
                  value={form.lessonName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, lessonName: e.target.value }))
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Enter lesson name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Explanation Video URL
                </label>
                <input
                  value={form.explanationVideoUrl}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      explanationVideoUrl: e.target.value,
                    }))
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Question Image
                  </label>

                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>

                <Dropzone onFile={onUploadImage} />

                {isUploading && (
                  <div className="mt-2 text-xs text-gray-500">Uploading...</div>
                )}

                {!!form.imageUrl && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium text-gray-600">
                      Preview
                    </div>
                    <img
                      src={form.imageUrl}
                      alt="question"
                      className="max-h-56 rounded-lg border border-gray-200 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Answers
                  </label>

                  <button
                    type="button"
                    onClick={addAnswer}
                    disabled={answerCount >= 6}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Add Answer
                  </button>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: answerCount }, (_, i) => {
                    const val = form.answers?.[i] || "";
                    const checked = (form.correctAnswerIndexes || [])
                      .map(Number)
                      .includes(i);

                    return (
                      <div
                        key={i}
                        className={[
                          "border p-3",
                          checked
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-white",
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                          <div className="w-full lg:w-[90px]">
                            <span className="inline-flex h-8 items-center rounded-md bg-gray-100 px-3 text-xs font-medium text-gray-700">
                              Answer {i + 1}
                            </span>
                          </div>

                          <input
                            value={val}
                            onChange={(e) => {
                              const copy = [...(form.answers || [])];
                              copy[i] = e.target.value;
                              setForm((p) => ({ ...p, answers: copy }));
                            }}
                            className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            placeholder={`Enter answer ${i + 1}`}
                          />

                          <label className="flex min-w-[90px] items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCorrect(i)}
                            />
                            <span className="font-medium">Correct</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeAnswer(i)}
                            disabled={answerCount <= 1}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Select one or more correct answers.
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Explanation Notes
                </label>
                <textarea
                  rows={4}
                  value={form.explanationText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, explanationText: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Write the explanation here"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onSave}
                disabled={!canSave || isSaving}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : isLast ? "Submit" : "Next Question"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}