

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import Models
const Product = require("./models/Product");
const Material = require("./models/Material");
const Grade = require("./models/Grade");
const ProductCombination = require("./models/ProductCombination");

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log(" MongoDB Connected Successfully!");

    // Insert Sample Data Only If Empty
    const productCount = await Product.countDocuments();
    const materialCount = await Material.countDocuments();
    const gradeCount = await Grade.countDocuments();

    if (productCount === 0) {
      await Product.insertMany([{ name: "Pipe" }, { name: "Tubing" }, { name: "Valves" }, { name: "Gasket" }]);
      console.log(" Products added!");
    }

    if (materialCount === 0) {
      await Material.insertMany([{ name: "Stainless Steel" }, { name: "Carbon Steel" }, { name: "Aluminium" }, { name: "Iron" }, { name: "Plastic" }]);
      console.log("Materials added!");
    }

    if (gradeCount === 0) {
      await Grade.insertMany([{ name: "304" }, { name: "A105" }, { name: "144" }, { name: "C45" }, { name: "A78" }]);
      console.log(" Grades added!");
    }
  })
  .catch((err) => console.error(" MongoDB Connection Error:", err));

// Routes
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/materials", async (req, res) => {
  try {
    const materials = await Material.find();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

app.get("/grades", async (req, res) => {
  try {
    const grades = await Grade.find();
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

app.get("/product-combinations", async (req, res) => {
  try {
    console.log(" Fetching Product Combinations...");
    
    const productCombinations = await ProductCombination.find()
      .populate("productId", "name")
      .populate("materialId", "name")
      .populate("gradeId", "name");

    console.log("Retrieved Product Combinations:", productCombinations);

    res.json(productCombinations);
  } catch (error) {
    console.error(" Error fetching product combinations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Product Combination
app.post("/product-combinations", async (req, res) => {
  try {
    console.log(" Received Data in Backend:", req.body);

    const { productId, materialId, gradeIds, finalProducts, shape, length, thickness, price } = req.body;
    if (!productId || !materialId || !gradeIds || gradeIds.length === 0) {
      console.warn(" Invalid Data Received:", req.body);
      return res.status(400).json({ error: "All fields are required" });
    }

    const productCombinations = gradeIds.map((gradeId, index) => ({
      productId,
      materialId,
      gradeId,
      finalProductName: finalProducts[index] || "Unknown",
      shape: shape || "", // Store empty string if not provided
      length: length || "",
      thickness: thickness || "",
      price: price || "",
    }));

    console.log("💾 Saving to Database:", productCombinations);
    await ProductCombination.insertMany(productCombinations);
    res.status(201).json({ message: "Product combinations added successfully" });

  } catch (error) {
    console.error(" Backend Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Update Product Combination
app.put("/product-combinations/:id", async (req, res) => {
  try {
    const { materialId, shape, length, thickness, price } = req.body;

    // Fetch related data to update finalProductName
    const productCombination = await ProductCombination.findById(req.params.id)
      .populate("productId", "name")
      .populate("materialId", "name")
      .populate("gradeId", "name");

    if (!productCombination) {
      return res.status(404).json({ error: "Product Combination not found" });
    }

    // Fetch new Material Name (if changed)
    const updatedMaterial = await Material.findById(materialId);
    const newMaterialName = updatedMaterial ? updatedMaterial.name : productCombination.materialId.name;

    // Recalculate finalProductName
    const finalProductName = `${newMaterialName} ${productCombination.gradeId.name} ${productCombination.productId.name}`;

    //  Update Product Combination
    const updatedProduct = await ProductCombination.findByIdAndUpdate(
      req.params.id,
      { materialId, shape, length, thickness, price, finalProductName }, //  Auto-update finalProductName
      { new: true }
    );

    console.log(" Product Updated:", updatedProduct);
    res.json(updatedProduct);
  } catch (error) {
    console.error(" Error updating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/bulk-update", async (req, res) => {
  try {
    const { productIds, updateData } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Invalid or missing product IDs" });
    }

    const validIds = productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      return res.status(400).json({ error: "Invalid ObjectId format" });
    }

    console.log("🔵 Bulk Editing Products:", { validIds, updateData });

    // Fetch all selected products
    const updatedProducts = await ProductCombination.find({ _id: { $in: validIds } })
      .populate("productId")
      .populate("materialId")
      .populate("gradeId");

    // Update each product separately, preserving existing values
    for (let product of updatedProducts) {
      let updatedFields = {}; // Start with an empty object

      // ✅ Update only provided fields, keep old ones if missing
      if (updateData.materialId) updatedFields.materialId = updateData.materialId;
      if (updateData.gradeId) updatedFields.gradeId = updateData.gradeId;
      if (updateData.shape !== undefined) updatedFields.shape = updateData.shape;
      if (updateData.length !== undefined) updatedFields.length = updateData.length;
      if (updateData.thickness !== undefined) updatedFields.thickness = updateData.thickness;
      if (updateData.price !== undefined) updatedFields.price = updateData.price;

      // ✅ Recompute `finalProductName`
      const materialName = updateData.materialId 
        ? (await Material.findById(updateData.materialId))?.name || product.materialId?.name
        : product.materialId?.name;
        
      const gradeName = updateData.gradeId 
        ? (await Grade.findById(updateData.gradeId))?.name || product.gradeId?.name
        : product.gradeId?.name;

      const productName = product.productId?.name;
      updatedFields.finalProductName = `${materialName} ${gradeName} ${productName}`;

      // ✅ Perform the update only with fields that are explicitly provided
      await ProductCombination.findByIdAndUpdate(product._id, { $set: updatedFields }, { new: true });
    }

    res.json({ message: "Bulk update successful" });
  } catch (error) {
    console.error("❌ Error in bulk edit:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});



app.get("/product-combinations/count-by-product", async (req, res) => {
  try {
    const productCounts = await ProductCombination.aggregate([
      {
        $group: {
          _id: "$productId", //  Group by `productId`
          count: { $sum: 1 } // Count occurrences of each product
        }
      },
      {
        $lookup: {
          from: "products", //  Join with `products` collection
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails" // Convert array result into an object
      },
      {
        $project: {
          productName: "$productDetails.name", // Keep only product name
          count: 1, //  Keep count
          _id: 0 //  Remove `_id` from the output
        }
      }
    ]);

    res.json(productCounts); //  Send result to frontend
  } catch (error) {
    console.error("Error counting products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/product-combinations/count-by-material", async (req, res) => {
  try {
    const materialCounts = await ProductCombination.aggregate([
      {
        $group: {
          _id: "$materialId", //  Group by `materialId`
          count: { $sum: 1 } //  Count occurrences of each material
        }
      },
      {
        $lookup: {
          from: "materials", //  Join with `materials` collection
          localField: "_id",
          foreignField: "_id",
          as: "materialDetails"
        }
      },
      {
        $unwind: "$materialDetails" //  Convert array result into an object
      },
      {
        $project: {
          materialName: "$materialDetails.name", //  Keep only material name
          count: 1, //  Keep count
          _id: 0 //  Remove `_id` from the output
        }
      }
    ]);

    res.json(materialCounts);
  } catch (error) {
    console.error("Error counting materials:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
