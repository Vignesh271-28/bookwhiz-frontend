export default function LocationFilter({ filters, setFilters }) {
    return (
      <div style={{ display: "flex", gap: 10 }}>
        <select onChange={e => setFilters(f => ({ ...f, language: e.target.value }))}>
          <option value="">Language</option>
          <option value="Tamil">Tamil</option>
          <option value="English">English</option>
        </select>
  
        <select onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))}>
          <option value="">Genre</option>
          <option value="Action">Action</option>
          <option value="Drama">Drama</option>
        </select>
  
        <select onChange={e => setFilters(f => ({ ...f, format: e.target.value }))}>
          <option value="">Format</option>
          <option value="2D">2D</option>
          <option value="3D">3D</option>
          <option value="IMAX">IMAX</option>
        </select>
      </div>
    );
  }