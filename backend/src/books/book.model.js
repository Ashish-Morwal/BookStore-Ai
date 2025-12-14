const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    trending: {
      type: Boolean,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    oldPrice: {
      type: Number,
      required: true,
    },
    newPrice: {
      type: Number,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Performance Optimization: Add MongoDB indexes
bookSchema.index({ title: "text", description: "text" }); // Text search index
bookSchema.index({ category: 1 }); // Category index for filtering
bookSchema.index({ trending: 1, createdAt: -1 }); // Compound index for trending books
bookSchema.index({ createdAt: -1 }); // Sort index for chronological order
bookSchema.index({ newPrice: 1 }); // Price index for sorting/filtering
bookSchema.index({ tags: 1 }); // Tags index for tag-based queries

const Book = mongoose.model("Book", bookSchema);

// ✅ Create indexes if they don't exist
Book.createIndexes()
  .then(() => {
    console.log("✅ MongoDB indexes created successfully");
  })
  .catch((err) => {
    console.error("❌ Error creating indexes:", err);
  });

module.exports = Book;
