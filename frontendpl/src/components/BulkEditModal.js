import React, { useState } from "react";

const BulkEditModal = ({ isOpen, onClose, selectedProducts, materials, grades, onSave }) => {
  const [bulkEditData, setBulkEditData] = useState({
    materialId: "",
    gradeId: "",
    shape: "",
    length: "",
    thickness: "",
    price: "",
  });

  const handleChange = (e) => {
    setBulkEditData({ ...bulkEditData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (selectedProducts.length === 0) {
      alert("Please select products to update.");
      return;
    }
    onSave(bulkEditData); // ✅ Call parent function to save changes
    onClose(); // ✅ Close modal after saving
  };

  if (!isOpen) return null; // ✅ Hide modal when closed

  return (
    <div className="modal d-block">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Bulk Edit Products</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Material Selection */}
            <div className="mb-2">
              <label className="form-label">Material</label>
              <select className="form-control" name="materialId" onChange={handleChange}>
                <option value="">Select Material</option>
                {Array.isArray(materials) && materials.length > 0 ? (
                materials.map((material) => (
      <option key={material._id} value={material._id}>{material.name}</option>
         ))
          ) : (
    <option disabled>Loading materials...</option> //  Prevents error if materials is empty
  )}
              </select>
            </div>

            {/* Grade Selection */}
            <div className="mb-2">
              <label className="form-label">Grade</label>
              <select className="form-control" name="gradeId" onChange={handleChange}>
                <option value="">Select Grade</option>
                {Array.isArray(grades) && grades.length > 0 ? (
    grades.map((grade) => (
      <option key={grade._id} value={grade._id}>{grade.name}</option>
    ))
  ) : (
    <option disabled>Loading grades...</option> //  Prevents error if grades is empty
  )}
              </select>
            </div>

            {/* Shape, Length, Thickness, Price */}
            {["shape", "length", "thickness", "price"].map((field) => (
              <div className="mb-2" key={field}>
                <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input
                  type="text"
                  className="form-control"
                  name={field}
                  value={bulkEditData[field] || ""}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-success" onClick={handleSave}>Save Changes</button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;
