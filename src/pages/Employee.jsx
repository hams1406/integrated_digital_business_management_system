import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/employees";

const emptyEmployee = {
  employee_code: "",
  name: "",
  department: "Management",
  position: "",
  email: "",
  phone: "",
  status: "Active",
};

function Employee() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    ...emptyEmployee,
  });

  // Authentication headers
  const getHeaders = (json = false) => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please login again.");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (json) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        headers: getHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load employees"
        );
      }

      const data = Array.isArray(result)
        ? result
        : result.data;

      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
      setEmployees([]);
      alert(error.message || "Unable to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add employee
  const handleAddEmployee = async () => {
    if (
      !newEmployee.employee_code.trim() ||
      !newEmployee.name.trim() ||
      !newEmployee.department ||
      !newEmployee.position.trim() ||
      !newEmployee.email.trim() ||
      !newEmployee.phone.trim()
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(newEmployee),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to add employee"
        );
      }

      alert("Employee added successfully!");

      setShowForm(false);
      setNewEmployee({ ...emptyEmployee });

      await fetchEmployees();
    } catch (error) {
      console.error("Add error:", error);
      alert(error.message || "Unable to add employee");
    } finally {
      setSaving(false);
    }
  };

  // Open edit form
  const handleEdit = (employee) => {
    setEditEmployee({ ...employee });
    setShowForm(false);
  };

  // Update employee
  const handleUpdate = async () => {
    if (
      !editEmployee?.employee_code?.trim() ||
      !editEmployee?.name?.trim() ||
      !editEmployee?.department ||
      !editEmployee?.position?.trim() ||
      !editEmployee?.email?.trim() ||
      !editEmployee?.phone?.trim()
    ) {
      alert("Please fill all fields");
      return;
    }

    if (!editEmployee.id) {
      alert("Employee ID is missing");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/${editEmployee.id}`,
        {
          method: "PUT",
          headers: getHeaders(true),
          body: JSON.stringify({
            employee_code: editEmployee.employee_code,
            name: editEmployee.name,
            department: editEmployee.department,
            position: editEmployee.position,
            email: editEmployee.email,
            phone: editEmployee.phone,
            status: editEmployee.status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to update employee"
        );
      }

      alert("Employee updated successfully!");

      setEditEmployee(null);
      await fetchEmployees();
    } catch (error) {
      console.error("Update error:", error);
      alert(error.message || "Unable to update employee");
    } finally {
      setSaving(false);
    }
  };

  // Delete employee
  const handleDelete = async (id) => {
    if (!window.confirm("Do you want to delete this employee?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to delete employee"
        );
      }

      alert("Employee deleted successfully!");
      await fetchEmployees();
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message || "Unable to delete employee");
    }
  };

  // Search employees
  const filteredEmployees = employees.filter((employee) => {
    const text = search.toLowerCase();

    return [
      employee.employee_code,
      employee.id,
      employee.name,
      employee.department,
      employee.position,
      employee.email,
      employee.phone,
    ].some((value) =>
      String(value || "").toLowerCase().includes(text)
    );
  });

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status === "Inactive"
  ).length;

  const departments = new Set(
    employees.map((employee) => employee.department).filter(Boolean)
  ).size;

  const changeNewEmployee = (event) => {
    const { name, value } = event.target;

    setNewEmployee((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const changeEditEmployee = (event) => {
    const { name, value } = event.target;

    setEditEmployee((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  return (
    <main style={styles.main}>
      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Employee Management</h1>
          <p style={styles.description}>
            Manage employees, departments and employee information
          </p>
        </div>

        <button
          style={styles.addButton}
          onClick={() => {
            setNewEmployee({ ...emptyEmployee });
            setEditEmployee(null);
            setShowForm(true);
          }}
        >
          + Add Employee
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <SummaryCard
          icon="👥"
          title="Total Employees"
          value={totalEmployees}
          color="#2563eb"
          background="#eff6ff"
        />

        <SummaryCard
          icon="🟢"
          title="Active Employees"
          value={activeEmployees}
          color="#16a34a"
          background="#f0fdf4"
        />

        <SummaryCard
          icon="🔴"
          title="Inactive Employees"
          value={inactiveEmployees}
          color="#dc2626"
          background="#fef2f2"
        />

        <SummaryCard
          icon="🏢"
          title="Departments"
          value={departments}
          color="#7c3aed"
          background="#f5f3ff"
        />
      </div>

      {/* Add Employee Form */}
      {showForm && (
        <EmployeeForm
          title="Add New Employee"
          employee={newEmployee}
          onChange={changeNewEmployee}
          onSave={handleAddEmployee}
          onCancel={() => setShowForm(false)}
          saving={saving}
          saveText="Add Employee"
        />
      )}

      {/* Edit Employee Form */}
      {editEmployee && (
        <EmployeeForm
          title="Edit Employee"
          employee={editEmployee}
          onChange={changeEditEmployee}
          onSave={handleUpdate}
          onCancel={() => setEditEmployee(null)}
          saving={saving}
          saveText="Save Changes"
        />
      )}

      {/* Search */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Search employees..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={styles.search}
        />

        <span style={styles.showing}>
          Showing {filteredEmployees.length} employees
        </span>
      </div>

      {/* Employee Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h2 style={{ margin: 0 }}>Employee Directory</h2>
          <p style={styles.description}>
            Complete list of company employees
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Position</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.empty}>
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td style={styles.td}>
                      <strong>{employee.name}</strong>
                      <br />
                      <small>
                        {employee.employee_code || employee.id}
                      </small>
                    </td>

                    <td style={styles.td}>
                      {employee.department}
                    </td>

                    <td style={styles.td}>
                      {employee.position}
                    </td>

                    <td style={styles.td}>
                      <div>{employee.email}</div>
                      <small>{employee.phone}</small>
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background:
                            employee.status === "Active"
                              ? "#dcfce7"
                              : "#fee2e2",
                          color:
                            employee.status === "Active"
                              ? "#15803d"
                              : "#dc2626",
                        }}
                      >
                        ● {employee.status}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <button
                        style={styles.editButton}
                        onClick={() => handleEdit(employee)}
                      >
                        Edit
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDelete(employee.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

// Summary Card Component
function SummaryCard({
  icon,
  title,
  value,
  color,
  background,
}) {
  return (
    <div style={styles.card}>
      <div
        style={{
          ...styles.iconBox,
          background,
        }}
      >
        {icon}
      </div>

      <div>
        <p style={styles.cardLabel}>{title}</p>
        <h2 style={styles.cardValue}>{value}</h2>
        <span style={{ color, fontSize: "13px" }}>
          Employee details
        </span>
      </div>
    </div>
  );
}

// Employee Form Component
function EmployeeForm({
  title,
  employee,
  onChange,
  onSave,
  onCancel,
  saving,
  saveText,
}) {
  return (
    <div style={styles.form}>
      <div style={styles.formHeader}>
        <h2 style={{ margin: 0 }}>{title}</h2>

        <button onClick={onCancel} style={styles.cancelButton}>
          ✕
        </button>
      </div>

      <div style={styles.formGrid}>
        <input
          name="employee_code"
          placeholder="Employee Code"
          value={employee.employee_code || ""}
          onChange={onChange}
          style={styles.input}
        />

        <input
          name="name"
          placeholder="Employee Name"
          value={employee.name || ""}
          onChange={onChange}
          style={styles.input}
        />

        <input
          name="position"
          placeholder="Position"
          value={employee.position || ""}
          onChange={onChange}
          style={styles.input}
        />

        <select
          name="department"
          value={employee.department || "Management"}
          onChange={onChange}
          style={styles.input}
        >
          <option value="Management">Management</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Sales">Sales</option>
          <option value="Inventory">Inventory</option>
          <option value="IT">IT</option>
          <option value="Marketing">Marketing</option>
        </select>

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={employee.email || ""}
          onChange={onChange}
          style={styles.input}
        />

        <input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={employee.phone || ""}
          onChange={onChange}
          style={styles.input}
        />

        <select
          name="status"
          value={employee.status || "Active"}
          onChange={onChange}
          style={styles.input}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? "Saving..." : saveText}
        </button>

        <button
          onClick={onCancel}
          disabled={saving}
          style={styles.cancelActionButton}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Page Styles
const styles = {
  main: {
    padding: "30px",
    minHeight: "100vh",
    background: "#f8fafc",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#0f172a",
  },

  description: {
    marginTop: "8px",
    color: "#64748b",
  },

  addButton: {
    padding: "12px 20px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  },

  card: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "white",
    padding: "22px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
  },

  iconBox: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    flexShrink: 0,
  },

  cardLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },

  cardValue: {
    margin: "6px 0",
    color: "#0f172a",
    fontSize: "25px",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    background: "white",
    padding: "18px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
  },

  search: {
    flex: 1,
    minWidth: "200px",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
  },

  showing: {
    color: "#64748b",
    fontSize: "14px",
  },

  tableContainer: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },

  tableHeader: {
    padding: "22px",
    borderBottom: "1px solid #e2e8f0",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },

  th: {
    padding: "15px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "16px 15px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "14px",
  },

  empty: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
  },

  badge: {
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  editButton: {
    padding: "7px 10px",
    marginRight: "6px",
    background: "#eff6ff",
    color: "#2563eb",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  deleteButton: {
    padding: "7px 10px",
    background: "#fef2f2",
    color: "#dc2626",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  form: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },

  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  saveButton: {
    padding: "11px 20px",
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
  },

  cancelButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#f1f5f9",
    cursor: "pointer",
  },

  cancelActionButton: {
    padding: "11px 20px",
    marginLeft: "10px",
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },
};

export default Employee;