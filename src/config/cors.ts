import { env } from "./env";

const formatOrigin = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return trimmed;
};

export const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  if (env.FRONTEND_URL) {
    env.FRONTEND_URL.split(",").forEach((part) => {
      const formatted = formatOrigin(part);
      if (formatted) origins.push(formatted);
    });
  }

  if (env.CORS_ORIGIN) {
    env.CORS_ORIGIN.split(",").forEach((part) => {
      const formatted = formatOrigin(part);
      if (formatted && !origins.includes(formatted)) {
        origins.push(formatted);
      }
    });
  }

  // Always allow Capacitor mobile app origins
  const mobileOrigins = [
    "https://localhost",
    "http://localhost",
    "capacitor://localhost",
  ];
  mobileOrigins.forEach((mobile) => {
    if (!origins.includes(mobile)) {
      origins.push(mobile);
    }
  });

  // Always allow standard localhost origins during development or test
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    const localOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3001",
    ];
    localOrigins.forEach((local) => {
      if (!origins.includes(local)) {
        origins.push(local);
      }
    });
  }

  return origins;
};
