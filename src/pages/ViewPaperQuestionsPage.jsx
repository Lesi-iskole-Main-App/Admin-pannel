import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetQuestionsByPaperQuery } from "../api/questionApi";

const toNums = (v) =>
  Array.isArray(v) ? v.map(Number).filter((n) => Number.isFinite(n)) : [];

const getCorrect = (q) => {
  const multi = toNums(q?.correctAnswerIndexes);
  if (multi.length) return [...new Set(multi)].sort((a, b) => a - b);

  const single = Number(q?.correctAnswerIndex);
  if (Number.isFinite(single)) return [single];

  return [];
};

export default function ViewPaperQuestionsPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } =
    useGetQuestionsByPaperQuery(paperId, { skip: !paperId });

  const paper = data?.paper || null;
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const progress = data?.progress || null;

  const requiredCount = Number(progress?.requiredCount || paper?.questionCount || 0);
  const currentCount = Number(progress?.currentCount || questions.length || 0);

  const sorted = useMemo(
    () =>
      [...questions].sort(
        (a, b) => Number(a.questionNumber) - Number(b.questionNumber)
      ),
    [questions]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-3 py-6">
        <div className="w-full max-w-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
          Loading questions...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-3 py-6">
        <div className="w-full max-w-2xl border border-gray-200 bg-white p-6">
          <div className="text-lg font-semibold text-red-600">Failed to load</div>
          <div className="mt-2 text-sm text-gray-700">
            {error?.data?.message || error?.error || "Unknown error"}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/paper/papers")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>
          </div>
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

  return (
    <div className="flex w-full justify-center">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                  View Questions
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Review the questions, answers, and explanations for this paper.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
                  <div>
                    Paper:{" "}
                    <span className="font-medium text-gray-900">
                      {paper?.paperTitle}
                    </span>
                  </div>
                  <div>
                    Progress:{" "}
                    <span className="font-medium text-gray-900">
                      {currentCount}
                    </span>{" "}
                    /{" "}
                    <span className="font-medium text-gray-900">
                      {requiredCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/paper/papers")}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700"
                  title="Home"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 10.5 12 3l9 7.5" />
                    <path d="M5 9.5V21h14V9.5" />
                    <path d="M9 21v-6h6v6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {sorted.length === 0 ? (
              <div className="border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
                No questions added yet.
              </div>
            ) : (
              sorted.map((q) => {
                const answers = Array.isArray(q?.answers) ? q.answers : [];
                const correctSet = new Set(getCorrect(q));

                return (
                  <div key={q._id} className="border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            Question #{q?.questionNumber}
                          </div>

                          {!!q?.lessonName && (
                            <div className="mt-1 text-xs text-gray-500">
                              Lesson:{" "}
                              <span className="font-medium text-gray-700">
                                {q.lessonName}
                              </span>
                            </div>
                          )}
                        </div>

                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600">
                          {answers.length} Options
                        </span>
                      </div>

                      <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                        {q?.question}
                      </div>

                      {!!q?.imageUrl && (
                        <div className="mt-4">
                          <img
                            src={q.imageUrl}
                            alt="question"
                            className="max-h-72 rounded-lg border border-gray-200 object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-5 sm:px-6">
                      <div className="mb-3 text-sm font-medium text-gray-800">
                        Answers
                      </div>

                      <div className="space-y-2">
                        {answers.map((a, idx) => {
                          const isCorrect = correctSet.has(idx);

                          return (
                            <div
                              key={idx}
                              className={[
                                "flex items-start gap-3 border px-4 py-3",
                                isCorrect
                                  ? "border-green-200 bg-green-50"
                                  : "border-gray-200 bg-white",
                              ].join(" ")}
                            >
                              <div
                                className={[
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-medium",
                                  isCorrect
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100 text-gray-700",
                                ].join(" ")}
                              >
                                {idx + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div
                                  className={[
                                    "whitespace-pre-wrap text-sm leading-6",
                                    isCorrect
                                      ? "font-medium text-gray-900"
                                      : "text-gray-800",
                                  ].join(" ")}
                                >
                                  {a}
                                </div>
                              </div>

                              {isCorrect && (
                                <span className="shrink-0 rounded-md border border-green-200 bg-white px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-green-700">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {(q?.explanationVideoUrl || q?.explanationText) && (
                        <div className="mt-5 border border-gray-200 bg-white p-4">
                          <div className="text-sm font-medium text-gray-800">
                            Explanation
                          </div>

                          {!!q?.explanationVideoUrl && (
                            <div className="mt-2 break-all text-sm text-blue-600">
                              {q.explanationVideoUrl}
                            </div>
                          )}

                          {!!q?.explanationText && (
                            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                              {q.explanationText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}