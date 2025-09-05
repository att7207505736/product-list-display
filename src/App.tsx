import React, { useEffect, useMemo, useState } from "react";
import PRODUCTS from "./assets/products.json";
import "./App.css";

function Input({ label, required, error, ...props }) {
  return (
    <label>
      {label} {required && <span style={{ color: "red" }}>*</span>}
      <input {...props} />
      {error && <span className="error">{error}</span>}
    </label>
  );
}

function Textarea({ label, error, ...props }) {
  return (
    <label>
      {label}
      <textarea rows={3} {...props} />
      {error && <span className="error">{error}</span>}
    </label>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{title}</h3>
        <button onClick={onClose} aria-label="Close">✕</button>
        {children}
      </div>
    </div>
  );
}

function ViewToggle({ view, setView }) {
  return (
    <div className="actions">
      <button className={view === "list" ? "primary" : ""} onClick={() => setView("list")}>List</button>
      <button className={view === "card" ? "primary" : ""} onClick={() => setView("card")}>Card</button>
    </div>
  );
}

function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function Pagination({ total, pageSize, page, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="pagination">
      <div>Page <strong>{page}</strong> of <strong>{totalPages}</strong></div>
      <div className="pages">
        <button onClick={() => onChange(1)} disabled={!canPrev}>« First</button>
        <button onClick={() => onChange(page - 1)} disabled={!canPrev}>‹ Prev</button>
        <button onClick={() => onChange(page + 1)} disabled={!canNext}>Next ›</button>
        <button onClick={() => onChange(totalPages)} disabled={!canNext}>Last »</button>
      </div>
    </div>
  );
}

function ProductForm({ initial, onCancel, onSave }) {
  const [values, setValues] = useState(
    initial || { name: "", price: "", category: "", stock: "", description: "" }
  );
  const [errors, setErrors] = useState({});

  function setField(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function validate() {
    const e = {};
    if (!values.name?.trim()) e.name = "Name is required";
    if (values.price === "" || values.price === null) e.price = "Price is required";
    else if (isNaN(Number(values.price))) e.price = "Price must be a number";
    if (!values.category?.trim()) e.category = "Category is required";
    if (values.stock !== "" && isNaN(Number(values.stock))) e.stock = "Stock must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...values,
      price: Number(values.price),
      stock: values.stock === "" ? 0 : Number(values.stock),
    };
    onSave(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Name"
        required
        value={values.name}
        onChange={(e) => setField("name", e.target.value)}
        error={errors.name}
      />
      <Input
        label="Price"
        required
        value={values.price}
        onChange={(e) => setField("price", e.target.value)}
        error={errors.price}
      />
      <Input
        label="Category"
        required
        value={values.category}
        onChange={(e) => setField("category", e.target.value)}
        error={errors.category}
      />
      <Input
        label="Stock"
        value={values.stock}
        onChange={(e) => setField("stock", e.target.value)}
        error={errors.stock}
      />
      <Textarea
        label="Description (optional)"
        value={values.description}
        onChange={(e) => setField("description", e.target.value)}
      />

      <div className="actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">Save</button>
      </div>
    </form>
  );
}

function ListView({ items, onEdit }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.category}</td>
            <td>₹{p.price.toLocaleString()}</td>
            <td>{p.stock}</td>
            <td>
              <button onClick={() => onEdit(p)}>Edit</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CardView({ items, onEdit }) {
  return (
    <div className="card-grid">
      {items.map((p) => (
        <div key={p.id} className="card">
          <h3>{p.name}</h3>
          <p>{p.category}</p>
          <p>₹{p.price.toLocaleString()}</p>
          <p>Stock: {p.stock}</p>
          {p.description && <p>{p.description}</p>}
          <button onClick={() => onEdit(p)}>Edit</button>
        </div>
      ))}
    </div>
  );
}

export default function ProductManager() {
  const [products, setProducts] = useState(PRODUCTS);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const debouncedValue = useDebouncedValue(query, 500);
  useEffect(() => setDebouncedQuery(debouncedValue), [debouncedValue]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const visible = paginate(filtered, page, pageSize);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(p) {
    setEditing(p);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
  }
  function saveProduct(data) {
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...data } : p)));
    } else {
      const newItem = { id: Date.now(), ...data };
      setProducts((prev) => [newItem, ...prev]);
    }
    setModalOpen(false);
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Products</h1>
        <div className="actions">
          <input
            type="text"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ViewToggle view={view} setView={setView} />
          <button onClick={openAdd} className="primary">+ Add Product</button>
        </div>
      </header>

      <section>
        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>No products found.</div>
        ) : view === "list" ? (
          <ListView items={visible} onEdit={openEdit} />
        ) : (
          <CardView items={visible} onEdit={openEdit} />
        )}

        <Pagination
          total={filtered.length}
          pageSize={pageSize}
          page={page}
          onChange={(p) => setPage(p)}
        />
      </section>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit Product" : "Add Product"}>
        <ProductForm initial={editing || undefined} onCancel={closeModal} onSave={saveProduct} />
      </Modal>
    </div>
  );
}
