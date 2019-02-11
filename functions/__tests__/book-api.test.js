const bookAPI = require("../gdl/book-api");
const utils = require("../gdl/utils");

const TEST_ENV_GDL_ENVIRONMENT = "test";
let randomBooks;
let firstRandomBook;

beforeAll(async () => {
  /**
   * Ensure that all tests uses the test environment url's
   * https://stackoverflow.com/questions/48042200/invalidate-node-cache-when-using-jest
   */
  jest.resetModules();
  process.env.GDL_ENVIRONMENT = TEST_ENV_GDL_ENVIRONMENT;
  delete process.env.NODE_ENV;

  randomBooks = await bookAPI.search("");
  firstRandomBook = await bookAPI.getBook(randomBooks.data.results[0].id);
});

describe("test search after books", () => {
  it("should return a 'totalCount' of books about cats greater than 1", async () => {
    expect.assertions(1);
    expect(randomBooks.data.totalCount).toBeGreaterThanOrEqual(1);
  });

  it("should return books about cats in english", async () => {
    expect.assertions(1);
    expect(randomBooks.data.language).toEqual({
      code: "en",
      name: "English"
    });
  });
});

describe("test getBook", () => {
  it("should get basic book content and url´s to all chapters in book", async () => {
    expect.assertions(2);
    const randomBook = randomBooks.data.results[0];
    expect(firstRandomBook).toMatchObject({
      id: randomBook.id,
      title: randomBook.title
    });
    expect(
      firstRandomBook.chapters.filter(chapter => chapter.url !== undefined)
    ).not.toContain(false);
  });

  it("should return 'NOT_FOUND' when book is not found", async () => {
    expect.assertions(1);
    const book = bookAPI.getBook(0);
    await expect(book).rejects.toMatchObject({
      status: 404,
      text: "Not Found"
    });
  });
});

describe("test getChapter", () => {
  it("should get details from a chapter url", async () => {
    expect.assertions(1);
    const firstChapterUrl = utils.findFirstReadablePageInBook(firstRandomBook).url;
    const firstChapter = await bookAPI.getChapter(
      firstChapterUrl,
      firstRandomBook
    );
    await expect(firstChapter).toEqual(firstRandomBook);
  });

  it("should return error if the url is invalid", async () => {
    expect.assertions(1);

    const firstChapter = bookAPI.getChapter(
      "https://api.test.digitallibrary.io/book-api/v1/books/en/495/chapters/1",
      firstRandomBook
    );

    await expect(firstChapter).rejects.toMatchObject({
      status: 404,
      text: "Not Found"
    });
  });
});
