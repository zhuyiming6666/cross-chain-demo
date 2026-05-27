export { auth as default } from "@/app/api/auth/[...nextauth]/auth";

export const config = {
  matcher: [
    "/((?!_next|api|login|favicon.ico).+)",
    "/",
  ],
};
