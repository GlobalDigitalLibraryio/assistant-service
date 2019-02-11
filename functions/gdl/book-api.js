const axios = require("axios");
const utils = require("./utils");

// Regex for removing HTML-tags
const regexStripHTML = /(<(.|\n)*?>)|(\n{1,})|(s{3,})/gim;
const regexReplaceConsecutiveSpaces = /\s\s+/g;

bookApiUrl = function() {
  const environment = process.env.GDL_ENVIRONMENT || "dev";

  switch (environment) {
    case "dev":
      return "https://api.test.digitallibrary.io/book-api/v1";
    case "local":
      return "http://book-api.gdl-local:40001/book-api/v1";
    case "prod":
      return "https://api.digitallibrary.io/book-api/v1";
    default:
      return `https://api.${environment}.digitallibrary.io/book-api/v1`;
  }
};

// Search for any book on topic/query given by the user
exports.search = function(query) {
  return axios(
    `${bookApiUrl()}/search/en/?query=${encodeURIComponent(
      query
    )}&page-size=5&page=1`
  );
};

// Get book and first chapter
exports.getBook = function(bookId) {
  return axios(`${bookApiUrl()}/books/en/${bookId}`)
    .then(response => {
      if (!utils.isEmpty(response.data)) {
        return this.getChapter(
          `${utils.findFirstReadablePageInBook(response.data).url}`,
          response.data
        );
      }
      return response.data;
    })
    .catch(error => {
      throw { status: error.response.status, text: error.response.statusText };
    });
};

// Get a specific chapter in book
exports.getChapter = function(url, book) {
  return axios(url)
    .then(chapter => {
      // To skip License pages if they are marked correct
      if (chapter.chapterType === "License") return null;

      const potentialText = chapter.data.content
        .replace(regexStripHTML, "")
        .replace(regexReplaceConsecutiveSpaces, " ");

      return {
        chapterId: chapter.data.id,
        title: book.title,
        seqNo: chapter.data.seqNo,
        text: potentialText,
        image: chapter.data.images[0],
        id: book.id,
        chapterType: chapter.data.chapterType,
        chapters: book.chapters.sort((a, b) => a.seqNo - b.seqNo)
      };
    })
    .catch(error => {
      throw { status: error.response.status, text: error.response.statusText };
    });
};
