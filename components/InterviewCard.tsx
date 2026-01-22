import dayjs from "dayjs";
import { Calendar, Star } from "lucide-react";

import { LoadingLinkButton } from "./ui/loading-link-button";
import DisplayTechIcons from "./DisplayTechIcons";

import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
  coverImage,
}: InterviewCardProps) => {
  const feedback =
    userId && interviewId
      ? await getFeedbackByInterviewId({
          interviewId,
          userId,
        })
      : null;

  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;
  const typeLabel = normalizedType === "Mixed" ? "Technical & Behavioral" : normalizedType;

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  const score = typeof feedback?.totalScore === "number" ? feedback.totalScore : null;
  const scoreText = score === null ? "--/100" : `${score}/100`;
  const scoreTone =
    score === null
      ? "text-slate-200/80"
      : score >= 80
        ? "text-emerald-400"
        : score >= 50
          ? "text-amber-400"
          : "text-rose-400";

  const statusText = feedback ? "Completed" : "Pending";
  const statusTone = feedback ? "text-emerald-300" : "text-slate-200/80";
  const summaryText =
    feedback?.finalAssessment ||
    "You haven't taken this interview yet. Take it now to improve your skills.";

  const avatarFallback = (role || "AI").trim().slice(0, 1).toUpperCase();

  return (
    <div className="neo-card group w-[380px] max-sm:w-full cursor-default">
      <div className="neo-card__inner p-5 sm:p-6 min-h-[360px] flex flex-col justify-between overflow-hidden">
        <div className="relative">
          <div className="flex justify-end">
            <div className="neo-tag">
              <p className="text-[11px] font-semibold tracking-wide text-black/90 whitespace-nowrap">
                {typeLabel}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-4 min-w-0">
            <div className="neo-avatar flex items-center justify-center shrink-0">
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt={`${role} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="h-full w-full flex items-center justify-center text-black font-extrabold text-lg">
                  {avatarFallback}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-white/95 tracking-tight capitalize truncate">
                {role} Interview
              </h3>
              <p className="mt-1 text-sm text-light-100/80">{statusText}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2 text-light-100/85">
              <Calendar className="size-4 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.25)]" />
              <span className="text-sm">{formattedDate}</span>
            </div>

            <div className={`flex items-center gap-2 ${scoreTone}`}>
              <Star className="size-4 drop-shadow-[0_0_10px_rgba(168,85,247,0.25)]" />
              <span className="text-sm font-semibold">{scoreText}</span>
            </div>

            <div className={`text-sm font-medium ${statusTone}`}>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-current drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]" />
                {statusText}
              </span>
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm text-light-100/75 leading-relaxed">
            {summaryText}
          </p>
        </div>

        <div className="pt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <DisplayTechIcons techStack={techstack} />
            </div>
          </div>

          <LoadingLinkButton
            className="neo-cta cursor-pointer"
            href={
              feedback
                ? `/interview/${interviewId}/feedback`
                : `/interview/${interviewId}`
            }
            loadingText="Opening..."
          >
            {feedback ? "Check Feedback" : "Take Interview"}
          </LoadingLinkButton>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
