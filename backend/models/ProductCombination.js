const mongoose = require("mongoose");

const ProductCombinationSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
  finalProductName: { type: String, required: true },  // Stores "Aluminium 304 Pipes"
  shape: { type: String, default: "" }, 
  length: { type: String, default: "" }, 
  thickness: { type: String, default: "" }, 
  price: { type: String, default: "" } 
});

module.exports = mongoose.model("ProductCombination", ProductCombinationSchema);
