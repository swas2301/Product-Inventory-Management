import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addProduct } from "../redux/actions/productActions";
import { fetchProducts } from "../redux/slices/productSlice";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";

const AddProductModal = ({ isOpen, onClose }) => {
  const [productId, setProductId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [shape, setShape] = useState(""); 
  const [length, setLength] = useState(""); 
  const [thickness, setThickness] = useState(""); 
  const [price, setPrice] = useState(""); 
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [grades, setGrades] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [materialCounts, setMaterialCounts] = useState([]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      axios.get("http://localhost:5000/products").then((res) => setProducts(res.data));
      axios.get("http://localhost:5000/materials").then((res) => setMaterials(res.data));
      axios.get("http://localhost:5000/grades").then((res) => setGrades(res.data));
      fetch("http://localhost:5000/product-combinations/count-by-product")
      .then((res) => res.json())
      .then((data) => {
        // Convert array to object for easy lookup
        const counts = data.reduce((acc, product) => {
          acc[product.productName] = product.count;
          return acc;
        }, {});
        setProductCounts(counts);
      })
      .catch((error) => console.error(" Error fetching product counts:", error));

        fetch("http://localhost:5000/product-combinations/count-by-material")
          .then((res) => res.json())
          .then((data) => {
            // Convert array to object for easy lookup
            const counts = data.reduce((acc, material) => {
              acc[material.materialName] = material.count;
              return acc;
            }, {});
            setMaterialCounts(counts);
          })
          .catch((error) => console.error(" Error fetching product counts:", error));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGradeSelection = (gradeId) => {
    setSelectedGrades((prev) =>
      prev.includes(gradeId) ? prev.filter((id) => id !== gradeId) : [...prev, gradeId]
    );
  };

  const handleAddProduct = () => {
    if (!productId || !materialId || selectedGrades.length === 0) {
      alert("All fields are required!");
      return;
    }

    const materialName = materials.find(m => m._id === materialId)?.name || "";
    const productName = products.find(p => p._id === productId)?.name || "";
    const finalProducts = selectedGrades.map(gradeId => {
      const gradeName = grades.find(g => g._id === gradeId)?.name || "";
      return `${materialName} ${gradeName} ${productName}`;
    });

    const payload = {
      productId,
      materialId,
      gradeIds: selectedGrades,
      finalProducts,
      shape: shape || "", // ✅ Send empty string if not provided
      length: length || "", // ✅ Send empty string if not provided
      thickness: thickness || "", // ✅ Send empty string if not provided
      price: price || "", // ✅ Send empty string if not provided
    };

    console.log("📡 Sending API Request with Payload:", payload);

    dispatch(addProduct(payload))
      .unwrap()
      .then(() => {
        dispatch(fetchProducts()); 
        setProductId("");
        setMaterialId("");
        setSelectedGrades([]);
        setShape("");
        setLength("");
        setThickness("");
        setPrice("");
        onClose();
      })
      .catch((error) => {
        console.error("❌ Failed to send data to backend:", error);
        alert("Error sending data. Check console for details.");
      });
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
  <Modal.Header closeButton>
    <Modal.Title>Add Product Combination</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <div className="row">
      {/* Product Selection */}
      <div className="col-md-4">
        <h6>Select Product</h6>
        <div className="d-flex flex-wrap">
          {products.map((product) => (
            <div
              key={product._id}
              className={`card m-1 p-2 ${productId === product._id ? "border-primary" : ""}`}
              style={{ cursor: "pointer", minWidth: "120px", textAlign: "center" }}
              onClick={() => setProductId(product._id)}
            >
              {product.name} ({productCounts[product.name] || 0})
            </div>
          ))}
        </div>
      </div>

      {/* Material Selection */}
      <div className="col-md-4">
        <h6>Select Material</h6>
        <div className="d-flex flex-wrap">
          {materials.map((material) => (
            <div
              key={material._id}
              className={`card m-1 p-2 ${materialId === material._id ? "border-primary" : ""}`}
              style={{ cursor: "pointer", minWidth: "120px", textAlign: "center" }}
              onClick={() => setMaterialId(material._id)}
            >
              {material.name} ({materialCounts[material.name] || 0})
            </div>
          ))}
        </div>
      </div>

      {/* Grades Selection */}
      <div className="col-md-4">
        <h6>Select Grades</h6>
        <div className="d-flex flex-wrap">
          {grades.map((grade) => (
            <Form.Check
              key={grade._id}
              type="checkbox"
              label={grade.name}
              value={grade._id}
              checked={selectedGrades.includes(grade._id)}
              onChange={() => handleGradeSelection(grade._id)}
              className="me-3"
            />
          ))}
        </div>
      </div>
    </div>
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>Close</Button>
    <Button variant="primary" onClick={handleAddProduct}>Add Product</Button>
  </Modal.Footer>
</Modal>

  
      );
    };
    
    export default AddProductModal;
    
 