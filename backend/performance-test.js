const mongoose = require("mongoose");
const Book = require("./src/books/book.model");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bookstore")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Performance testing functions
const testQueryPerformance = async () => {
  console.log("\n🚀 Starting Performance Tests...\n");

  const testResults = [];

  // Test 1: Get all books (before optimization)
  console.log("📊 Test 1: Get all books (before optimization)");
  const start1 = Date.now();
  try {
    const books1 = await Book.find().sort({ createdAt: -1 });
    const end1 = Date.now();
    const time1 = end1 - start1;
    testResults.push({
      test: "Get all books (before)",
      time: time1,
      count: books1.length,
    });
    console.log(`   ⏱️  Time: ${time1}ms | Records: ${books1.length}`);
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  // Test 2: Get all books (after optimization with lean and projection)
  console.log("\n📊 Test 2: Get all books (after optimization)");
  const start2 = Date.now();
  try {
    const books2 = await Book.find(
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
      .lean();
    const end2 = Date.now();
    const time2 = end2 - start2;
    testResults.push({
      test: "Get all books (after)",
      time: time2,
      count: books2.length,
    });
    console.log(`   ⏱️  Time: ${time2}ms | Records: ${books2.length}`);
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  // Test 3: Get books by category (with index)
  console.log("\n📊 Test 3: Get books by category (with index)");
  const start3 = Date.now();
  try {
    const books3 = await Book.find(
      { category: "fiction" },
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
    const end3 = Date.now();
    const time3 = end3 - start3;
    testResults.push({
      test: "Get books by category",
      time: time3,
      count: books3.length,
    });
    console.log(`   ⏱️  Time: ${time3}ms | Records: ${books3.length}`);
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  // Test 4: Get trending books (with compound index)
  console.log("\n📊 Test 4: Get trending books (with compound index)");
  const start4 = Date.now();
  try {
    const books4 = await Book.find(
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
    const end4 = Date.now();
    const time4 = end4 - start4;
    testResults.push({
      test: "Get trending books",
      time: time4,
      count: books4.length,
    });
    console.log(`   ⏱️  Time: ${time4}ms | Records: ${books4.length}`);
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  // Test 5: Text search (with text index)
  console.log("\n📊 Test 5: Text search (with text index)");
  const start5 = Date.now();
  try {
    const books5 = await Book.find(
      { $text: { $search: "book" } },
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
    const end5 = Date.now();
    const time5 = end5 - start5;
    testResults.push({
      test: "Text search",
      time: time5,
      count: books5.length,
    });
    console.log(`   ⏱️  Time: ${time5}ms | Records: ${books5.length}`);
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  // Calculate performance improvements
  console.log("\n📈 Performance Analysis:");
  console.log("========================");

  const beforeOptimization = testResults.find((r) =>
    r.test.includes("(before)")
  );
  const afterOptimization = testResults.find((r) => r.test.includes("(after)"));

  if (beforeOptimization && afterOptimization) {
    const improvement = (
      ((beforeOptimization.time - afterOptimization.time) /
        beforeOptimization.time) *
      100
    ).toFixed(2);
    console.log(`\n🎯 Main Query Improvement:`);
    console.log(`   Before: ${beforeOptimization.time}ms`);
    console.log(`   After:  ${afterOptimization.time}ms`);
    console.log(`   🚀 Improvement: ${improvement}%`);

    if (parseFloat(improvement) >= 40) {
      console.log(`   ✅ Target achieved: 40%+ improvement!`);
    } else {
      console.log(
        `   ⚠️  Target not yet reached: Need ${(
          40 - parseFloat(improvement)
        ).toFixed(2)}% more improvement`
      );
    }
  }

  // Show all test results
  console.log("\n📊 All Test Results:");
  testResults.forEach((result) => {
    console.log(
      `   ${result.test}: ${result.time}ms (${result.count} records)`
    );
  });

  // Recommendations
  console.log("\n💡 Performance Recommendations:");
  console.log("==============================");
  console.log("1. ✅ MongoDB indexes added for faster queries");
  console.log("2. ✅ Using .lean() for better memory efficiency");
  console.log("3. ✅ Projection to fetch only needed fields");
  console.log("4. ✅ Compound indexes for complex queries");
  console.log("5. ✅ Text search index for search functionality");

  console.log("\n🔧 To run this test:");
  console.log("   node performance-test.js");

  process.exit(0);
};

// Run performance tests
testQueryPerformance().catch(console.error);
