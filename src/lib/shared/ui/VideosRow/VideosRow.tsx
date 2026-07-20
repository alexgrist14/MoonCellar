import { FC, useEffect, useState } from "react";
import styles from "./VideosRow.module.scss";
import { Scrollbar } from "../Scrollbar";
import { modal } from "../Modal";
import { VideoThumbnail } from "./components/VideoThumbnail";
import { getYoutubeEmbedUrl } from "../../utils/youtube.utils";

interface IVideosRowProps {
  videos: string[];
}

export const VideosRow: FC<IVideosRowProps> = ({ videos }) => {
  const [videoIndex, setVideoIndex] = useState<number>();

  useEffect(() => {
    modal.close();

    videoIndex !== undefined &&
      modal.open(
        <div className={styles.videos__wrapper}>
          <iframe
            src={getYoutubeEmbedUrl(videos[videoIndex])}
            title="Video player"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>,
        { onClose: () => setVideoIndex(undefined) }
      );
  }, [videoIndex, videos]);

  return (
    <Scrollbar classNameContent={styles.videos__content} isHorizontal>
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
