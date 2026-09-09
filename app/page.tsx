import { redirect } from "next/navigation";
import { DEFAULT_MACHINE_SLUG } from "@/lib/machines";

export default function Home() {
  redirect(`/claw/${DEFAULT_MACHINE_SLUG}`);
}
