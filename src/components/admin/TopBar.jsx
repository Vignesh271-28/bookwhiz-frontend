export default function Topbar() {
    return (
      <header className="topbar">
        <div>
          <p className="breadcrumb">Home / Dashboard</p>
          <h3>Dashboard</h3>
        </div>
  
        <div className="topbar-right">
          <button className="btn">Generate Reports</button>
          <div className="profile">
            <span>Robert Johnson</span>
            <small>Super Admin</small>
          </div>
        </div>
      </header>
    );
  }