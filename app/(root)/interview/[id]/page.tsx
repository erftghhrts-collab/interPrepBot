import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import NavPortal from "@/components/NavPortal";
import InterviewRealtimeOverlay from "@/components/InterviewRealtimeOverlay";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  return (
    <>
      <InterviewRealtimeOverlay userId={user.id} />

      <NavPortal>
        <div className="min-w-0 flex items-center gap-3">
          <Image
            src={getRandomInterviewCover()}
            alt="cover-image"
            width={36}
            height={36}
            className="rounded-full object-cover size-[36px] shrink-0"
          />

          {/* Tech stack icons (the overlapping rounded pills) */}
          <DisplayTechIcons techStack={interview.techstack} />

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-primary-100 capitalize leading-5">
              {interview.role} Interview
            </p>
            <p className="truncate text-xs text-white/70 capitalize">
              {interview.type}
            </p>
          </div>
        </div>
      </NavPortal>

      <div className="flex items-start justify-between gap-4" />

      <Agent
        userName={user.name}
        userId={user.id}
        interviewId={id}
        type="interview"
        questions={interview.questions}
        feedbackId={feedback?.id}
      />
    </>
  );
};

export default InterviewDetails;
