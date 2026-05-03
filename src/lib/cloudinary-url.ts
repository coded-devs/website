export function getOptimisedUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }

  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  if (url.includes("/upload/f_auto,q_auto/")) {
    return url;
  }

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}
