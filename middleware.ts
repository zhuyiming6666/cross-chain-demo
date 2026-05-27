export { auth as middleware } from "@/app/api/auth/[...nextauth]/auth";

export const config = {
  matcher: [
    "/((?!_next|api|login|favicon.ico).+)",
    "/",
  ],
};
