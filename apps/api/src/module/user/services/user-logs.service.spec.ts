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

const renderSegments = async (text: string) => {
  const { results } = await createService([text]).getUserLogs(USER_ID, {});

  return results[0].segments;
};

describe("UserLogsService.getUserLogs segments", () => {
  it("parses the details of a playthrough and a rating in one log", async () => {
    const segments = await renderSegments(
      "<!--segment:added--><b>Added game to playthroughs</b>" +
        '<div style="font-size: 12px">Status: Completed<br/>Console: PC<br/>Date: 16.09.2026<br/>Time: 42h</div>' +
        "<br/><br/><!--segment:rating-->Set rating 9"
    );

    expect(segments).toMatchObject([
      {
        kind: "added",
        title: "Added game to playthroughs",
        status: "Completed",
        console: "PC",
        date: "16.09.2026",
        time: "42h",
      },
      { kind: "rating", title: "Set rating 9", rating: 9 },
    ]);
  });

  it("reads the category of a legacy log without markers", async () => {
    const segments = await renderSegments(
      "Added to playing<br/>PC (Microsoft Windows)"
    );

    expect(segments).toMatchObject([
      { kind: "added", status: "Playing", console: "PC (Microsoft Windows)" },
    ]);
  });

  it("marks a removed favourite as a removal", async () => {
    const segments = await renderSegments(
      "<!--segment:favorite--><b>Removed from favourites</b>"
    );

    expect(segments).toMatchObject([{ kind: "favorite", isRemoval: true }]);
  });
});
