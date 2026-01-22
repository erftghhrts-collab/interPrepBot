"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type NavPortalProps = {
  children: ReactNode;
  targetId?: string;
};

export default function NavPortal({
  children,
  targetId = "app-nav-extra",
}: NavPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = document.getElementById(targetId);
  if (!target) return null;

  return createPortal(children, target);
}
