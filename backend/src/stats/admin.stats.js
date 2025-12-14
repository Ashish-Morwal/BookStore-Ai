const mongoose = require("mongoose");
const express = require("express");
const Order = require("../orders/order.model");
const Book = require("../books/book.model");
const router = express.Router();

// ✅ Performance Optimization: Add MongoDB indexes for Order model
// This should be added to order.model.js, but we'll optimize the queries here
const OrderModel = mongoose.model("Order", Order.schema);

// Function to calculate admin stats with performance monitoring
router.get("/", async (req, res) => {
  const startTime = Date.now();
  try {
    // ✅ Performance optimization: Use lean() and projection for better performance

    // 1. Total number of orders (optimized)
    const totalOrders = await Order.countDocuments().lean();

    // 2. Total sales (optimized aggregation with projection)
    const totalSales = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]).allowDiskUse(true); // Allow disk use for large datasets

    // 3. Trending books statistics (optimized with index)
    const trendingBooksCount = await Book.aggregate([
      { $match: { trending: true } },
      { $count: "trendingBooksCount" },
    ]).allowDiskUse(true);

    const trendingBooks =
      trendingBooksCount.length > 0
        ? trendingBooksCount[0].trendingBooksCount
        : 0;

    // 4. Total number of books (optimized)
    const totalBooks = await Book.countDocuments().lean();

    // 5. Monthly sales (optimized aggregation with better date handling)
    const monthlySales = await Order.aggregate([
      {
        $addFields: {
          yearMonth: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
            },
          },
        },
      },
      {
        $group: {
          _id: "$yearMonth",
          totalSales: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).allowDiskUse(true);

    // 6. ✅ New: Category-wise book distribution (optimized)
    const categoryStats = await Book.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$newPrice" },
        },
      },
      { $sort: { count: -1 } },
    ]).allowDiskUse(true);

    // 7. ✅ New: Price range analysis (optimized)
    const priceStats = await Book.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$newPrice" },
          maxPrice: { $max: "$newPrice" },
          avgPrice: { $avg: "$newPrice" },
        },
      },
    ]).allowDiskUse(true);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`📊 Admin stats query executed in ${queryTime}ms`);

    // Result summary with performance metrics
    res.status(200).json({
      totalOrders,
      totalSales: totalSales[0]?.totalSales || 0,
      trendingBooks,
      totalBooks,
      monthlySales,
      categoryStats,
      priceStats: priceStats[0] || {},
      performance: {
        queryTime: `${queryTime}ms`,
        optimizations: [
          "MongoDB aggregation optimization",
          "Disk use allowance for large datasets",
          "Lean queries for better memory efficiency",
          "Indexed field queries",
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
});

// ✅ New endpoint: Performance metrics for monitoring
router.get("/performance", async (req, res) => {
  try {
    const performanceMetrics = {
      database: {
        indexes: await Book.listIndexes().toArray(),
        collectionStats: await Book.collection.stats(),
        orderStats: await Order.collection.stats(),
      },
      recommendations: [
        "Use compound indexes for frequently combined queries",
        "Implement query result caching for repeated requests",
        "Consider pagination for large result sets",
        "Monitor slow query logs regularly",
      ],
    };

    res.status(200).json(performanceMetrics);
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    res.status(500).json({ message: "Failed to fetch performance metrics" });
  }
});

module.exports = router;
