export { default } from "next-auth/middleware";

export const config = {
    matcher: ["/"], // Protect the dashboard (root path)
};
