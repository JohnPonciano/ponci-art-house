"use client";
import { useEffect } from "react";
import { concrete } from "@/lib/gen";
export function Concrete() {
  useEffect(() => { concrete(); }, []);
  return null;
}
