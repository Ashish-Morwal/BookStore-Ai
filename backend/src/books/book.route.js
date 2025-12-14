const express = require("express");
const Book = require("./book.model");
const {
  postABook,
  getAllBooks,
  getSingleBook,
  getBooksByCategory,
  getTrendingBooks,
  searchBooks,
  UpdateBook,
  deleteABook,
} = require("./book.controller");
const verifyAdminToken = require("../middleware/verifyAdminToken");
const router = express.Router();

// frontend => backend server => controller => book schema  => database => send to server => back to the frontend
//post = when submit something fronted to db
// get =  when get something back from db
// put/patch = when edit or update something
// delete = when delete something

// post a book
router.post("/create-book", verifyAdminToken, postABook);

// ✅ Optimized routes for better performance
// get all books
router.get("/", getAllBooks);

// ✅ Get books by category (optimized with index)
router.get("/category/:category", getBooksByCategory);

// ✅ Get trending books (optimized with compound index)
router.get("/trending", getTrendingBooks);

// ✅ Search books (optimized with text index)
router.get("/search", searchBooks);

// single book endpoint
router.get("/:id", getSingleBook);

// update a book endpoint
router.put("/edit/:id", verifyAdminToken, UpdateBook);

router.delete("/:id", verifyAdminToken, deleteABook);

module.exports = router;
