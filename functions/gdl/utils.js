const { Image } = require("actions-on-google");

exports.formatBookResult = function(bookJson) {
  return {
    id: bookJson.id,
    title: bookJson.title,
    description: bookJson.description,
    readingLevel: bookJson.readingLevel,
    image: new Image({
      url: bookJson.coverImage.url,
      alt: bookJson.title
    })
  };
};

/**
 * Function for formatting book results according to how google-actions want it to be in 'List'
 * https://developers.google.com/actions/assistant/responses#list
 */
exports.getFormattedBookResults = function(booksJson) {
  return booksJson.map(this.formatBookResult).reduce((prevValue, newValue) => {
    prevValue[newValue.id] = newValue;
    return prevValue;
  }, {});
};

/**
 * Function for formatting the text read on 'listing books'
 * ssml language: https://developers.google.com/actions/reference/ssml
 */
exports.formatBookTitles = function(topic, level, totalCount, books) {
  const topicOrLevel =
    topic && topic !== "" ? `with the topic ${topic}` : `on level ${level}`;
  let bookTitles = `<speak><p><s>Found ${totalCount} ${
    totalCount > 1 ? "books" : "book"
  } ${topicOrLevel}.</s><break time="1s"/>
  ${
    totalCount > 1
      ? `<s>Here are the first ${totalCount < 6 ? totalCount : "five"}:</s>`
      : ""
  } <break time="1.5s"/>`;

  books
    .sort((a, b) => a.id - b.id)
    .forEach(book => {
      bookTitles += `<s>${
        book.title.endsWith(".") ? book.title : `${book.title}.`
      }<break time="1s"/></s>
      `;
    });

  bookTitles += "</p></speak>";

  return bookTitles;
};

exports.findFirstReadablePageInBook = function(book) {
  // comment in code below if we dont want cover page to be the first page

  /*const firstReadablePage = book.chapters
    .sort((a, b) => a.seqNo - b.seqNo) // assure chapters to be sorted
    .find(chapter => {
      // If chapter is typed properly the first page after book cover will be type="Content"
      if (chapter.chapterType === "Content") return chapter;
    });
  return (
    firstReadablePage || book.chapters.sort((a, b) => a.seqNo - b.seqNo)[1]
  );*/
  return book.chapters
    ? book.chapters.sort((a, b) => a.seqNo - b.seqNo)[0]
    : null;
};

exports.storeBook = function(book) {
  return {
    bookId: book.id,
    bookTitle: book.title,
    redSeqNo: book.seqNo,
    chapters: book.chapters
  };
};

exports.isEmpty = function(object) {
  // returns true if empty and false if its non-empty
  return !object || Object.keys(object).length === 0;
};

exports.transformReadingLevel = function(level) {
  switch (level.toLowerCase()) {
    case "one":
      return "1";
    case "two":
      return "2";
    case "three":
      return "3";
    case "four":
      return "4";
    case "read aloud":
      return "read-aloud";
    default:
      return null;
  }
};
