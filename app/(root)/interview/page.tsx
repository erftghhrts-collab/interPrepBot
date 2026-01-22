import Agent from "@/components/Agent";
import NavPortal from "@/components/NavPortal";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  return (
    <>
      <NavPortal>
        <div className="min-w-0 flex items-center justify-end">
          <p className="truncate text-sm font-semibold text-white/80">Interview generation</p>
        </div>
      </NavPortal>
      <Agent userName={user.name} userId={user.id} type="generate" />
    </>
  );
};

export default Page;
