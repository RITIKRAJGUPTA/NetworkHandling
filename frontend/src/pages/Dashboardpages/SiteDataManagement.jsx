import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function SiteDataManagement() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [formData, setFormData] = useState({
    state: "", district: "", block: "", gp: "", latitude: "", longitude: "",
    mgmtIpAddress: "", exicomDeviceId: "", blockCode: "",
    solarType: "not enable", ebType: "temporary", rackType: "block",
    ringNumber: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
  const pollingInterval = useRef(null);

  const getDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const groupSitesByDate = (sitesList) => {
    const today = getDateKey(new Date());
    const yesterday = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const groups = { today: [], yesterday: [], older: [] };
    sitesList.forEach(site => {
      const key = getDateKey(site.createdAt);
      if (key === today) groups.today.push(site);
      else if (key === yesterday) groups.yesterday.push(site);
      else groups.older.push(site);
    });
    return groups;
  };

  const filteredSites = useMemo(() => {
    if (!searchTerm.trim()) return sites;
    const lowerTerm = searchTerm.toLowerCase();
    return sites.filter(site => {
      return (
        site.state?.toLowerCase().includes(lowerTerm) ||
        site.district?.toLowerCase().includes(lowerTerm) ||
        site.block?.toLowerCase().includes(lowerTerm) ||
        site.gp?.toLowerCase().includes(lowerTerm) ||
        site.mgmtIpAddress?.toLowerCase().includes(lowerTerm) ||
        site.exicomDeviceId?.toLowerCase().includes(lowerTerm) ||
        site.blockCode?.toLowerCase().includes(lowerTerm) ||
        site.solarType?.toLowerCase().includes(lowerTerm) ||
        site.ebType?.toLowerCase().includes(lowerTerm) ||
        site.rackType?.toLowerCase().includes(lowerTerm) ||
        site.ringNumber?.toLowerCase().includes(lowerTerm) ||
        site.latitude?.toString().includes(lowerTerm) ||
        site.longitude?.toString().includes(lowerTerm) ||
        site.createdBy?.name?.toLowerCase().includes(lowerTerm)
      );
    });
  }, [sites, searchTerm]);

  const groupedSites = useMemo(() => groupSitesByDate(filteredSites), [filteredSites]);

  const checkPermissions = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await axios.get(`${BACKEND_URL}/api/auth/profile/${userId}`, axiosConfig);
      const user = res.data;
      if (user.role === "employee") {
        if (user.designation === "FE") {
          setCanCreate(true);
          setCanEdit(false);
        } else if (user.designation === "team lead" || user.designation === "L2") {
          setCanCreate(false);
          setCanEdit(true);
        } else {
          setCanCreate(false);
          setCanEdit(false);
        }
      } else {
        setCanCreate(false);
        setCanEdit(false);
      }
    } catch (err) {
      console.log("Permission check failed", err);
    }
  };

  const fetchSitesSilent = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/sites`, axiosConfig);
      setSites(res.data);
      setError("");
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/sites`, axiosConfig);
      setSites(res.data);
      setError("");
    } catch (err) {
      console.error("Fetch sites error:", err);
      setError("Failed to load site data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissions();
    fetchSites();
    pollingInterval.current = setInterval(() => fetchSitesSilent(), 5000);
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSite) {
        await axios.put(`${BACKEND_URL}/api/sites/${editingSite._id}`, formData, axiosConfig);
        toast.success("Site data updated!");
      } else {
        await axios.post(`${BACKEND_URL}/api/sites`, formData, axiosConfig);
        toast.success("Site data added!");
      }
      setShowModal(false);
      setEditingSite(null);
      resetForm();
      await fetchSites();
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      state: "", district: "", block: "", gp: "", latitude: "", longitude: "",
      mgmtIpAddress: "", exicomDeviceId: "", blockCode: "",
      solarType: "not enable", ebType: "temporary", rackType: "block",
      ringNumber: ""
    });
  };

  const handleEdit = (site) => {
    if (!canEdit) return;
    setEditingSite(site);
    setFormData({
      state: site.state, district: site.district, block: site.block, gp: site.gp,
      latitude: site.latitude, longitude: site.longitude,
      mgmtIpAddress: site.mgmtIpAddress, exicomDeviceId: site.exicomDeviceId,
      blockCode: site.blockCode, solarType: site.solarType, ebType: site.ebType, rackType: site.rackType,
      ringNumber: site.ringNumber
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canEdit) return;
    if (!window.confirm("Are you sure you want to delete this site data?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/sites/${id}`, axiosConfig);
      toast.success("Site data deleted");
      await fetchSites();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const exportToExcel = () => {
    const dataToExport = searchTerm.trim() ? filteredSites : sites;
    if (dataToExport.length === 0) {
      toast.warning("No data to export");
      return;
    }
    const exportData = dataToExport.map(site => ({
      "State": site.state,
      "District": site.district,
      "Block": site.block,
      "GP": site.gp,
      "Latitude": site.latitude,
      "Longitude": site.longitude,
      "MGMT IP Address": site.mgmtIpAddress,
      "Exicom Device ID": site.exicomDeviceId,
      "Block Code": site.blockCode,
      "Solar Type": site.solarType,
      "EB Type": site.ebType,
      "Rack Type": site.rackType,
      "Ring Number": site.ringNumber,
      "Created By": site.createdBy?.name || "N/A",
      "Created At": new Date(site.createdAt).toLocaleString(),
      "Last Updated": new Date(site.updatedAt).toLocaleString()
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Site_Data");
    XLSX.writeFile(workbook, `Site_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel report downloaded successfully!");
  };

  const renderTableSection = (title, sitesArray) => {
  if (sitesArray.length === 0) return null;

  const isToday = title === "Today's Sites";

  return (
    <div className="table-section" key={title}>
      <h4 className="section-title">
        {title}
        {isToday && <span className="today-badge">🆕 New</span>}
      </h4>

      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>State</th>
              <th>District</th>
              <th>Block</th>
              <th>GP</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>MGMT IP</th>
              <th>Exicom ID</th>
              <th>Block Code</th>
              <th>Solar</th>
              <th>EB Type</th>
              <th>Rack</th>
              <th>Ring Number</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sitesArray.map((site) => (
              <tr key={site._id} className={isToday ? "today-row" : ""}>
                <td data-label="State">{site.state}</td>
                <td data-label="District">{site.district}</td>
                <td data-label="Block">{site.block}</td>
                <td data-label="GP">{site.gp}</td>
                <td data-label="Latitude">{site.latitude}</td>
                <td data-label="Longitude">{site.longitude}</td>
                <td data-label="MGMT IP">{site.mgmtIpAddress}</td>
                <td data-label="Exicom ID">{site.exicomDeviceId}</td>
                <td data-label="Block Code">{site.blockCode}</td>
                <td data-label="Solar">{site.solarType}</td>
                <td data-label="EB Type">{site.ebType}</td>
                <td data-label="Rack">{site.rackType}</td>
                <td data-label="Ring Number">
                  {site.ringNumber || "—"}
                </td>

                <td data-label="Actions">
                  {canEdit ? (
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(site)}
                      >
                        ✏️
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(site._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <span className="readonly">View only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-info"></div><p>Loading site data...</p></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="site-data-container">
        <div className="page-header">
          <div>
            <h3>📍 Site Infrastructure Data</h3>
            <p>Manage site locations, network devices, and power configurations</p>
          </div>
          <div className="header-buttons">
            {canCreate && <button className="add-btn" onClick={() => setShowModal(true)}>+ Add New Site</button>}
            <button className="export-btn" onClick={exportToExcel}>📊 Export Excel</button>
          </div>
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by any field..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button className="clear-search" onClick={() => setSearchTerm("")}>✖</button>}
        </div>

        {filteredSites.length === 0 ? (
          <div className="alert alert-info">
            {sites.length === 0 ? "No site data available." : `No matching sites found for "${searchTerm}".`}
          </div>
        ) : (
          <div className="grouped-sections">
            {renderTableSection("Today's Sites", groupedSites.today)}
            {renderTableSection("Yesterday's Sites", groupedSites.yesterday)}
            {renderTableSection("Older Sites", groupedSites.older)}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="site-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingSite ? "Edit Site Data" : "Add New Site"}</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-field"><label>State *</label><input type="text" name="state" value={formData.state} onChange={handleChange} required /></div>
                    <div className="form-field"><label>District *</label><input type="text" name="district" value={formData.district} onChange={handleChange} required /></div>
                    <div className="form-field"><label>Block *</label><input type="text" name="block" value={formData.block} onChange={handleChange} required /></div>
                    <div className="form-field"><label>GP *</label><input type="text" name="gp" value={formData.gp} onChange={handleChange} required /></div>
                    <div className="form-field"><label>Latitude *</label><input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} required /></div>
                    <div className="form-field"><label>Longitude *</label><input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} required /></div>
                    <div className="form-field"><label>MGMT IP Address *</label><input type="text" name="mgmtIpAddress" value={formData.mgmtIpAddress} onChange={handleChange} required /></div>
                    <div className="form-field"><label>Exicom Device ID *</label><input type="text" name="exicomDeviceId" value={formData.exicomDeviceId} onChange={handleChange} required /></div>
                    <div className="form-field"><label>Block Code *</label><input type="text" name="blockCode" value={formData.blockCode} onChange={handleChange} required /></div>
                    <div className="form-field"><label>Solar Type</label><select name="solarType" value={formData.solarType} onChange={handleChange}><option value="enable">Enable</option><option value="not enable">Not Enable</option></select></div>
                    <div className="form-field"><label>EB Type</label><select name="ebType" value={formData.ebType} onChange={handleChange}><option value="permanent">Permanent</option><option value="temporary">Temporary</option></select></div>
                    <div className="form-field"><label>Rack Type</label><select name="rackType" value={formData.rackType} onChange={handleChange}><option value="block">Block</option><option value="gp">GP</option></select></div>
                    <div className="form-field"><label>Ring Number *</label><input type="text" name="ringNumber" value={formData.ringNumber} onChange={handleChange} required /></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="save-btn" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .site-data-container {
          background: rgba(15, 25, 45, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 28px;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .page-header h3 {
          margin: 0;
          background: linear-gradient(135deg, #ffffff, #00d4ff);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }
        .page-header p {
          margin: 5px 0 0 0;
          color: #9aa4bf;
        }
        .header-buttons {
          display: flex;
          gap: 12px;
        }
        .add-btn {
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          border: none;
          padding: 8px 20px;
          border-radius: 40px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }
        .add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(0,180,216,0.3); }
        .export-btn {
          background: rgba(0,212,255,0.15);
          border: 1px solid rgba(0,212,255,0.3);
          color: #00d4ff;
          padding: 8px 20px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .export-btn:hover {
          background: rgba(0,212,255,0.25);
          transform: translateY(-1px);
        }
        .search-wrapper {
          position: relative;
          margin-bottom: 24px;
          max-width: 400px;
        }
        .search-input {
          width: 100%;
          padding: 10px 40px 10px 16px;
          background: rgba(0,0,0,0.4);
          border: 1px solid #2a3a55;
          border-radius: 40px;
          color: #fff;
          font-size: 0.9rem;
        }
        .search-input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.2rem;
          cursor: pointer;
        }
        .clear-search:hover { color: #00d4ff; }
        .grouped-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .table-section h4 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: #00d4ff;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .today-badge {
          background: rgba(0,212,255,0.2);
          color: #00d4ff;
          font-size: 0.7rem;
          padding: 2px 10px;
          border-radius: 20px;
          font-weight: 500;
        }
        .today-row {
          background: rgba(0,212,255,0.05);
          border-left: 3px solid #00d4ff;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #2a3a55;
          background: rgba(10,18,32,0.5);
        }
        .modern-table {
          width: 100%;
          border-collapse: collapse;
          color: #cbd5e1;
        }
        .modern-table th {
          background: rgba(0,212,255,0.05);
          color: #00d4ff;
          padding: 12px;
          font-size: 0.75rem;
          text-transform: uppercase;
          border-bottom: 1px solid #2a3a55;
        }
        .modern-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #1e2a3a;
        }
        .modern-table tbody tr:hover {
          background: rgba(0,212,255,0.05);
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .edit-btn, .delete-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
        }
        .edit-btn { color: #00d4ff; }
        .delete-btn { color: #ef4444; }
        .edit-btn:hover { background: rgba(0,212,255,0.2); }
        .delete-btn:hover { background: rgba(239,68,68,0.2); }
        .readonly {
          color: #7f8fa4;
          font-size: 0.8rem;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        .site-modal {
          background: #0f172a;
          border-radius: 28px;
          border: 1px solid rgba(0,212,255,0.3);
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 28px;
          border-bottom: 1px solid #2a3a55;
        }
        .modal-header h3 { color: #00d4ff; margin: 0; }
        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #94a3b8;
        }
        .close-btn:hover { color: #00d4ff; }
        .modal-body { padding: 28px; }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .form-field label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: #b0bedb;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .form-field input, .form-field select {
          width: 100%;
          padding: 10px;
          background: rgba(0,0,0,0.4);
          border: 1px solid #2a3a55;
          border-radius: 20px;
          color: #fff;
        }
        .form-field input:focus, .form-field select:focus { outline: none; border-color: #00d4ff; box-shadow: 0 0 12px rgba(0,212,255,0.2); }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 28px;
          border-top: 1px solid #2a3a55;
        }
        .cancel-btn {
          background: #1e293b;
          border: none;
          color: #cbd5e1;
          padding: 8px 20px;
          border-radius: 40px;
          cursor: pointer;
        }
        .save-btn {
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          border: none;
          color: white;
          padding: 8px 24px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr; }
          .modern-table thead { display: none; }
          .modern-table tbody tr {
            display: block;
            margin-bottom: 16px;
            border: 1px solid #2a3a55;
            border-radius: 16px;
            padding: 12px;
          }
          .modern-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: none;
          }
          .modern-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #00d4ff;
            width: 40%;
          }
          .grouped-sections {
            gap: 24px;
          }
          .table-section h4 {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
}