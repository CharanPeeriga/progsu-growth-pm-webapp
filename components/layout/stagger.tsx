"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import { staggerParent, staggerChild, fadeChild } from "@/lib/motion";

export function Stagger({ children, className, as = "div" }: {
  children: React.ReactNode; className?: string; as?: "div" | "tbody";
}) {
  const MotionTag = as === "tbody" ? motion.tbody : motion.div;
  return (
    <MotionTag variants={staggerParent} initial="initial" animate="animate" className={className}>
      {children}
    </MotionTag>
  );
}

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  fade?: boolean;
  as?: "div" | "tr";
} & Omit<HTMLMotionProps<"div"> & HTMLMotionProps<"tr">, "variants" | "className" | "children">;

export function StaggerItem({ children, className, fade = false, as = "div", ...props }: StaggerItemProps) {
  const MotionTag = as === "tr" ? motion.tr : motion.div;
  return (
    <MotionTag variants={fade ? fadeChild : staggerChild} className={className} {...props}>
      {children}
    </MotionTag>
  );
}
