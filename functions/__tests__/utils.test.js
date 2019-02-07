const { Image } = require("actions-on-google");
const utils = require("../gdl/utils");
const books = require("./books.json");

describe("test findFirstReadablePageInBook", () => {
  it("should sort chapters and return the first", () => {
    expect(utils.findFirstReadablePageInBook(books[0])).toEqual({
      id: 153,
      seqNo: 1,
      url:
        "https://api.test.digitallibrary.io/book-api/v1/books/en/11/chapters/153"
    });
  });
});

describe("test storeBook", () => {
  it("should return parts of the book response", () => {
    const book = books[1];
    expect(utils.storeBook(book)).toEqual({
      bookId: 77,
      bookTitle: "Fat King Thin Dog",
      redSeqNo: undefined, //this is undefined the first time
      chapters: book.chapters
    });
  });

  it("should update 'redSeqNo'", () => {
    const book = books[1];
    const before = utils.storeBook(book);
    expect(before).toEqual({
      bookId: 77,
      bookTitle: "Fat King Thin Dog",
      redSeqNo: undefined, //this is undefined the first time
      chapters: book.chapters
    });

    // update which chapter who has been red
    book.seqNo = 1;

    expect(utils.storeBook(book)).toEqual({
      bookId: 77,
      bookTitle: "Fat King Thin Dog",
      redSeqNo: 1,
      chapters: book.chapters
    });
  });
});

describe("test formatBookResult", () => {
  it("should extract and format relevant values from book result", () => {
    const book = books[0];
    expect(utils.formatBookResult(book)).toEqual({
      id: book.id,
      title: book.title,
      description: book.description,
      readingLevel: book.readingLevel,
      image: new Image({
        url: book.coverImage.url,
        alt: book.title
      })
    });
  });
});

describe("test getFormattedBookResults", () => {
  it("should format list of books to a map with bookId as key", () => {
    const expected = {
      "397": utils.formatBookResult(books[0]),
      "77": utils.formatBookResult(books[1])
    };
    expect(utils.getFormattedBookResults(books)).toEqual(expected);
  });
});

describe("test formatBookTitles", () => {
  it("should return a string with 16 in it (totalCount)", () => {
    expect(utils.formatBookTitles("dog", 16, books)).toMatch("16");
  });

  it("should return a string with 'cat' as topic", () => {
    expect(utils.formatBookTitles("cat", 7, books)).toMatch("cat");
  });
});

describe("test isEmpty(object)", () => {
  it("should return true for empty object", () => {
    expect(utils.isEmpty({})).toBeTruthy();
  });

  it("should return false for object containing values", () => {
    expect(utils.isEmpty({ test: "test" })).toBeFalsy();
  });
});
