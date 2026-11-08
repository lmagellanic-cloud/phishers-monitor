import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("login", "./routes/login.tsx"),
  route("logout", "./routes/logout.ts"),
  route("download/*", "./routes/download.ts"),
  route("upload", "./routes/upload.ts"),
  index("./routes/monitored-users.tsx"),
  route("files", "./routes/files.tsx"),
  route("videos", "./routes/videos.tsx"),
  route("gallery", "./routes/gallery.tsx"),
] satisfies RouteConfig;
