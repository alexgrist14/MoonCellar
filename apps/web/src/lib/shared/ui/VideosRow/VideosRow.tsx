import { FC, useEffect, useId, useState } from "react";
import styles from "./VideosRow.module.scss";
import { Scrollbar } from "../Scrollbar";
import { modal } from "../Modal";
import { VideoThumbnail } from "./components/VideoThumbnail";
import { getYoutubeEmbedUrl } from "@/src/lib/shared/utils/youtube.utils";

interface IVideosRowProps {
  videos: string[];
}

export const VideosRow: FC<IVideosRowProps> = ({ videos }) => {
  const modalId = useId();
  const [videoIndex, setVideoIndex] = useState<number>();

  useEffect(() => {
    if (videoIndex === undefined) return;

    modal.open(
      <div className={styles.videos__wrapper}>
        <iframe
          src={getYoutubeEmbedUrl(videos[videoIndex])}
          title="Video player"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>,
      { id: modalId, onClose: () => setVideoIndex(undefined) }
    );

    return () => modal.close(modalId);
  }, [modalId, videoIndex, videos]);

  return (
    <Scrollbar
      classNameContent={styles.videos__content}
      isHorizontal
      isWithArrows
    >
      {videos.map(
        (video, i) =>
          !!video && (
            <div
              key={video + i}
              className={styles.videos__thumbnail}
              onClick={() => setVideoIndex(i)}
            >
              <VideoThumbnail video={video} />
            </div>
          )
      )}
    </Scrollbar>
  );
};
