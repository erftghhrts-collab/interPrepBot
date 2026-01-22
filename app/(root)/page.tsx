import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { LoadingLinkButton } from "@/components/ui/loading-link-button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser, signOut } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
  getCompletedInterviewsByUserId,
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  async function logout() {
    "use server";
    await signOut();
    redirect("/sign-in");
  }

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({ userId: user.id }),
  ]);

  const completedInterviews = await getCompletedInterviewsByUserId(user.id);

  const completedIds = new Set((completedInterviews ?? []).map((i) => i.id));
  const scheduledInterviews = (userInterviews ?? []).filter(
    (i) => !completedIds.has(i.id)
  );
  const takeInterviews = (allInterview ?? []).filter((i) => !completedIds.has(i.id));

  const hasScheduledInterviews = scheduledInterviews.length > 0;
  const hasCompletedInterviews = (completedInterviews?.length ?? 0) > 0;
  const hasTakeInterviews = takeInterviews.length > 0;

  return (
    <>
      <form action={logout} className="fixed right-4 top-4 z-[9999]">
        <button
          type="submit"
          className="btn-secondary flex items-center gap-2 !px-4 !min-h-9 shadow-lg"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Logout
        </button>
      </form>

      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <LoadingLinkButton
            className="btn-home-primary max-sm:w-full"
            href="/interview"
            loadingText="Starting interview..."
          >
            Start an Interview
          </LoadingLinkButton>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Scheduled Interviews</h2>

        <div className="interviews-section">
          {hasScheduledInterviews ? (
            scheduledInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
                coverImage={interview.coverImage}
              />
            ))
          ) : (
            <p>You don&apos;t have any scheduled interviews pending</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Conducted Interviews</h2>

        <div className="interviews-section">
          {hasCompletedInterviews ? (
            completedInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
                coverImage={interview.coverImage}
              />
            ))
          ) : (
            <p>You haven&apos;t completed any interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take Interviews</h2>

        <div className="interviews-section">
          {hasTakeInterviews ? (
            takeInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
                coverImage={interview.coverImage}
              />
            ))
          ) : (
            <p>There are no interviews available</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;