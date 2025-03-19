import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "./redux/slices/productSlice";
import AddProductModal from "./components/AddProductModal";
import BulkEditModal from "./components/BulkEditModal";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";


const App = () => {
  const dispatch = useDispatch();
  const { list, status } = useSelector((state) => state.products);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRowId, setEditRowId] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});
  const [materials, setMaterials] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filter, setFilter] = useState({ product: "", material: "", grade: "" });
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortedProducts, setSortedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [productCounts, setProductCounts] = useState([]);
  const [productList, setProductList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideMaterial, setHideMaterial] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    fetch("http://localhost:5000/materials")
    .then((res) => res.json())
    .then((data) => setMaterials(Array.isArray(data) ? data : []))
    .catch((error) => {console.error(" Error fetching materials:", error);
     setMaterials([]);
    });

    fetch("http://localhost:5000/products")
    .then((res) => res.json())
    .then((data) => setProductList(data))
    .catch((error) => console.error(" Error fetching products:", error));

    fetch("http://localhost:5000/grades")
      .then((res) => res.json())
      .then((data) => setGrades(Array.isArray(data) ? data : []))
      .catch((error) => {console.error(" Error fetching grades:", error);
      setGrades([]);
  });

  }, [dispatch]);

  // Handle Quick Edit Click
  const handleQuickEdit = (product, hideMaterialField = false) => {
    if (editRowId === product._id) {
      setEditRowId(null);
      setEditedProduct({});
      setHideMaterial(hideMaterialField);
    } else {
      setEditRowId(product._id);
      setEditedProduct({ ...product, materialId: product.materialId?._id || "" }); //  Add materialId
      setHideMaterial(hideMaterialField);
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort />; // Default sort icon
    return sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };
  
  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Toggle sort order
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.includes(productId)
        ? prevSelected.filter((id) => id !== productId) // Remove if already selected
        : [...prevSelected, productId] // Add if not selected
    );
  };
  

  useEffect(() => {
    let updatedProducts = [...filteredProducts]; //  Use updated filtered list
  
    if (sortField) {
      updatedProducts.sort((a, b) => {
        let valueA = a[sortField] || "";
        let valueB = b[sortField] || "";

        if (sortField === "finalProductName") { // Sorting by Name
          return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
        else if (sortField === "materialId") {
          valueA = a.materialId?.name || "";
          valueB = b.materialId?.name || "";
          return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        } else if (sortField === "gradeId") {
          valueA = a.gradeId?.name || "";
          valueB = b.gradeId?.name || "";
          return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        } else if (sortField === "price") {
          valueA = a.price !== null && a.price !== undefined ? parseFloat(a.price) : 0; //  Convert null/undefined to 0
          valueB = b.price !== null && b.price !== undefined ? parseFloat(b.price) : 0; //  Convert null/undefined to 0
          return sortOrder === "asc" ? valueA - valueB : valueB - valueA; //  Numeric sorting
        }
  
        return 0; // Default: No sorting
      });
    }
  
    setSortedProducts(updatedProducts); //  Update State
  }, [filteredProducts, sortField, sortOrder]);
  //  Updates when filtering or sorting changes
   

  useEffect(() => {
    const updatedProducts = list.filter((product) => {
      return (
        (searchQuery === "" || product.finalProductName.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filter.product === "" || product.productId?.name.toLowerCase().includes(filter.product.toLowerCase())) &&
        (filter.material === "" || product.materialId?.name.toLowerCase().includes(filter.material.toLowerCase())) &&
        (filter.grade === "" || product.gradeId?.name.toLowerCase().includes(filter.grade.toLowerCase()))
      );
    });
  
    setFilteredProducts(updatedProducts);
  }, [list, searchQuery, filter]); //  Updates whenever list or filters change
  
  useEffect(() => {
    fetch("http://localhost:5000/product-combinations/count-by-product")
      .then((res) => res.json())
      .then((data) => setProductCounts(data))
      .catch((error) => console.error("Error fetching product counts:", error));
  }, []);

  const handleBulkSave = async (bulkEditData) => {
    if (!selectedProducts.length) {
      alert("Please select products to update.");
      return;
    }
  
    try {
      console.log(" Sending Bulk Edit Request:", { selectedProducts, bulkEditData });
  
      const response = await fetch("http://localhost:5000/bulk-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedProducts.map((id) => id.toString()), //  Ensure proper ID format
          updateData: bulkEditData,
        }),
      });
  
      const result = await response.json();
      console.log(" Bulk Edit Response:", result);
  
      if (!response.ok) {
        throw new Error(result.error || "Bulk update failed.");
      }
  
      alert("Products updated successfully!");
      setIsBulkEditOpen(false);
      setSelectedProducts([]); //  Clear selection after update
      dispatch(fetchProducts()); //  Refresh list
    } catch (error) {
      console.error(" Bulk edit failed:", error);
      alert("Failed to update products.");
    }
  };
  
    
  
  

  // Handle Input Change
  const handleChange = (e) => {
    setEditedProduct({ ...editedProduct, [e.target.name]: e.target.value });
  };

  // Handle Save
  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:5000/product-combinations/${editedProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: editedProduct.materialId, //  Send updated materialId
          shape: editedProduct.shape,
          length: editedProduct.length,
          thickness: editedProduct.thickness,
          price: editedProduct.price
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update product");
      }
  
      const updatedProduct = await response.json();
      console.log(" Product Updated:", updatedProduct);
  
      //  Update the list with new data
      setEditRowId(null);
      dispatch(fetchProducts()); // Re-fetch updated product list
    } catch (error) {
      console.error(" Update failed:", error);
      alert("Failed to update product. Please try again.");
    }
  };
  

  return (
    
        
    
    <div className="container py-4">
      <header>
        <h1>Product Inventory Management</h1>
    </header>
      {/* Search and Add Button */}
      <div className="d-flex justify-content-between mb-3">
      <input
          type="text"
          className="form-control w-50"
          placeholder="Search Products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          Add Product
        </button>
      </div>
      {/* filter */}
      <div className="d-flex gap-3 mb-3">

      <select
    className="form-control w-25" onChange={(e) => setFilter({ ...filter, product: e.target.value })}>
      <option value="">All Products</option>
       {productList.map((product) => (
         <option key={product._id} value={product.name}>
        {product.name}
         </option>
       ))}
      </select>

        <select className="form-control w-25" onChange={(e) => setFilter({ ...filter, material: e.target.value })}>
          <option value="">All Materials</option>
          {materials.map((material) => (
            <option key={material._id} value={material.name}>
              {material.name}
            </option>
          ))}
        </select>

        <select className="form-control w-25" onChange={(e) => setFilter({ ...filter, grade: e.target.value })}>
          <option value="">All Grades</option>
          {grades.map((grade) => (
            <option key={grade._id} value={grade.name}>
              {grade.name}
            </option>
          ))}
        </select>

        <button className="btn btn-secondary" onClick={() => setFilter({ product: "", material: "", grade: "" })}>
          Reset Filters
        </button>
      </div>

      {/* Bulk Actions */}
    <div className="mb-3">
    <button className="btn btn-primary" onClick={() => {
  if (selectedProducts.length === 0) {
    alert("Please select at least one product to edit.");
    return;
  }
  setIsBulkEditOpen(true);
}}>
  Bulk Edit
</button>

    </div>

      {/* Products Table */}
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
          <th>
        {/* Select All Checkbox */}
        <input
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProducts(sortedProducts.map((p) => p._id)); // Select all
            } else {
              setSelectedProducts([]); // Deselect all
            }
          }}
          checked={selectedProducts.length === sortedProducts.length && sortedProducts.length > 0}
           />
           </th>
           <th onClick={() => handleSort("finalProductName")}>
              Name {renderSortIcon("finalProductName")}
            </th>
            <th onClick={() => handleSort("materialId")}>
              Material {renderSortIcon("materialId")}
             </th>
            <th onClick={() => handleSort("price")}>
               Price {renderSortIcon("price")}
            </th>
            <th onClick={() => handleSort("gradeId")}>
              Grade {renderSortIcon("gradeId")}
            </th>
            <th>Shape</th>
            <th>Length</th>
            <th>Thickness</th>
            <th>Actions</th>
            
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map((product) => (
            <React.Fragment key={product._id}>  {/*  Use MongoDB _id */}
              <tr>
              <td>
          {/*  Individual Checkbox */}
          <input
            type="checkbox"
            checked={selectedProducts.includes(product._id)}
            onChange={() => handleSelectProduct(product._id)}
          />
        </td>
                <td>{product.finalProductName}</td>
                <td>{product.materialId.name}</td>
                <td>{product.price}</td>
                <td>{product.gradeId.name}</td>
                <td>{product.shape}</td>
                <td>{product.length}</td>
                <td>{product.thickness}</td>
                <td>
                <button className="btn btn-info btn-sm me-2" onClick={() => handleQuickEdit(product, true)}>
                    Add Details
                  </button>
                  <button className="btn btn-warning btn-sm me-2" onClick={() => handleQuickEdit(product, false)}>
                    Quick Edit
                  </button>
                </td>
              </tr>

              {/* Show Expanded Row Only for the Selected Product */}
              {editRowId === product._id && (
                <tr>
                  <td colSpan="9">
                    <div className="p-3 border bg-light">
                      <div className="row">
                      {/* Material Selection */}
               {!hideMaterial && (
               <div className="col-md-4">
                 <label className="form-label">Material</label>
                   <select
                    className="form-control"
                    name="materialId"
                    defaultValue=""
                    onChange={(e) => setEditedProduct({ ...editedProduct, materialId: e.target.value })}
                    >
                   {materials.map((material) => (
                     <option key={material._id} value={material._id}>
                   {material.name}
                  </option>
                   ))}
                 </select>
               </div>
                      )}

                     <div className="col-md-4">
                        <label className="form-label">Shape</label>
                        <input
                          type="text"
                          className="form-control"
                          name="shape"
                          defaultValue=""
                          onChange={handleChange}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Length</label>
                        <input
                          type="text"
                          className="form-control"
                          name="length"
                          defaultValue=""
                          onChange={handleChange}
                        />
                      </div>
                      </div>
                      <div className="row mt-3">
                      <div className="col-md-4">
                        <label className="form-label">Thickness</label>
                        <input
                          type="text"
                          className="form-control"
                          name="thickness"
                          defaultValue=""
                          onChange={handleChange}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Price</label>
                        <input
                          type="number"
                          className="form-control"
                          name="price"
                          defaultValue=""
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4 d-flex align-items-end">
                      <button className="btn btn-success me-2" onClick={handleSave}>
                        Save
                      </button>
                      <button className="btn btn-secondary" onClick={() => setEditRowId(null)}>
                        Cancel
                      </button>
                    </div>
                    </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Status Messages */}
      {status === "loading" && <p className="text-warning">Loading...</p>}
      {status === "failed" && <p className="text-danger">Error fetching products</p>}
      {status === "succeeded" && list.length === 0 && <p className="text-muted">No products found.</p>}

      {/* Add Product Modal */}
      {isModalOpen && <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

      <BulkEditModal
      isOpen={isBulkEditOpen}
      onClose={() => setIsBulkEditOpen(false)}
      selectedProducts={selectedProducts}
      materials={materials}
      grades={grades}
      onSave={handleBulkSave}
     />

    </div>
  );
};

export default App;
