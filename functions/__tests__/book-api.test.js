const bookAPI = require("../gdl/book-api");
const utils = require("../gdl/utils");

const TEST_ENV_GDL_ENVIRONMENT = "test";
let booksAboutCats;
let bookAboutCat;

beforeAll(async () => {
  /**
   * Ensure that all tests uses the test environment url's
   * https://stackoverflow.com/questions/48042200/invalidate-node-cache-when-using-jest
   */
  jest.resetModules();
  process.env.GDL_ENVIRONMENT = TEST_ENV_GDL_ENVIRONMENT;
  delete process.env.NODE_ENV;

  booksAboutCats = await bookAPI.search("cats");
  bookAboutCat = await bookAPI.getBook(booksAboutCats.data.results[0].id);
});

describe("test search after books", () => {
  it("should return a 'totalCount' of books about cats greater than 1", async () => {
    expect.assertions(1);
    expect(booksAboutCats.data.totalCount).toBeGreaterThanOrEqual(1);
  });

  it("should return books about cats in english", async () => {
    expect.assertions(1);
    expect(booksAboutCats.data.language).toEqual({
      code: "en",
      name: "English"
    });
  });

  it("should return books about cats (has cat in title)", async () => {
    expect.assertions(1);
    // We check the first book's title
    const title = booksAboutCats.data.results[0].title.toLowerCase();
    expect(title).toMatch(new RegExp("cat|cats"));
  });
});

describe("test getBook", () => {
  it("should get basic book content and url´s to all chapters in book", async () => {
    expect.assertions(2);
    const firstBookAboutCats = booksAboutCats.data.results[0];
    expect(bookAboutCat).toMatchObject({
      id: firstBookAboutCats.id,
      title: firstBookAboutCats.title
    });
    expect(
      bookAboutCat.chapters.filter(chapter => chapter.url !== undefined)
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
    const firstChapterUrl = utils.findFirstReadablePageInBook(bookAboutCat).url;
    const firstChapter = await bookAPI.getChapter(
      firstChapterUrl,
      bookAboutCat
    );
    await expect(firstChapter).toEqual(bookAboutCat);
  });

  it("should return error if the url is invalid", async () => {
    expect.assertions(1);

    const firstChapter = bookAPI.getChapter(
      "https://api.test.digitallibrary.io/book-api/v1/books/en/495/chapters/1",
      bookAboutCat
    );

    await expect(firstChapter).rejects.toMatchObject({
      status: 404,
      text: "Not Found"
    });
  });
});
