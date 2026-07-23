import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function DashboardLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
