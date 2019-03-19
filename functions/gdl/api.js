const { List, BasicCard, Image, Suggestions } = require("actions-on-google");
const utils = require("./utils");
const bookAPI = require("./book-api");

exports.start = conv => {
  conv.user.storage = {};
  conv.ask(conv.body.queryResult.fulfillmentText);
};

exports.quit = conv => {
  conv.user.storage = {};
  conv.close(conv.body.queryResult.fulfillmentText);
};

exports.listBooks = async conv => {
  const query = conv.body.queryResult;
  if (query) {
    // If the user clicks or says he/she wish the assistant to read book with title X
    if (query.queryText === "actions_intent_OPTION") {
      const input = conv.arguments.parsed.input;
      if (!input) {
        conv.ask("Sorry, we did not get that. Could you please try again?");
        return;
      }
      const book = await bookAPI.getBook(input.OPTION);

      conv.user.storage = utils.storeBook(book);

      conv.ask(book.text || book.title);
      conv.ask(
        new Image({
          url: book.image,
          alt: book.chapterId
        })
      );
      conv.ask(new Suggestions("next page"));
    } else {
      // Listing all the books on a given topic or level
      const { topic, level } = query.parameters;

      let bookResults;
      if (!!topic) {
        bookResults = await bookAPI.search(topic);
      } else if (!!level) {
        bookResults = await bookAPI.getBooksFromReadingLevel(level);
      } else {
        conv.ask(
          "I could not understand what you said. Can you please try again?"
        );
        return;
      }

      if (bookResults && bookResults.data && bookResults.data.totalCount > 0) {
        const formattedBookResults = utils.getFormattedBookResults(
          bookResults.data.results
        );

        conv.ask(
          utils.formatBookTitles(
            topic,
            level,
            bookResults.data.totalCount,
            bookResults.data.results
          )
        );

        /**
         * Since the 'List'-API only accept list of 2-30 items, we have to display a 'Card' if we only gets one result
         */
        if (bookResults.data.totalCount === 1) {
          conv.ask(
            new BasicCard({
              title: bookResults.data.results[0].title,
              image: new Image({
                url: bookResults.data.results[0].coverImage.url,
                alt: bookResults.data.results[0].title
              })
            })
          );
          conv.ask(new Suggestions(`Read ${topic}`));
        } else {
          conv.ask(
            new List({
              items: formattedBookResults
            })
          );
        }
      } else {
        conv.ask(
          `No books found ${
            !!topic ? `for the topic ${topic}` : `for level ${level}`
          }. What else would you like to read about?`
        );
      }
    }
  } else {
    conv.ask("Can you please try again?");
  }
};

exports.readBook = async conv => {
  const query = conv.body.queryResult.parameters;
  if (query) {
    const { topic } = query;
    const bookResults = await bookAPI.search(topic);
    if (bookResults.data && bookResults.data.totalCount > 0) {
      const book = await bookAPI.getBook(bookResults.data.results[0].id);

      // saves the bookId and all chapters for later reading...
      conv.user.storage = utils.storeBook(book);

      // Reads text and display picture in chapters. If its only a picture on the page we just display that.
      conv.ask(
        utils.addReadingPauseAfterText(
          `Starting to read the book ${book.title}`,
          1
        )
      );
      if (book.text) {
        conv.ask(book.text);
      }
      conv.ask(
        new Image({
          url: book.image,
          alt: book.chapterId
        })
      );
      conv.ask(new Suggestions("next page"));
    } else {
      conv.ask(
        `No books found on the topic ${topic}. What else would you like to read about?`
      );
    }
  }
};

exports.readNext = async conv => {
  const { chapters, redSeqNo, bookId, bookTitle } = conv.user.storage;

  const nextChapter = chapters.find(chapter => chapter.seqNo === redSeqNo + 1);

  if (!nextChapter) {
    conv.ask("You are finished reading this book, try finding another one!");
    return;
  }
  const chapterToRead = await bookAPI.getChapter(nextChapter.url, {
    id: bookId,
    chapters: chapters,
    bookTitle: bookTitle
  });

  if (chapterToRead) {
    // Update redSeqNo so we can know which chapter we are currently/done reading
    conv.user.storage.redSeqNo = chapterToRead.seqNo;

    conv.ask(chapterToRead.text);
    conv.ask(
      new Image({
        url: chapterToRead.image,
        alt: chapterToRead.chapterId
      })
    );
    conv.ask(new Suggestions("next page"));
  } else {
    conv.ask("You are finished reading this book, try finding another one!");
  }
};
