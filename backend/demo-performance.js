const mongoose = require("mongoose");
const Book = require("./src/books/book.model");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bookstore")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Demo performance comparison
const demoPerformance = async () => {
  console.log("\n🎯 MongoDB Performance Demo");
  console.log("==========================\n");

  try {
    // Test 1: Non-optimized query
    console.log("📊 Test 1: Non-optimized query (baseline)");
    const start1 = Date.now();
    const books1 = await Book.find().sort({ createdAt: -1 });
    const end1 = Date.now();
    const time1 = end1 - start1;
    console.log(`   ⏱️  Time: ${time1}ms | Records: ${books1.length}`);

    // Test 2: Optimized query with lean() and projection
    console.log("\n📊 Test 2: Optimized query (with lean + projection)");
    const start2 = Date.now();
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
    console.log(`   ⏱️  Time: ${time2}ms | Records: ${books2.length}`);

    // Test 3: Indexed query (category)
    console.log("\n📊 Test 3: Indexed query (by category)");
    const start3 = Date.now();
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
    console.log(`   ⏱️  Time: ${time3}ms | Records: ${books3.length}`);

    // Calculate improvements
    const improvement1 = (((time1 - time2) / time1) * 100).toFixed(2);
    const improvement2 = (((time1 - time3) / time1) * 100).toFixed(2);

    console.log("\n📈 Performance Analysis");
    console.log("======================");
    console.log(`🎯 Query 1 vs Query 2: ${improvement1}% improvement`);
    console.log(`🎯 Query 1 vs Query 3: ${improvement2}% improvement`);

    if (parseFloat(improvement1) >= 40) {
      console.log(
        `\n✅ Target achieved: 40%+ improvement with basic optimization!`
      );
    } else {
      console.log(
        `\n⚠️  Target not yet reached: Need ${(
          40 - parseFloat(improvement1)
        ).toFixed(2)}% more improvement`
      );
    }

    // Show optimization techniques used
    console.log("\n💡 Optimization Techniques Applied:");
    console.log("==================================");
    console.log("1. ✅ MongoDB indexes for faster lookups");
    console.log("2. ✅ .lean() for memory efficiency");
    console.log("3. ✅ Field projection to reduce data transfer");
    console.log("4. ✅ Compound indexes for complex queries");
    console.log("5. ✅ Text search index for search functionality");

    console.log("\n🔧 To run full performance tests:");
    console.log("   node performance-test.js");
  } catch (error) {
    console.error("❌ Demo error:", error.message);
  }

  process.exit(0);
};

// Run demo
demoPerformance().catch(console.error);
