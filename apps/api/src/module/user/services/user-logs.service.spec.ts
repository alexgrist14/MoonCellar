import { UserLogsService } from "./user-logs.service";

const USER_ID = "64b7c0f0f0f0f0f0f0f0f0f0";

const createService = (texts: string[]) =>
  new UserLogsService({
    aggregate: jest.fn(() =>
      Promise.resolve(texts.map((text, i) => ({ _id: String(i), text })))
    ),
    countDocuments: jest.fn(() => Promise.resolve(texts.length)),
  } as never);

const renderLog = async (text: string) => {
  const { results } = await createService([text]).getUserLogs(USER_ID, {});

  return results[0].text;
};

describe("UserLogsService.getUserLogs", () => {
  it("drops the comment block from a log written by the current format", async () => {
    const text = await renderLog(
      "<!--segment:added--><b>Added game to playthroughs</b>" +
        '<div style="font-size: 12px">Status: Completed<br/>Time: 5h</div>' +
        '<div style="font-size: 12px">Comment:</div><p>Loved it</p>'
    );

    expect(text).toBe(
      "<b>Added game to playthroughs</b>" +
        '<div style="font-size: 12px">Status: Completed<br/>Time: 5h</div>'
    );
  });

  it("drops the inline comment from a legacy log", async () => {
    const text = await renderLog(
      "<b>Updated playthrough</b>" +
        '<span style="font-size: 12px">Status: Playing<br/>Console: PS4' +
        "<br/>Comment: <p>Still going</p></span>"
    );

    expect(text).toBe(
      "<b>Updated playthrough</b>" +
        '<span style="font-size: 12px">Status: Playing<br/>Console: PS4</span>'
    );
  });

  it("strips the comment of every segment of a merged log", async () => {
    const text = await renderLog(
      "<!--segment:added--><b>Added game to playthroughs</b>" +
        '<div style="font-size: 12px">Status: Playing</div>' +
        '<div style="font-size: 12px">Comment:</div><p>First</p>' +
        "<br/><br/><!--segment:rating-->Set rating 8"
    );

    expect(text).toBe(
      "<b>Added game to playthroughs</b>" +
        '<div style="font-size: 12px">Status: Playing</div>' +
        "<br/><br/>Set rating 8"
    );
  });

  it("keeps a log that carries no comment untouched", async () => {
    const text = await renderLog(
      "<!--segment:updated--><b>Updated playthrough</b>" +
        '<div style="font-size: 12px">Date: 06.09.2026</div>'
    );

    expect(text).toBe(
      "<b>Updated playthrough</b>" +
        '<div style="font-size: 12px">Date: 06.09.2026</div>'
    );
  });
});
