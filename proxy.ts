import { auth } from "@/app/api/auth/[...nextauth]/auth";

export default auth;

export const config = {
  matcher: [
    "/((?!_next|api|login|favicon.ico).+)",
    "/",
  ],
};
