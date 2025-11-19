import Home from "./pageClient";

export default function Page() {
  return (
    <Home NEXT_PUBLIC_CLERK_BACKEND_URL={process.env.BACKEND_URL} />
  );
}