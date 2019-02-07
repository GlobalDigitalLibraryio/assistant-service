const { List, BasicCard, Image, Suggestions } = require("actions-on-google");
const utils = require("./utils");
const bookAPI = require("./book-api");

exports.start = conv => {
  conv.user.storage = {};
  conv.ask(conv.body.queryResult.fulfillmentText);
};

exports.quit = conv => {
  conv.user.storage = {};
  conv.close("Thank you, and good bye!");
};

exports.listBooks = async conv => {
  const query = conv.body.queryResult;
  if (query) {
    // If the user clicks or says he/she wish the assistant to read book with title X
    if (query.queryText === "actions_intent_OPTION") {
      const input = conv.arguments.parsed.input;
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
      // Listing all the books on a given topic
      const topic = query.parameters.topic;
      const bookResults = await bookAPI.search(topic);

      if (bookResults.data && bookResults.data.totalCount > 0) {
        const formattedBookResults = utils.getFormattedBookResults(
          bookResults.data.results
        );

        conv.ask(
          utils.formatBookTitles(
            topic,
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
        conv.ask(`No books found for the topic ${topic} :(`);
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
      conv.ask(book.text || book.title);
      conv.ask(
        new Image({
          url: book.image,
          alt: book.chapterId
        })
      );
      conv.ask(new Suggestions("next page"));
    } else {
      conv.ask(`No books found on the topic ${topic}`);
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
