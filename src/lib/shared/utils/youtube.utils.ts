export const getYoutubeVideoId = (video: string): string => {
  if (!video.includes("/") && !video.includes("http")) {
    return video;
  }

  try {
    const url = new URL(video);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }

    return (
      url.searchParams.get("v") ||
      url.pathname.split("/").filter(Boolean).pop() ||
      video
    );
  } catch {
    return video;
  }
};

export const getYoutubeThumbnailUrl = (video: string) =>
  `https://img.youtube.com/vi/${getYoutubeVideoId(video)}/hqdefault.jpg`;

export const getYoutubeEmbedUrl = (video: string) =>
  `https://www.youtube.com/embed/${getYoutubeVideoId(video)}?autoplay=1`;
