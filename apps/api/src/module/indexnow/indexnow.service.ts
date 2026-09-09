import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { FRONT_URL, INDEXNOW_KEY } from "src/shared/constants";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

@Injectable()
export class IndexNowService {
  private readonly logger = new Logger(IndexNowService.name);
  private readonly host = new URL(FRONT_URL).host;
  private readonly keyLocation = `${FRONT_URL}/${INDEXNOW_KEY}.txt`;

  async submitUrl(url: string): Promise<void> {
    return this.submitUrls([url]);
  }

  async submitUrls(urlList: string[]): Promise<void> {
    if (urlList.length === 0) return;

    try {
      await axios.post(INDEXNOW_ENDPOINT, {
        host: this.host,
        key: INDEXNOW_KEY,
        keyLocation: this.keyLocation,
        urlList,
      });
    } catch (err) {
      this.logger.error(err, `Failed to submit URLs to IndexNow: ${urlList}`);
    }
  }
}
