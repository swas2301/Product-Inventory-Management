import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ Define `addProduct` separately
export const addProduct = createAsyncThunk("products/add", async (newProduct) => {
  const response = await axios.post("http://localhost:5000/product-combinations", newProduct);
  return response.data;
});
