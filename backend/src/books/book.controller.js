const Book = require("./book.model");

const postABook = async (req, res) => {
  try {
    const newBook = await Book({ ...req.body });
    await newBook.save();
    res
      .status(200)
      .send({ message: "Book posted successfully", book: newBook });
  } catch (error) {
    console.error("Error creating book", error);
    res.status(500).send({ message: "Failed to create book" });
  }
};

// ✅ Optimized get all books with performance monitoring
const getAllBooks = async (req, res) => {
  const startTime = Date.now();
  try {
    // ✅ Performance optimization: Use lean() for better performance and add projection
    const books = await Book.find(
      {},
      {
        title: 1,
        description: 1,
        category: 1,
        trending: 1,
        coverImage: 1,
        oldPrice: 1,
        newPrice: 1,
        tags: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`📊 getAllBooks query executed in ${queryTime}ms`);

    res.status(200).send({
      books,
      performance: {
        queryTime: `${queryTime}ms`,
        recordCount: books.length,
      },
    });
  } catch (error) {
    console.error("Error fetching books", error);
    res.status(500).send({ message: "Failed to fetch books" });
  }
};

// ✅ Optimized get single book with performance monitoring
const getSingleBook = async (req, res) => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    // ✅ Performance optimization: Use lean() and projection
    const book = await Book.findById(id, {
      title: 1,
      description: 1,
      category: 1,
      trending: 1,
      coverImage: 1,
      oldPrice: 1,
      newPrice: 1,
      tags: 1,
      createdAt: 1,
    }).lean();

    if (!book) {
      return res.status(404).send({ message: "Book not Found!" });
    }

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`📊 getSingleBook query executed in ${queryTime}ms`);

    res.status(200).send({
      book,
      performance: {
        queryTime: `${queryTime}ms`,
      },
    });
  } catch (error) {
    console.error("Error fetching book", error);
    res.status(500).send({ message: "Failed to fetch book" });
  }
};

//Get books by category with performance monitoring
const getBooksByCategory = async (req, res) => {
  const startTime = Date.now();
  try {
    const { category } = req.params;

    const books = await Book.find(
      { category },
      {
        title: 1,
        description: 1,
        category: 1,
        trending: 1,
        coverImage: 1,
        oldPrice: 1,
        newPrice: 1,
        tags: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`📊 getBooksByCategory query executed in ${queryTime}ms`);

    res.status(200).send({
      books,
      category,
      performance: {
        queryTime: `${queryTime}ms`,
        recordCount: books.length,
      },
    });
  } catch (error) {
    console.error("Error fetching books by category", error);
    res.status(500).send({ message: "Failed to fetch books by category" });
  }
};

// ✅ New optimized method: Get trending books with performance monitoring
const getTrendingBooks = async (req, res) => {
  const startTime = Date.now();
  try {
    const books = await Book.find(
      { trending: true },
      {
        title: 1,
        description: 1,
        category: 1,
        trending: 1,
        coverImage: 1,
        oldPrice: 1,
        newPrice: 1,
        tags: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`📊 getTrendingBooks query executed in ${queryTime}ms`);

    res.status(200).send({
      books,
      performance: {
        queryTime: `${queryTime}ms`,
        recordCount: books.length,
      },
    });
  } catch (error) {
    console.error("Error fetching trending books", error);
    res.status(500).send({ message: "Failed to fetch trending books" });
  }
};

// ✅ New method: Search books with text index and performance monitoring
const searchBooks = async (req, res) => {
  const startTime = Date.now();
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).send({ message: "Search query is required" });
    }

    // ✅ Use text search index for better performance
    const books = await Book.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .select({
        title: 1,
        description: 1,
        category: 1,
        trending: 1,
        coverImage: 1,
        oldPrice: 1,
        newPrice: 1,
        tags: 1,
        createdAt: 1,
      })
      .lean();

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`📊 searchBooks query executed in ${queryTime}ms`);

    res.status(200).send({
      books,
      searchQuery: query,
      performance: {
        queryTime: `${queryTime}ms`,
        recordCount: books.length,
      },
    });
  } catch (error) {
    console.error("Error searching books", error);
    res.status(500).send({ message: "Failed to search books" });
  }
};

// update book data
const UpdateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedBook) {
      res.status(404).send({ message: "Book is not Found!" });
    }
    res.status(200).send({
      message: "Book updated successfully",
      book: updatedBook,
    });
  } catch (error) {
    console.error("Error updating a book", error);
    res.status(500).send({ message: "Failed to update a book" });
  }
};

const deleteABook = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBook = await Book.findByIdAndDelete(id);
    if (!deletedBook) {
      res.status(404).send({ message: "Book is not Found!" });
    }
    res.status(200).send({
      message: "Book deleted successfully",
      book: deletedBook,
    });
  } catch (error) {
    console.error("Error deleting a book", error);
    res.status(500).send({ message: "Failed to delete a book" });
  }
};

module.exports = {
  postABook,
  getAllBooks,
  getSingleBook,
  getBooksByCategory,
  getTrendingBooks,
  searchBooks,
  UpdateBook,
  deleteABook,
};
